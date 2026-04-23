# ChatDa — 기획 정리 (v4.2, 2026-04-18 업데이트)

> **최신 기획서.** 이전 버전(v3 종합본, 모임/3트랙 구조)은 [`ChatDa-v3-archive.md`](ChatDa-v3-archive.md) 에 보존.
>
> **v4.2 주요 변경** (2026-04-18):
> - Status 5개 → **3개** (Student / Visitor / Resident). Korean nationality → 자동 `local`.
> - 필수 필드 추가: **Gender** (Male/Female/Other).
> - 옵션 필드 추가: **Age** (18–99).
> - Student 선택 시 **School 필수** (네트워크 매칭 트리거).
> - Seoul 선택 시 **District sub-picker** (25개 구, 유명도 순).
> - Location 라벨 "Current" → **"Location in Korea (current or planned)"** — 아직 안 온 유저도 등록 가능.
> - Bio + "What brings you here?" → **Step 2 (프로필 페이지)로 이동**. Step 1 간소화.
> - 체류 기간: 모든 non-local 상태에 **arrived + departed** 둘 다 입력 가능. Expat/Worker는 month 정밀도, Student/Visitor는 date.
> - 랜딩 tag: "cross-cultural network" → **"international community"**.

## 한 줄 요약

**한국에 있는 외국인과 로컬을 프로필 기반으로 연결하는 플랫폼.** 초기 Facebook이 하버드 학생 명부였던 것처럼, ChatDa는 "한국판 외국인 The Facebook"으로 시작한다.

---

## 풀고자 하는 문제

한국에 있는 외국인들은 필요한 사람을 찾을 방법이 없다.

- Facebook 그룹에 "누구 아는 사람?" 던지고 기도하는 게 유일한 방법
- 정보가 피드에 흘러가서 같은 질문이 끝없이 반복됨
- HelloTalk은 온라인/글로벌이라 로컬 연결이 안 됨
- Meetup은 주최자 중심이라 참가자에게 선택권이 없음
- MEEFF는 카드 스와이프 방식이라 목적성 있는 매칭 불가 (데이팅 앱화됨)
- 한국 특유의 본인인증/네이버·카카오 생태계 진입장벽

**실제 사례 (스레드 캡처 기반)**

- 외국인이 한국에서 특정 스타일 사진작가를 찾지 못해 인스타에 글 올림
- 크리에이터가 한국 방문 전 협업할 클리닉/브랜드를 찾지 못해 스레드에 글 올림

---

## 핵심 컨셉

### 프로필 기반 매칭

이벤트에 맞춰 가는 게 아니라, **내 조건에 맞는 사람을 내가 찾는 구조.**

### 양면 플랫폼

| 외국인 쪽 | 한국인(로컬) 쪽 |
| --- | --- |
| 한국어 튜터 찾기 | 원어민 강사 구하기 |
| 사진작가 찾기 | 외국인 고객 확보 |
| 비자/행정 도움 | 외국인 대상 서비스 홍보 |
| 로컬 친구 만들기 | 해외 인플루언서 협업 |

### 유저 라이프사이클

1. **한국 오기 전** — 탐색, 사전 네트워킹
2. **한국에 있는 동안** — 사람 만나고, 서비스 연결
3. **한국 떠난 후** — 경험 공유, 새로 오는 사람에게 조언

→ 여행 끝나도 유저가 이탈하지 않는 구조

---

## 랜딩 카피

- **Tag:** Korea's international community
- **Headline:** See who else is here in Korea.
- **Subline:** The person you're looking for already has a profile here.
- **CTA:** Browse Profiles → (또는 See who's here →)
- **푸터 라인:** Exchange students · Expats · Creators · Digital nomads — all in Korea

---

## 플랫폼 구조

이벤트나 유저 유형(외국인/로컬)이 아닌 **목적 기반** 구조.

### 네비게이션 단계별 확장

**1단계 (MVP):** People | Meetups

- People이 **첫 번째 탭** (핵심)
- Meetups는 이미 존재 (부트스트랩 수단)
- Feed는 제외 (사람 모이기 전엔 텅 비어 보임)

**2단계 (유저 쌓인 후):** People | Meetups | Gigs

- Gigs = 튜터링, 촬영, 모델, 번역 등 구인/구직 매칭

| 탭 | 설명 |
| --- | --- |
| **People** | 전체 프로필 탐색, 필터로 국적/지역/관심사 검색 |
| **Meetups** | 오프라인 모임 (부트스트랩 수단) |
| **Gigs** (2단계) | 튜터링, 촬영, 모델, 번역 등 필요한 일 매칭 |

---

## UI/UX 방향

### 참고 서비스

**LinkedIn의 뼈대 + Airbnb의 카드 + Bumble의 톤**

- **LinkedIn에서** — 프로필 카드 기반 탐색, 검색/필터, connect 요청 구조, 프로필 완성도 % 표시
- **Airbnb에서** — 카드형 리스트 + 필터 조합, 시각적으로 한눈에 들어오는 그리드
- **Bumble에서** — 캐주얼하고 친근한 톤, 관심사 태그

### 피해야 할 UI

- **페이스북 스타일 (피드 중심)** — 콘텐츠 소비 구조라 "사람 찾기" 목적과 맞지 않음
- **MEEFF/Tinder 스타일 (카드 스와이프)** — 외모 기반 선택이라 목적성 있는 매칭 불가, 데이팅 앱화 위험
- **LinkedIn의 딱딱한 비즈니스 톤** — 이력서 느낌은 빼고 자기소개 느낌으로
- **복잡한 프로필 구조 (경력/학력/추천서 등)** — 가볍게 유지

### ChatDa만의 디자인 원칙

- 다크 테마 + 핑크 그라데이션 유지 (현재 랜딩 분위기)
- 프로필 카드는 사진이 크고 시각적
- 상단에 필터 바 (국적, 지역, 태그)
- 아래에 프로필 카드 그리드
- 카드: 사진 + 이름 + 국적 + 한 줄 소개 + 태그
- 카드 클릭 → 상세 프로필 + connect 버튼

---

## 프로필 설계

### Step 1 — 가입 시 (30초 목표, 5~7 필드)

**필수 (모두 공통)**
1. **프로필 사진** — Google 사진 자동 프리필, 업로드 교체 가능
2. **Display name** — Google 이름 자동 프리필, 수정 가능
3. **Gender** — Male / Female / Other (3-way segmented)
4. **Nationality** — 국적 combobox (196개, 유명도 순 상단 22개 + 알파벳 순 하단)
5. **I am a... (status)** — Student / Visitor / Resident 중 택 1. **Korean nationality 선택 시 자동 `local` 세팅 + 피커 숨김** (Koreans 전용 fast-path).
6. **Location in Korea (current or planned)** — 광역 14개 드롭다운. **Seoul 선택 시 District** 25개 구 sub-picker(optional, 유명도 순). "planned"를 붙인 이유: 아직 안 온 예비 방문자·학생도 가입 가능하게.

**조건부 필수**
7. **School** — status가 Student일 때만 노출 + 필수. 22개 한국 대학 프리셋 + free text 허용 (해외대·비공식 과정 대응). **네트워크 효과 트리거** — 같은 학교 학생끼리 빠르게 연결되게.

**옵션 (Step 1 화면에 함께 노출)**
- **Age** (18–99 정수)
- **Social links** accordion (Facebook → Instagram → Threads → X → LinkedIn → TikTok 순서) — **connect accepted 후에만 공개**

> **왜 status가 Step 1에 있나?**
> People 탭의 핵심 필터(로컬/외국인 구분)라 Step 1 필수. 빈 값이 많으면 필터 품질이 떨어져 매칭 경험 저하.
>
> **왜 Bio와 "What brings you here?"는 Step 2로 갔나 (2026-04-18)?**
> Step 1 진입 장벽을 낮추기 위해. motives는 고려 시간이 필요한 판단이고 bio는 좋은 문장이 생각나야 쓸 수 있음. 양쪽 다 Profile 페이지에서 채우도록 이동 — ProfileCompleteness 바로 완성도 유도.

### Step 2 — 프로필 페이지에서 채우기 (전부 optional)

- **One-liner bio** (100자) — 2026-04-18 Step 1에서 이동
- **What brings you here?** — 10개 프리셋 모티브 + ✨ Other 자유 입력 (30자), **합산 최대 3개**. 2026-04-18 Step 1에서 이동
- **체류 기간** — 모든 non-local status에 arrived + departed 둘 다 입력 가능:
  - Resident(expat): "Living here since" / "Planning to leave" — **month** 정밀도 (`<input type="month">`, day=01 저장)
  - Visitor: "Arrival" / "Departure" — **date** 정밀도
  - Student: "Semester start" / "Semester end" — **date** 정밀도
  - Local: 해당 섹션 숨김
- **Languages** (언어 + 레벨: native/fluent/conversational/learning)
- **Interests** — 20개 프리셋 (최대 10개, 아이스브레이커용)
- **Tags (can_do / looking_for)** — 20개 프리셋 + custom inline text(1~24자), **카테고리별 hard cap 3**. 서버가 400으로 enforce.

### 태그 시스템

- can_do / looking_for 두 카테고리. 각각 **최대 3개** (프리셋 + custom 합산).
- Custom 태그는 dashed border로 시각 구분.
- 자유 입력이지만 길이 제한 + 카테고리별 cap으로 난립 방지.
- A의 looking_for ↔ B의 can_do 매칭 (People 필터 "What they offer"는 can_do 기준).

### 모티브(looking_for) 시스템

- Step 2. 10개 프리셋(language exchange / local friends / work networking / creative collab / study tutoring / travel buddy / food nightlife / k-pop fandom / visa life help / just exploring) + ✨ Other 자유 입력 1개 슬롯.
- 서버 스키마: `users.looking_for text[]` (프리셋 id) + `users.looking_for_custom text` (최대 30자).
- People 필터 "What brings them"에는 **프리셋 10개만 노출** (custom은 그룹화 의미 없어 제외).

---

## 초기 전략 (부트스트랩)

### 닭과 달걀 해결

1. **직접 밋업 주최** (홍대/이태원 등)
2. 밋업 참가 시 **프로필 등록 필수**
3. 참가자들이 서로 프로필을 보는 경험
4. 프로필 풀이 쌓이면 밋업 없이도 매칭 작동 시작

→ **밋업은 부트스트랩 수단이지 목적이 아님**

### 호기심 유도

- 랜딩페이지에서 가입 전에도 프로필 카드 일부를 노출
- "누가 있는지 보려면 가입해야지" 심리 활용
- 프로필 완성도 % 표시로 자발적 정보 입력 유도

---

## 경쟁 서비스 분석

| 서비스 | 방식 | 한계 | ChatDa의 차별점 |
| --- | --- | --- | --- |
| **Facebook 그룹** | 게시글 + 댓글 | 정보 흘러감, 프로필 없음, 검색 안 됨 | 프로필 기반, 태그 검색, 정보 축적 |
| **HelloTalk** | 온라인 채팅 | 글로벌, 로컬 연결 안 됨 | 한국에 지금 있는 사람끼리 오프라인 연결 |
| **Meetup** | 이벤트 중심 | 주최자 중심, 프로필 매칭 아님 | 개인 중심, 내 조건으로 상대를 찾음 |
| **Preply** | 유료 튜터 마켓 | 화상 수업, 거래 관계 | 동등한 교환 관계, 실제 만남 |
| **MEEFF** | Tinder식 스와이프 | 외모 기반, 데이팅 앱화, 가짜 계정 많음 | 조건/기술 기반 검색, 목적성 있는 매칭 |

### MEEFF와의 구체적 차이

|  | MEEFF | ChatDa |
| --- | --- | --- |
| UI | 카드 스와이프 (Tinder식) | 프로필 검색/필터 (LinkedIn식) |
| 목적 | 친구/연애 | 목적 기반 연결 (튜터, 작가, 로컬 서비스) |
| 선택 기준 | 외모 | 조건/기술 |
| 톤 | 데이팅 앱 | 실용적 네트워크 |

**핵심:** ChatDa는 **"한국에서 사람 찾을 때 쓰는 검색 엔진"**에 가까워야지, 데이팅 앱 포맷을 따라가면 MEEFF와 똑같아짐.

---

## 수익 모델 (향후)

- 기본 검색/매칭: **무료**
- 브랜드/업체가 조건 맞는 프로필 다수 열람: **프리미엄**
- 프로필 상단 노출, 인증 뱃지 등 추가 가능

---

## MVP (최소 기능 제품)

1. Google 로그인
2. 프로필 등록 (이름, 국적, 위치, 태그)
3. 프로필 검색/필터
4. 연결 요청 (connect 후 소셜 링크 공개)

**이 4가지로 핵심 가치 테스트 가능.**

---

## 확장 가능성

- 국가 확장: "See who else is here in Japan / Berlin / Bangkok"
- 커뮤니티 기능: 피드, 게시판 (유저 밀도 확보 후)
- 살아있는 지식 베이스: 체류 경험이 프로필에 축적
- Gigs 탭 추가 (구인/구직 매칭)
