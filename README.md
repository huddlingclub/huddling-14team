# 허들워킹 — 허들링클럽 밋업 네트워킹

오늘 밋업에 온 사람을 공통 태그(기수 · 직무 · 조 · 근무 지역)로 찾고, 개인 QR로 바로 친구가 되는 모바일 웹. 서비스 주소: https://huddling.link

Next.js App Router, Node.js 22, PostgreSQL(Neon)을 사용한다. 화면은 Figma `07 디자인 · 전체 화면 (Dark · Purple)` 기준이다.

## 로컬 실행

1. Node.js 22와 PostgreSQL 13 이상을 준비하고 빈 개발용 DB를 생성한다. (Vercel 프로젝트에 연결돼 있으면 `vercel env pull .env.local`로 Neon 개발 DB 주소를 받을 수 있다.)
2. `.env.example`을 `.env.local`로 복사하고 `DATABASE_URL`을 개발용 DB 연결 문자열로 설정한다.
3. 해당 DB에 아래 파일을 순서대로 한 번씩 실행한다. `psql "<DATABASE_URL>" -v ON_ERROR_STOP=1 -f <파일>`
   - `db/001_accounts.sql` — 계정 · 참여자 · 태그
   - `db/002_relations.sql` — 친구 관계 · 1~15조
   - `db/003_full_version.sql` — 선택지 순서 · 근무 지역 추가 · 조는 한 사람당 하나 · 프로필 사진 · 밋업 명단 테이블
4. `npm install` 후 `npm run dev`로 실행한다.

태그 선택지는 DB의 `tag` 카탈로그에서 불러온다(`sort` 순서).

## 환경 변수

| 이름 | 용도 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (필수) |
| `NEXT_PUBLIC_SITE_URL` | 대표 주소. QR · 공유 미리보기에 쓴다. 비우면 QR은 지금 접속한 주소를 쓴다 (배포: `https://huddling.link`) |
| `CANONICAL_HOST` | 넣으면 예전 임시 주소(`huddling-14team.vercel.app`)와 `www`로 온 요청을 이 주소로 보낸다 (배포: `huddling.link`) |
| `OCR_ENABLED` | `1`이면 등록 화면에 '명함으로 등록'이 나온다. Vercel AI Gateway를 쓰므로 팀에 결제 카드가 등록돼 있어야 한다. 기본은 꺼짐 |

## 화면과 API

| 화면 | 경로 | API |
|---|---|---|
| PG-101 로그인 | `/login` | `POST /api/auth/login` |
| PG-102 등록 | `/signup` | `POST /api/auth/signup` · `GET /api/auth/username` · `GET /api/roster/match` · `POST /api/ocr/card` |
| PG-201 홈 | `/home` | `GET /api/home` · `GET /api/relations/count`(하단 탭 배지) |
| PG-301 추천 | `/recommend` | `GET /api/recommend` |
| PG-401 그룹 | `/groups?tag=<항목:값>` | `GET /api/friends` |
| PG-402 그룹 상세 | `/groups/<항목:값>` | `GET /api/groups/<항목:값>` |
| PG-501 마이 | `/me` | 서버에서 바로 조회 · `POST /api/auth/logout` |
| PG-502 프로필 수정 | `/me/edit` | `PATCH /api/me` · `POST`/`DELETE /api/me/photo` |
| PG-601 타인 프로필 | `/p/<참여자 UUID>` | `GET /api/profiles/<참여자 UUID>` |
| PG-602 내 QR | `/qr` | 없음 (QR = `<대표 주소>/p/<참여자 UUID>`, 계정마다 자동 생성) |
| PG-603 QR 스캔 | `/scan` | 없음 (브라우저 카메라로 읽어 `/p/…`로 이동) |

- **계정**: 아이디(영문 소문자 · 숫자 · 밑줄 3~24자) + 비밀번호(8~128자). 세션은 7일. `getSession()`은 `{ userId } | null`.
- **친구**: 요청 `POST /api/relations` `{ toId }`, 수락 `POST /api/relations/<요청한 사람 UUID>/accept`. 두 사람 사이 기록은 한 건만 둔다(`friend_relation`).
- **홈의 태그 칩 → 그룹 상세**는 그 태그의 모든 참여자를 보여 준다(새 사람 찾기). **그룹 탭**은 내 친구만 태그별로 모아 보여 준다.
- **조 자동 채움**: 등록 · 수정 화면에서 이름과 기수가 `meetup_roster`(디스코드 조별 스레드에서 읽은 명단)와 같으면 조를 미리 골라 둔다. 명단은 실명이라 저장소에 넣지 않고 DB에만 둔다.
- **프로필 사진**: 브라우저에서 정사각 384px JPEG로 줄여 올리고 DB(`participant_photo`)에 둔다. `/api/photos/<UUID>`는 로그인한 사람에게만 내준다.
- **요청 제한**: 같은 IP에서 가입 1분 120회 · 로그인 1분 300회, 같은 아이디 로그인 1분 5회.
- 비로그인으로 `/p/<UUID>`에 오면 `/login?next=…`로 보내고, 로그인 · 등록 뒤 그 프로필로 돌아온다.

## 자동 점검

`npm run test:e2e` — Playwright(휴대폰 화면)로 개발 서버(3200)와 `.env.local`의 DB를 써서 돌린다. 테스트가 만든 계정(`qa_e2e_…`)은 끝나면 지운다.

- `e2e/flow.spec.ts` — PRD §5 두 기기 흐름(같은 태그 → 요청 → 수락, QR로 등록 뒤 복귀), 입력 검사, 로그인 · 로그아웃, 가로 넘침
- `e2e/pixel.spec.ts` — 아이콘 · 테두리 상자가 정수 px인지 (폭 360 · 375 · 768, DPR 1 · 2)
- `e2e/a11y.spec.ts` — 접근성 자동 검사(WCAG 2.1 AA, 심각 · 중대)
- `e2e/adversarial.spec.ts` — 주소 조작 · 출처 · 형식 · 권한 · 동시 요청 · 대입 공격

## 배포

Vercel 프로젝트 `huddling-14team`(Git 연동 없음)에 CLI로 올린다: `vercel deploy --prod`. 서버 함수는 DB와 같은 싱가포르(`vercel.json`의 `regions: ["sin1"]`)에서 돈다 — 기본값(미국 동부)으로 두면 DB 조회마다 태평양을 왕복해 화면이 1~5초씩 걸린다. DB는 Vercel Marketplace의 Neon(`huddling-14team-db`)이고 `DATABASE_URL`은 통합이 넣어 준다.
