/**
 * MathClay Junior - 외심/내심 탐구 결과 데이터베이스 관리 모듈 (IndexedDB + LocalStorage)
 */

const MathClayDB = {
  dbName: "MathClay_Junior_DB",
  storeName: "incenter_circumcenter_records",
  dbVersion: 1,
  dbInstance: null,

  // IndexedDB 초기화
  async init() {
    if (this.dbInstance) return this.dbInstance;

    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn("IndexedDB를 지원하지 않아 LocalStorage로 대체합니다.");
        resolve(null);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("studentName", "studentName", { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.dbInstance = e.target.result;
        resolve(this.dbInstance);
      };

      request.onerror = (e) => {
        console.error("IndexedDB 열기 실패:", e);
        resolve(null);
      };
    });
  },

  // 탐구 결과 데이터베이스 저장 (IndexedDB + LocalStorage 이중 보관)
  async saveRecord(record) {
    const db = await this.init();
    record.id = record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    record.createdAt = record.createdAt || new Date().toISOString();
    record.createdDateStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    // 1. IndexedDB 저장
    if (db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, "readwrite");
          const store = tx.objectStore(this.storeName);
          const req = store.put(record);
          req.onsuccess = () => resolve(true);
          req.onerror = (err) => reject(err);
        });
      } catch (err) {
        console.warn("IndexedDB 저장 중 오류, LocalStorage로 백업:", err);
      }
    }

    // 2. LocalStorage에도 동기화 백업
    try {
      const localList = this.getLocalRecords();
      const existingIdx = localList.findIndex((r) => r.id === record.id);
      if (existingIdx >= 0) {
        localList[existingIdx] = record;
      } else {
        localList.unshift(record);
      }
      localStorage.setItem("mathclay_incenter_records", JSON.stringify(localList));
    } catch (e) {
      console.warn("LocalStorage 백업 실패:", e);
    }

    // 3. Vercel Serverless API가 있는 경우 원격 저장도 시도 (선택적)
    try {
      fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      }).catch(() => {});
    } catch (e) {}

    return record;
  },

  // 전체 탐구 기록 조회
  async getAllRecords() {
    const db = await this.init();

    if (db) {
      try {
        return await new Promise((resolve) => {
          const tx = db.transaction(this.storeName, "readonly");
          const store = tx.objectStore(this.storeName);
          const req = store.getAll();
          req.onsuccess = () => {
            const records = req.result || [];
            records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            resolve(records);
          };
          req.onerror = () => resolve(this.getLocalRecords());
        });
      } catch (e) {
        return this.getLocalRecords();
      }
    }

    return this.getLocalRecords();
  },

  // 특정 기록 삭제
  async deleteRecord(id) {
    const db = await this.init();
    if (db) {
      try {
        await new Promise((resolve) => {
          const tx = db.transaction(this.storeName, "readwrite");
          const store = tx.objectStore(this.storeName);
          store.delete(id);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        });
      } catch (e) {}
    }

    // LocalStorage 삭제 동기화
    try {
      const list = this.getLocalRecords().filter((r) => r.id !== id);
      localStorage.setItem("mathclay_incenter_records", JSON.stringify(list));
    } catch (e) {}
    return true;
  },

  // LocalStorage 읽기 헬퍼
  getLocalRecords() {
    try {
      const data = localStorage.getItem("mathclay_incenter_records");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // 엑셀(CSV) 다운로드 기능
  exportToCSV(records) {
    if (!records || records.length === 0) {
      alert("저장된 탐구 데이터가 없습니다.");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "일시,학생/모둠명,삼각형분류,외심위치(X/Y/반지름),외심위치특징,내심위치(X/Y/반지름),A좌표,B좌표,C좌표,학생관찰메모\n";

    records.forEach((r) => {
      const circumStr = `"${r.circumcenter?.x.toFixed(1) || 0}, ${r.circumcenter?.y.toFixed(1) || 0} (r=${r.circumcenter?.r.toFixed(1) || 0})"`;
      const incenterStr = `"${r.incenter?.x.toFixed(1) || 0}, ${r.incenter?.y.toFixed(1) || 0} (r=${r.incenter?.r.toFixed(1) || 0})"`;
      const ptA = `"${r.vertices?.A.x || 0}, ${r.vertices?.A.y || 0}"`;
      const ptB = `"${r.vertices?.B.x || 0}, ${r.vertices?.B.y || 0}"`;
      const ptC = `"${r.vertices?.C.x || 0}, ${r.vertices?.C.y || 0}"`;
      const memo = `"${(r.memo || "").replace(/"/g, '""')}"`;
      const char = `"${r.circumLocation || ""}"`;

      csvContent += `${r.createdDateStr},"${r.studentName || "학생"}",${r.triangleType},${circumStr},${char},${incenterStr},${ptA},${ptB},${ptC},${memo}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `외심내심_탐구결과_DB_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
