# 허들링클럽 밋업 MVP · 개발 2인 기능 분담

기준 문서는 [1차 PRD](PRD.md), [작업 기준](FRAMEWORK.md), [디자인 분장](DESIGN_ASSIGNMENTS.md)입니다. 화면 ID·Depth·흐름은 Figma `02 IA & Flow` 페이지(IA-01 · UF-01 · DEV-01)와 같습니다.

**진행 방식**　기능 = 화면 + API + 데이터를 한 묶음으로 나눕니다. 각자 브랜치에서 작업 → PR → 조장 merge → 상대가 main을 받아 싱크 → 마지막에 디자인을 합칩니다.

> **PRD 1차와 다른 점 (2026-11-14 확정)**　ID/PW 로그인(PG-101)을 추가하고, 가입은 온보딩(PG-102)에서 아이디·비밀번호를 만듭니다. PRD 1차·디자인 분장은 "가입 없는 등록" 기준이라 업로드 전에 맞춰야 합니다.

## 0. 나누는 원칙

- **데이터 주인으로 가른다**　A = 사용자·프로필·태그, B = 친구 관계. 같은 테이블을 둘이 쓰지 않습니다.
- **폴더 소유권으로 충돌을 막는다**　자기 폴더만 수정합니다. 공통 파일은 DEV-00에서 미리 만들고, 바꿀 때는 상대에게 먼저 말합니다.
- **계약을 먼저 고정한다**　타입 · API 경로 · `getSession()` 모양을 DEV-00에서 확정해 서로 기다리지 않고 병렬로 개발합니다.
- **홈은 섹션 조립만**　홈 페이지 파일은 공통, 섹션 컴포넌트는 각자 소유합니다.

## 1. 기능 분담표

시작 = 시작할 수 있는 순서입니다. 같은 숫자는 동시에 진행할 수 있습니다.

| 기능 | 담당 | 화면 | API (route handler) | 데이터 | 시작 | 완료 기준 |
|---|---|---|---|---|---|---|
| **DEV-00** 공통 기반 | A+B | 레이아웃 · 하단 탭 · 홈 껍데기 | 없음 (타입 · `getSession()` 스텁 · DB 연결) | 스키마 초안 | 0 | main에 1커밋, 둘 다 pull 후 빌드 통과 |
| **FE-1** 계정 · 로그인/가입 | A | PG-101 로그인 · PG-102 온보딩(가입) · 로그아웃 | `POST /api/auth/signup` · `/login` · `/logout` · `GET /api/me` | users · profiles | 1 | 가입 → 홈, 재로그인, 로그아웃 → 로그인, 세션 유지 |
| **FE-2** 마이 · 프로필 수정 | A | PG-501 마이페이지 | `PATCH /api/me` | profiles.tags | 2 | 태그 저장 후 다음 조회에 반영 |
| **FE-3** 탐색 · 그룹/추천 | A | PG-201 그룹 섹션 · PG-301 · PG-401 · PG-402 | `GET /api/groups` · `/api/groups/[key]` · `/api/recommend` | profiles 집계(읽기) | 2 | 같은 태그 = 같은 그룹, 추천은 공통 태그 많은 순 · 본인·친구 제외 |
| **FE-4** 관계 · 요청/수락 | B | PG-201 받은 요청 · 내 친구 섹션 | `POST /api/relations` · `POST /api/relations/[id]/accept` · `GET /api/relations` | relations | 1 | 두 사람 사이 기록 1건, 중복 요청·수락 재시도해도 그대로 |
| **FE-5** 타인 프로필 | B | PG-601 타인 프로필 | `GET /api/profiles/[id]` (겹치는 태그 · 관계 상태 포함) | profiles + relations(읽기) | 2 | 버튼 4상태: 친구 요청 · 요청 보냄 · 수락 · 친구 |
| **FE-6** QR 연결 | B | PG-602 내 QR · `/p/[id]` 진입 | 없음 (링크 `/p/[id]`) | 없음 | 3 | 스캔 → 프로필, 비로그인은 가입 후 복귀, 자기 QR → PG-501 |
| **FE-7** 공통 피드백 | B | MD-901 토스트 · PG-902 저장 실패 · PG-903 잘못된 QR | 없음 | 없음 | 3 | 실패 시 완료로 표시하지 않고 다시 시도 |

## 2. 디자인 담당 ↔ 개발 기능

디자인을 합칠 때 누구 화면이 어느 기능에 들어가는지입니다.

| 디자인 담당 ([분장](DESIGN_ASSIGNMENTS.md)) | 개발 기능 | 개발 담당 |
|---|---|---|
| 1 · 디자인 리드 / 공통 UI (버튼 4상태 포함) | DEV-00 `components/ui` | A+B |
| 2 · 온보딩 / 마이페이지 | FE-1 · FE-2 | A |
| 3 · 홈 / 내 관계 | FE-3 그룹 섹션 · FE-4 받은 요청·내 친구 섹션 | A · B |
| 4 · 친구추천 / 타인 프로필 | FE-3 추천 · FE-5 타인 프로필 | A · B |
| 5 · 그룹 리스트 / 그룹 상세 | FE-3 | A |
| 6 · 개인 QR / 현장 연결 흐름 | FE-6 | B |
| 로그인 (PG-101, 분장에 없음) | FE-1 | A |

> 로그인 화면은 디자인 분장에 없습니다. 공통 UI로 먼저 만들고, 디자인 담당을 정해야 합니다 (결정 필요).

## 3. DEV-00 공통 기반 — 둘이 함께, 갈라지기 전에

- [ ] Next.js 프로젝트 생성 ([FRAMEWORK.md](FRAMEWORK.md) 명령 그대로)
- [ ] `app/layout.tsx` · `app/(tabs)/layout.tsx` 하단 탭 4개 (홈 · 추천 · 그룹 · 마이)
- [ ] `components/ui` — Button · Chip · Card · Avatar · Toast (디자인을 합칠 때 여기만 교체)
- [ ] `lib/types.ts` — 아래 계약 그대로
- [ ] `lib/session.ts` — `getSession()` 스텁 (A가 FE-1에서 실제 구현으로 교체)
- [ ] `lib/db.ts` — DB 연결 (DB 선택은 7장 결정 필요)
- [ ] `app/(tabs)/home/page.tsx` — 섹션 자리만: `HomeProfile` · `HomeRequests` · `HomeFriends` · `HomeGroups`
- [ ] 조장이 main에 커밋 · push → A · B 둘 다 pull

## 4. 계약 — `lib/types.ts`

바꾸려면 둘이 합의합니다.

```ts
type Tags = {
  cohort: '1기' | '2기' | '3기';
  role: '디자이너' | '기획자' | '마케터' | '개발자';
  team: string;   // 예: '14조'
  region: string; // 예: '강남'
};
type Profile = { userId: string; displayName: string; tags: Tags };
type Relation = { id: string; fromUserId: string; toUserId: string; status: 'pending' | 'accepted' };
type RelationView = 'none' | 'sent' | 'received' | 'friend'; // PG-601 버튼 4상태
type ProfileView = Profile & { overlapTags: string[]; relation: RelationView };
type GroupKey = `${keyof Tags}:${string}`; // 예: 'team:14조', 'role:기획자'

declare function getSession(): Promise<{ userId: string } | null>; // 없으면 /login?next=현재경로
```

## 5. 파일 소유권

자기 칸의 경로만 수정합니다. 공통 칸은 상대에게 먼저 말하고 수정합니다.

| A · 계정 · 탐색 | B · 관계 · 연결 | 공통 · 합의 후 수정 |
|---|---|---|
| `app/(auth)/login` · `app/(auth)/signup` | `app/p/[id]` (타인 프로필 · QR 진입) | `app/layout.tsx` · `app/(tabs)/layout.tsx` |
| `app/(tabs)/me` | `app/qr` (내 QR) | `app/(tabs)/home/page.tsx` (섹션 조립만) |
| `app/(tabs)/recommend` | `components/home/HomeRequests` · `HomeFriends` | `components/ui/**` |
| `app/(tabs)/groups/**` | `components/feedback/**` (토스트 · 오류) | `lib/types.ts` · `lib/db.ts` |
| `components/home/HomeProfile` · `HomeGroups` | `app/api/relations/**` · `app/api/profiles/**` | `package.json` (패키지 추가 시 말하기) |
| `app/api/auth/**` · `app/api/me` · `app/api/groups/**` · `app/api/recommend` | `lib/relations.ts` (관계 판정) | |
| `lib/session.ts` (실구현) | | |

## 6. 브랜치 · 머지 순서

merge는 조장만 합니다.

1. **DEV-00** → main (공통 기반)
2. **FE-1** `feat/auth` (A · 세션 실구현)
3. **FE-4** `feat/relations` (B · 관계 API)
4. **FE-2 · FE-3** `feat/me` · `feat/discovery` (A)
5. **FE-5 · FE-6** `feat/profile` · `feat/qr` (B)
6. **FE-7** `feat/feedback` (B)
7. **통합 확인** — 휴대폰 2대로 8장 체크리스트
8. **디자인 합치기** — `components/ui` 교체

B는 DEV-00의 `getSession()` 스텁으로 FE-1 merge 전에도 FE-4를 시작할 수 있습니다. 3번과 4번은 동시에 진행할 수 있습니다.

**싱크 방법**　PR이 merge되면 상대는 바로 main을 받아 자기 브랜치에 합칩니다.

```bash
git switch main && git pull
```

```bash
git switch feat/내-브랜치 && git merge main
```

## 7. 결정 필요 — 갈라지기 전에

- [ ] **DB · 백엔드 선택**　계정·관계를 영속 저장해야 합니다 (Vercel + DB). DEV-00 전에 확정합니다. [FRAMEWORK.md](FRAMEWORK.md)의 "프런트 전용 · 백엔드 없음"도 함께 고쳐야 합니다.
- [ ] **비밀번호 저장**　해시 필수, 평문 저장 금지.
- [ ] **아이디 규칙**　길이 · 허용 문자 (PG-102 중복 안내와 연결).
- [ ] **잘못된 QR 처리**　PG-903 문구 · 이동 위치.
- [ ] **로그인 화면 디자인 담당**　디자인 분장에 없음.
- [ ] **개발자 A · B 실제 담당자**
- [ ] **시간이 부족할 때의 축소안**　1시간 안에 ID/PW 로그인까지 넣기 빠듯하면 FE-1을 먼저 줄일지 정합니다 (예: 비밀번호 규칙 최소화).

## 8. 통합 확인 (QA 최소화 · PRD 5장)

- [ ] A · B가 같은 조 · 직무로 가입 → A의 홈 두 그룹에 B, 추천 카드 1장에 공통 태그 2개
- [ ] A가 추천에서 요청 → B가 홈에서 수락 → 두 기기 모두 친구, 다시 열어도 유지
- [ ] 공통점 없는 두 사람이 QR로 연결 → 비로그인은 가입 후 복귀, 반복 스캔해도 "친구"
- [ ] B가 태그 수정 → 그룹 갱신, 공통 태그가 없어져도 친구 유지

## 시간 기준 (제안)

[디자인 분장](DESIGN_ASSIGNMENTS.md)의 1시간 일정(15분에 핵심 화면 공유)에 맞춘 제안입니다.

| 시간 | 개발 |
|---|---|
| 0–15분 | 7장 결정 → DEV-00 공통 기반 → main |
| 15–40분 | A: FE-1 → FE-2 · FE-3 / B: FE-4 → FE-5 · FE-6 · FE-7 (디자인 전달 순서: 등록 → 홈 → 상대 프로필·요청 → 수락) |
| 40–50분 | PR · merge · 싱크 · Vercel 배포 |
| 50–60분 | 8장 통합 확인 · 디자인 합치기 |

## 부록 A. 화면 ID (IA-01)

Depth = 하단 탭에서 몇 번 들어간 화면인지입니다. D0 진입(탭 전) · D1 탭 루트 · D2 한 번 · D3 두 번.

| 화면 ID | 화면 | Depth | 경로 | 기능 | 상태 |
|---|---|---|---|---|---|
| PG-101 | 로그인 (ID/PW) | D0 | 링크 열기 > 로그인 | FE-1 | 추가 필요 |
| PG-102 | 온보딩 (가입) | D0 | 로그인 > 가입하기 > 온보딩 | FE-1 | 변경 필요 |
| PG-103 | 비밀번호 찾기 | D0 | 로그인 > 비밀번호 찾기 | — | 오픈 이후 |
| PG-201 | 홈 — 내 관계 | D1 | 하단 탭 > 홈 | FE-3 · FE-4 | 와이어 완료 |
| PG-301 | 친구추천 | D1 | 하단 탭 > 추천 | FE-3 | 와이어 완료 |
| PG-401 | 그룹 리스트 | D1 | 하단 탭 > 그룹 | FE-3 | 와이어 완료 |
| PG-501 | 마이페이지 | D1 | 하단 탭 > 마이 | FE-2 | 와이어 완료 (로그아웃 추가 필요) |
| PG-402 | 그룹 상세 | D2 | 홈 > 그룹 상세 · 그룹 > 그룹 상세 | FE-3 | 와이어 완료 |
| PG-602 | 내 QR | D2 | 홈 > 내 QR | FE-6 | 와이어 완료 |
| PG-601 | 타인 프로필 | D2 · D3 | 추천 > 타인 프로필 · 홈 > 받은 요청 > 타인 프로필 · 그룹 상세 > 타인 프로필 · QR 스캔 | FE-5 | 와이어 완료 |
| MD-901 | 토스트 | — | 어느 화면에서든 | FE-7 | 추가 필요 |
| PG-902 | 저장 실패 · 네트워크 오류 | — | 어느 화면에서든 | FE-7 | 추가 필요 |
| PG-903 | 잘못된 QR · 없는 프로필 | — | QR 스캔 > 잘못된 링크 | FE-7 | 추가 필요 |

## 부록 B. 주요 흐름 (UF-01 요약)

| 흐름 | 경로 |
|---|---|
| F1 첫 참여 · 가입 | 링크 열기 → 로그인 → [가입하기] → 온보딩 → [내 그룹 보기] → 홈 |
| F2 재방문 · 로그인 | 링크 열기 → 로그인 → [로그인] → 홈 |
| F3 로그인 유지 | 링크 열기 → (세션 유효) → 홈 |
| F4 공통점으로 발견 | 홈 → [태그 선택] → 그룹 상세 → [참여자] → 타인 프로필 → [친구 요청] → 토스트 |
| F5 추천에서 요청 | 친구추천 → [카드] → 타인 프로필 → [친구 요청] → 토스트 |
| F6 다른 그룹 탐색 | 그룹 리스트 → 그룹 상세 → 타인 프로필 → [친구 요청] |
| F7 QR 현장 연결 | B의 내 QR → A가 카메라로 스캔 → B의 타인 프로필 → [친구 요청] |
| F8 QR · 비로그인 | 카메라 스캔 → 로그인 → [가입하기] → 온보딩 → 스캔한 상대 프로필로 복귀 |
| F9 수락 · 친구 확인 | 홈 받은 요청 → [수락] → 토스트 → 다음 조회 시 양쪽 내 친구 |
| F10 태그 수정 | 마이페이지 → [저장] → 홈 그룹·추천 갱신 (친구는 유지) |
| F11 로그아웃 | 마이페이지 → [로그아웃] → 로그인 |
