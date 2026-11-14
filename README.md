# 허들워킹 — 허들링클럽 밋업 네트워킹

오늘 밋업에 온 사람을 공통 태그(기수 · 직무 · 조 · 근무 지역)로 찾고, 개인 QR로 바로 친구가 되는 모바일 웹. 서비스 주소: https://huddling.link

Next.js App Router, Node.js 22, PostgreSQL(Neon)을 사용한다. 화면은 Figma `07 디자인 · 전체 화면 (Dark · Purple)` 기준이다.

## 로컬 실행

1. Node.js 22와 PostgreSQL 13 이상을 준비하고 빈 개발용 DB를 생성한다. (Vercel 프로젝트에 연결돼 있으면 `vercel env pull .env.local`로 Neon DB 주소를 받을 수 있다. 단, 이 DB는 운영과 같은 DB라서 실제 참여자 정보가 들어 있다 — 테스트 계정을 만들거나 자동 점검을 돌릴 때는 로컬 DB를 쓴다.)
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
- **조 자동 채움**: 등록 · 수정 화면에서 이름과 기수가 `meetup_roster`(디스코드 조별 스레드에서 읽은 명단)와 같으면 조를 미리 골라 둔다. 이름만으로는 찾지 않고(이름 + 기수 둘 다 필요), 조 이름만 돌려준다. 명단은 실명이라 저장소에 넣지 않고 DB에만 둔다.
- **프로필 사진**: 브라우저에서 정사각 384px JPEG로 줄여 올리고 DB(`participant_photo`)에 둔다. 서버는 JPEG만 받고, 파일 머리말을 읽어 진짜 JPEG인지 · 가로세로가 1024px 이하인지 확인한다(용량 300KB 이하). `/api/photos/<UUID>`는 로그인한 사람에게만 내준다.
- **이름 · 기타 태그**: 저장할 때 보이지 않는 글자(폭 없는 공백 · 글자 방향 바꿈 · 한글 채움 문자 등)를 지우고 띄어쓰기를 한 칸으로 줄인다. 그러고 나서 빈 값이면 거절한다 (`cleanText`).
- **명함 읽기**: `POST /api/ocr/card`는 `OCR_ENABLED=1`일 때만 동작한다(꺼져 있으면 404).
- **요청 제한(1분)**: 같은 IP에서 가입 120회 · 로그인 300회 · 사진 올리기 120회, 같은 아이디 로그인 5회, 한 사람이 친구 요청 60회 · 프로필 저장 30회 · 사진 올리기 10회. 지난 기록은 서버가 1분에 한 번쯤 지운다.
- **보안 머리말**: 모든 응답에 `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `Referrer-Policy` · `Permissions-Policy`(카메라는 이 사이트만) · `Content-Security-Policy`(액자 금지 등)를 붙인다 (`next.config.ts`).
- 비로그인으로 `/p/<UUID>`에 오면 `/login?next=…`로 보내고, 로그인 · 등록 뒤 그 프로필로 돌아온다. 보는 도중 로그인이 풀린 채 친구 요청 · 수락을 누르면 로그인 화면으로 보낸다.

## 자동 점검

Playwright(휴대폰 화면)로 개발 서버(3200)를 띄워 돌린다. **로컬 테스트 DB에서만 돈다** — Vercel에서 받은 `.env.local`의 DB는 운영과 같은 DB라서, 거기서 돌리면 테스트 계정이 실제 참여자 화면에 보인다. 로컬 DB가 아니거나, 개발 서버와 테스트가 서로 다른 DB를 보고 있으면 시작하지 않고 멈춘다.

1. 로컬 PostgreSQL에 빈 DB를 만들고 `db/001`~`003`을 실행한다.
2. 개발 서버와 테스트를 같은 주소로 실행한다. 주소에 사용자 이름을 꼭 넣는다(`.env.local`의 `PGUSER`가 섞이지 않게).
   `DATABASE_URL=postgresql://<사용자>@localhost/<테스트 DB> npm run test:e2e`
   (개발 서버가 이미 떠 있으면 그 서버도 같은 `DATABASE_URL`로 띄운 것이어야 한다.)

테스트가 만든 계정(`qa_e2e_…`)은 끝나면 지운다.

- `e2e/flow.spec.ts` — PRD §5 두 기기 흐름(같은 태그 → 요청 → 수락, QR로 등록 뒤 복귀), 입력 검사, 로그인 · 로그아웃, 가로 넘침
- `e2e/pixel.spec.ts` — 아이콘 · 테두리 상자가 정수 px인지 (폭 360 · 375 · 768, DPR 1 · 2)
- `e2e/a11y.spec.ts` — 접근성 자동 검사(WCAG 2.1 AA, 심각 · 중대)
- `e2e/adversarial.spec.ts` — 적대적 검증: 비로그인 접근 · 화면에 실리는 정보 · 보안 머리말 · 주소 조작 · 세션 재사용 · 다른 사이트 출처 · 남의 관계 엿보기/대신 수락 · 동시 요청 · 쏟아붓기(친구 요청 · 사진 · 로그인 대입) · 입력값/이름 장난 · 가짜 사진 · 명단 캐내기

## 배포

Vercel 프로젝트 `huddling-14team`(Git 연동 없음)에 CLI로 올린다: `vercel deploy --prod`. 서버 함수는 DB와 같은 싱가포르(`vercel.json`의 `regions: ["sin1"]`)에서 돈다 — 기본값(미국 동부)으로 두면 DB 조회마다 태평양을 왕복해 화면이 1~5초씩 걸린다. DB는 Vercel Marketplace의 Neon(`huddling-14team-db`)이고 `DATABASE_URL`은 통합이 넣어 준다.
