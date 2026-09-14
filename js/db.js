/**
 * MathClay Junior - Supabase 클라우드 데이터베이스 관리 모듈
 * 외심/내심 탐구 결과를 Supabase PostgreSQL 테이블에 실시간 저장 및 조회합니다.
 */

const MathClayDB = {
  // 기본 설정 또는 localStorage에 저장된 설정 로드
  supabaseClient: null,
  configKey: "mathclay_supabase_config",

  // Supabase 기본 프로젝트 정보 (선생님의 Supabase 클라우드 프로젝트 연동 완료)
  defaultConfig: {
    url: "https://jlviguxkiswpnzteqfcu.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdmlndXhraXN3cG56dGVxZmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNjkwODYsImV4cCI6MjEwNDk0NTA4Nn0.wEr4aJv2U3XETa2tPUhancwM-VG_p7Trz1vZUoaBs-4"
  },

  getConfig() {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return parsed;
        }
      }
    } catch (e) {}
    return this.defaultConfig;
  },

  saveConfig(url, anonKey) {
    const cleanUrl = (url || "").trim().replace(/\/$/, "");
    const cleanKey = (anonKey || "").trim();
    localStorage.setItem(
      this.configKey,
      JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
    );
    this.supabaseClient = null; // 클라이언트 재초기화
    this.init();
  },

  // Supabase 클라이언트 초기화
  init() {
    if (this.supabaseClient) return this.supabaseClient;

    const config = this.getConfig();
    if (!config.url || !config.anonKey) {
      return null;
    }

    if (window.supabase && typeof window.supabase.createClient === "function") {
      try {
        this.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
        return this.supabaseClient;
      } catch (e) {
        console.error("Supabase 클라이언트 생성 실패:", e);
        return null;
      }
    }

    return null;
  },

  // Supabase 연결 여부 확인
  isConnected() {
    return this.init() !== null;
  },

  // 탐구 결과 Supabase DB 저장
  async saveRecord(record) {
    const client = this.init();

    // Supabase 컬럼 규격에 매핑
    const payload = {
      id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      student_name: record.studentName || "학생 탐구자",
      triangle_type: record.triangleType || "예각삼각형",
      circum_location: record.circumLocation || "내부",
      circum_x: Number(record.circumcenter?.x || 0),
      circum_y: Number(record.circumcenter?.y || 0),
      circum_r: Number(record.circumcenter?.r || 0),
      in_x: Number(record.incenter?.x || 0),
      in_y: Number(record.incenter?.y || 0),
      in_r: Number(record.incenter?.r || 0),
      vertex_a_x: Number(record.vertices?.A.x || 0),
      vertex_a_y: Number(record.vertices?.A.y || 0),
      vertex_b_x: Number(record.vertices?.B.x || 0),
      vertex_b_y: Number(record.vertices?.B.y || 0),
      vertex_c_x: Number(record.vertices?.C.x || 0),
      vertex_c_y: Number(record.vertices?.C.y || 0),
      side_a: Number(record.sideLengths?.a || 0),
      side_b: Number(record.sideLengths?.b || 0),
      side_c: Number(record.sideLengths?.c || 0),
      memo: record.memo || ""
    };

    if (client) {
      try {
        const { data, error } = await client
          .from("incenter_records")
          .insert([payload])
          .select();

        if (error) {
          console.warn("Supabase 저장 오류 (테이블 설정 또는 RLS 확인 필요):", error);
          this.backupToLocal(payload);
          return { success: false, error: error.message, isLocal: true, payload };
        }

        return { success: true, isLocal: false, data: data[0] };
      } catch (err) {
        console.error("Supabase API 호출 실패:", err);
        this.backupToLocal(payload);
        return { success: false, error: err.message, isLocal: true, payload };
      }
    } else {
      // Supabase 설정이 아직 입력되지 않은 경우 로컬에 임시 보관
      this.backupToLocal(payload);
      return { success: true, isLocal: true, payload };
    }
  },

  // 탐구 결과 Supabase DB에서 전체 조회
  async getAllRecords() {
    const client = this.init();

    if (client) {
      try {
        const { data, error } = await client
          .from("incenter_records")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((d) => this.formatRecordFromSupabase(d));
        } else {
          console.warn("Supabase 조회 실패, 로컬 캐시 사용:", error);
        }
      } catch (err) {
        console.warn("Supabase 네트워크 조회 실패, 로컬 캐시 사용:", err);
      }
    }

    return this.getLocalBackupRecords();
  },

  // 특정 탐구 기록 삭제
  async deleteRecord(id) {
    const client = this.init();

    if (client) {
      try {
        await client.from("incenter_records").delete().eq("id", id);
      } catch (e) {
        console.warn("Supabase 삭제 실패:", e);
      }
    }

    // 로컬 백업 동기화 삭제
    try {
      const list = this.getLocalBackupRecords().filter((r) => r.id !== id);
      localStorage.setItem("mathclay_incenter_backup", JSON.stringify(list));
    } catch (e) {}

    return true;
  },

  // Supabase 로우 -> 프론트엔드 레코드 형식 변환
  formatRecordFromSupabase(d) {
    const dateObj = new Date(d.created_at);
    const dateStr = !isNaN(dateObj)
      ? dateObj.toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    return {
      id: d.id,
      studentName: d.student_name,
      triangleType: d.triangle_type,
      circumLocation: d.circum_location,
      createdDateStr: dateStr,
      vertices: {
        A: { x: Number(d.vertex_a_x), y: Number(d.vertex_a_y), name: "A" },
        B: { x: Number(d.vertex_b_x), y: Number(d.vertex_b_y), name: "B" },
        C: { x: Number(d.vertex_c_x), y: Number(d.vertex_c_y), name: "C" }
      },
      circumcenter: {
        x: Number(d.circum_x),
        y: Number(d.circum_y),
        r: Number(d.circum_r)
      },
      incenter: {
        x: Number(d.in_x),
        y: Number(d.in_y),
        r: Number(d.in_r)
      },
      sideLengths: {
        a: Number(d.side_a),
        b: Number(d.side_b),
        c: Number(d.side_c)
      },
      memo: d.memo
    };
  },

  // 로컬 백업 관리
  backupToLocal(payload) {
    try {
      const list = this.getLocalBackupRecords();
      list.unshift(this.formatRecordFromSupabase(payload));
      localStorage.setItem("mathclay_incenter_backup", JSON.stringify(list.slice(0, 100)));
    } catch (e) {}
  },

  getLocalBackupRecords() {
    try {
      const data = localStorage.getItem("mathclay_incenter_backup");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Supabase 테이블 생성용 SQL 스크립트 제공
  getSQLSchema() {
    return `-- Supabase SQL Editor에서 실행할 테이블 생성 쿼리문
CREATE TABLE IF NOT EXISTS incenter_records (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  student_name TEXT,
  triangle_type TEXT,
  circum_location TEXT,
  circum_x NUMERIC,
  circum_y NUMERIC,
  circum_r NUMERIC,
  in_x NUMERIC,
  in_y NUMERIC,
  in_r NUMERIC,
  vertex_a_x NUMERIC,
  vertex_a_y NUMERIC,
  vertex_b_x NUMERIC,
  vertex_b_y NUMERIC,
  vertex_c_x NUMERIC,
  vertex_c_y NUMERIC,
  side_a NUMERIC,
  side_b NUMERIC,
  side_c NUMERIC,
  memo TEXT
);

-- 누구나 읽고 쓸 수 있도록 RLS 활성화 및 공개 정책 부여 (수업용)
ALTER TABLE incenter_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON incenter_records;
CREATE POLICY "Allow public read" ON incenter_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON incenter_records;
CREATE POLICY "Allow public insert" ON incenter_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete" ON incenter_records;
CREATE POLICY "Allow public delete" ON incenter_records FOR DELETE USING (true);
`;
  }
};
