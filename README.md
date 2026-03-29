# 🌱 두레

> 마을 활동이 AI 교육의 교재가 되고, AI 교육이 마을 활동의 기록 방식이 된다.

**한양대학교 사회혁신캡스톤PBL — 카카오와 함께하는 테크포임팩트 2026**
**다로리인 × 큰글씨**

---

## 서비스 소개

두레는 경북 청도군 온마을 배움터의 초등학생들이 마을 활동 후 AI 친구 **마루**와 대화하며 자신의 경험을 기록하는 시스템입니다.

아이들이 부담 없이 AI와 자주 대화하다 보면 자연스럽게 AI 활용 능력이 올라가고, 이 과정에서 쌓인 기록은 **마을 도감**으로 완성되어 부모님께 성장 리포트로 전달됩니다.

### 문제 의식

| 대상 | 문제 |
|---|---|
| 군청 인근 마을 학부모 | "AI 시대에 우리 아이가 뒤처지지 않을까"라는 교육 격차 불안 |
| 외곽 마을 학부모 | 맞벌이로 아이의 일상을 알 수 없는 부모-아이 정보 공백 |
| 다로리인 운영진 | 연 295회 활동이 기록되지 않고 사라짐 |

### 해결 방식

```
온마을 배움터 활동
        ↓
선생님: 활동 태그 입력 (30초)
        ↓
AI: 도감 카드 + 미션 자동 생성
        ↓
아이: 마루와 대화 → 미션 완료 → 카드 획득 + 아이템 지급
        ↓
도감 누적 → 부모 리포트 자동 생성 → 카카오 알림 전송
```

---

## 주요 기능

### 🌳 아이 — 마을 도감

- **AI 친구 마루와 대화**: 오늘 한 활동에 대해 이야기하면 마루가 반추 질문을 던져 생각을 끌어냄
- **마을 도감 카드 수집**: 대화 완료 시 도감 카드 자동 생성 및 저장
- **캐릭터 꾸미기**: 미션 완료 시 아이템 획득, 자기 캐릭터 꾸미기
- **다른 마을 도감 구경**: 7개 마을 아이들의 도감을 마을별로 탐색

### 📋 선생님 — 활동 기록

- **태그 입력만으로 완성**: 활동명과 참여 아이를 선택하면 AI가 카드 내용·미션·보상 아이템 자동 생성
- **역량 태그 자동 추천**: 활동 선택 시 관련 역량 태그 자동 추천
- **실시간 결과 확인**: 생성된 카드와 미션 내용 즉시 확인

### 💌 부모님 — 성장 리포트

- **도감 전체 조회**: 아이가 채운 카드, 직접 한 말, 역량 분석
- **캐릭터 현황**: 획득한 아이템 목록
- **AI 성장 리포트**: 버튼 하나로 이달 활동 전체를 분석한 리포트 자동 생성
- **카카오 알림**: 실서비스 시 매달 자동 발송 예정

### ⚙️ 대시보드 — 운영자 (다로리인)

- 전체 통계 (아이, 카드, 미션, 활동 마을 수)
- 마을별 현황 테이블
- 역량 태그 분포 차트
- 최근 도감 카드 피드
- 아이별 참여 현황

---

## 시작하기

### 요구 사항

- Node.js 18 이상
- npm

### 설치 및 실행

```bash
# 1. 압축 해제 후 폴더 진입
cd dure

# 2. 패키지 설치
npm install

# 3. 서버 실행 (데모 모드)
node server.js
```

브라우저에서 → `http://localhost:8000`

### AI API 연동 (선택)

API 키 없이도 데모 모드로 모든 기능이 동작합니다.
실제 AI를 연동하려면 아래 중 하나의 키를 환경변수로 설정하세요.

```bash
# GPT (OpenAI) — 권장
OPENAI_API_KEY=sk-proj-... node server.js

# Gemini (Google) — 무료 티어 있음
GEMINI_API_KEY=AIza... node server.js

# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

**우선순위**: `OPENAI_API_KEY` > `GEMINI_API_KEY` > `ANTHROPIC_API_KEY` > 데모 모드

### Windows에서 실행 시

```powershell
# PowerShell
$env:OPENAI_API_KEY="sk-proj-..."; node server.js

# 명령 프롬프트(cmd)
set OPENAI_API_KEY=sk-proj-... && node server.js
```

---

## 페이지 구성

| 페이지 | 경로 | 대상 |
|---|---|---|
| 메인 홈 | `/` | 역할 선택 |
| 아이 도감 | `/child.html` | 아이 |
| 활동 기록 | `/teacher.html` | 선생님 |
| 성장 리포트 | `/parent.html` | 부모님 |
| 운영 대시보드 | `/dashboard.html` | 다로리인 운영진 |

---

## API 엔드포인트

| Method | 경로 | 설명 |
|---|---|---|
| GET | `/api/children` | 아이 목록 |
| GET | `/api/activities` | 활동 종류 목록 |
| GET | `/api/villages` | 마을 목록 |
| GET | `/api/activity-tags` | 활동별 역량 태그 매핑 |
| GET | `/api/cards` | 전체 카드 (마을·아이 필터 가능) |
| GET | `/api/missions/:childId` | 아이별 미션 목록 |
| GET | `/api/conversations/:childId` | 아이별 대화 기록 |
| POST | `/api/chat/start` | AI 첫 메시지 생성 |
| POST | `/api/chat` | AI 대화 이어가기 |
| POST | `/api/cards/generate` | 태그 → AI 카드·미션 자동 생성 |
| POST | `/api/conversations/save` | 대화 저장 + 카드 완성 + 아이템 지급 |
| POST | `/api/report/generate` | AI 성장 리포트 생성 |
| GET | `/api/report/:childId` | 리포트 조회 |
| GET | `/api/dashboard` | 대시보드 통계 |

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| 백엔드 | Node.js + Express |
| AI 연동 | 외부 SDK 없이 Node.js 내장 `https` 모듈로 직접 호출 |
| 프론트엔드 | Vanilla HTML / CSS / JavaScript (빌드 도구 없음) |
| 데이터 | 인메모리 (프로토타입) → 실서비스 시 DB 연동 예정 |
| 알림 | 카카오 비즈메시지 API 연동 예정 |

---

## 프로젝트 구조

```
dure/
├── server.js          # 백엔드 서버 (API 라우트 + AI 연동)
├── package.json
├── .env.example       # 환경변수 예시
└── public/
    ├── index.html     # 메인 홈
    ├── child.html     # 아이 도감 + 마루 채팅
    ├── teacher.html   # 선생님 활동 기록
    ├── parent.html    # 부모님 리포트
    ├── dashboard.html # 운영자 대시보드
    └── style.css      # 공통 스타일
```