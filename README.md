# 🏫 MathClay 중학수학 - 중학교 수학교사를 위한 인터랙티브 교구 랩

> **클레이모피즘(Claymorphism)** 디자인 스타일로 제작된 **중학교 1~3학년 정규 수학 교육과정 전용** 인터랙티브 시뮬레이션 플랫폼입니다.  
> 고등학교/대학 과정을 배제하고, 중학교 교실의 전자칠판 및 학생 1인 1패드 환경에서 즉시 시연 및 수업에 활용할 수 있도록 제작되었습니다.

---

## ✨ 주요 구성 및 특징

1. **중학교 1~3학년 정규 교육과정 100% 매핑**:
   - **중1 과정**: 소인수분해 & 에라토스테네스의 체(가지치기 트리), 입체도형 회전체와 전개도
   - **중2 과정**: 일차함수 기울기 & 절편 탐구기, 피타고라스 정리(물 채우기 증명), **삼각형 외심/내심 작도기(Supabase 클라우드 DB 연동)**, 두 주사위 확률 실험실
   - **중3 과정**: 삼각비(sin, cos, tan)와 직각삼각형 닮음, 이차함수 포물선과 꼭짓점 이동(농구공 슛), 산점도와 상관관계 & 대푯값 시소 저울

2. **외심/내심 탐구 결과 Supabase 클라우드 데이터베이스 저장 시스템**:
   - 학생/모둠별로 꼭짓점을 드래그하여 탐구한 결과(삼각형 종류, 외심/내심 위치, 세 변의 길이, 관찰 소감)를 **Supabase PostgreSQL 데이터베이스**에 실시간 영구 저장.
   - **과거 탐구 기록 복원(불러오기)**: 저장된 기록 목록에서 `[불러오기]` 클릭 시 당시의 삼각형 모양과 꼭짓점 좌표가 캔버스에 즉시 복원.
   - **다중 단말 실시간 공유**: 교사용 PC 및 학생 태블릿 등 서로 다른 기기에서도 동일한 Supabase 프로젝트를 통해 탐구 결과를 실시간 공유하고 확인 가능.

3. **클레이모피즘(Claymorphism) 인터페이스**:
   - 부드러운 다중 입체 음영(Outset Drop Shadow + Inset Highlight)을 통한 푹신한 3D 점토 질감.
   - 직관적인 드래그 & 슬라이더 조작 및 넉넉한 터치 영역(전자칠판 및 태블릿 터치 최적화).

---

## ⚡ Supabase 데이터베이스 설정 방법

1. [Supabase](https://supabase.com)에 로그인 후 새 프로젝트를 생성합니다.
2. 좌측 메뉴의 **SQL Editor**로 이동하여 아래 SQL을 복사해 실행(Run)합니다:
   ```sql
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

   -- RLS 공개 접근 허용 (수업용, 기존 정책이 있으면 덮어쓰기)
   ALTER TABLE incenter_records ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Allow public read" ON incenter_records;
   CREATE POLICY "Allow public read" ON incenter_records FOR SELECT USING (true);

   DROP POLICY IF EXISTS "Allow public insert" ON incenter_records;
   CREATE POLICY "Allow public insert" ON incenter_records FOR INSERT WITH CHECK (true);

   DROP POLICY IF EXISTS "Allow public delete" ON incenter_records;
   CREATE POLICY "Allow public delete" ON incenter_records FOR DELETE USING (true);
   ```
3. Supabase 대시보드의 **Project Settings -> API**에서 **Project URL**과 **anon/public API Key**를 복사합니다.
4. MathClay 웹사이트의 **[삼각형의 외심과 내심 작도기]** 실행 후 우측 상단의 `[⚙️ Supabase 설정]`을 클릭하여 URL과 Key를 입력하고 저장하면 즉시 클라우드 DB와 연동됩니다!

---

## 🚀 로컬 실행 방법

- 탐색기에서 `index.html` 파일을 더블 클릭하여 웹 브라우저(Chrome, Edge 등)에서 바로 실행할 수 있습니다.
- 또는 파이썬 로컬 서버 실행:
  ```bash
  python -m http.server 3000
  ```
  이후 브라우저에서 `http://localhost:3000` 접속.

---

## ☁️ Vercel 배포

별도의 복잡한 빌드 과정 없이 Vercel에 GitHub 저장소를 연결하여 즉시 배포할 수 있습니다.
Git `push` 시 Vercel에서 수초 내에 자동 배포됩니다.
