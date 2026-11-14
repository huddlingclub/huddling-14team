# 허들링클럽 밋업

Next.js App Router, Node.js 22, PostgreSQL을 사용한다.

## 로컬 실행

1. Node.js 22와 PostgreSQL 13 이상을 준비하고 빈 개발용 DB를 생성한다.
2. `.env.example`을 `.env.local`로 복사하고 `DATABASE_URL`을 개발용 DB 연결 문자열로 설정한다.
3. 해당 DB에 `psql "<개발용 DATABASE_URL>" -v ON_ERROR_STOP=1 -f db/001_accounts.sql`을 한 번 실행하고, 같은 방법으로 `db/002_relations.sql`(친구 관계 테이블 · 1~15조)도 실행한다.
4. `npm install` 후 `npm run dev`로 실행한다.

태그 선택지는 DB의 `tag` 카탈로그에서 불러온다. 마이그레이션에는 PRD와 화면 예시의 초기값만 포함되어 있으므로, 밋업에서 제공할 조와 근무 지역 목록을 실제 값으로 채운다.

## 계정·프로필 연동

| 화면 | 경로 | 처리 |
|---|---|---|
| PG-101 | `/login` | 아이디·비밀번호 로그인 |
| PG-102 | `/signup` | 계정·프로필 등록과 세션 생성 |
| PG-501 | `/me` | 내 프로필 수정과 로그아웃 |

- 화면은 `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`, `PATCH /api/me`를 사용한다.
- `getSession()`은 `{ userId } | null`을 반환한다. `userId`는 ERD의 `participant.id`다.
- `GET /api/me`는 `{ userId, displayName, tags: { cohort, role, team, region }, customTags }`를 반환한다. 선택형 값은 항목별 태그 ID 배열이고, 기타 값은 문자열 배열이다. `PATCH /api/me`는 같은 프로필 입력의 전체 새 값을 받으며 참여자 ID는 세션에서 가져온다.
- 기본 완료 경로는 `/home`이다. QR 진입 담당자는 비로그인 접근 시 `/login?next=%2Fp%2F<참여자 UUID>`로 보낸다. 로그인과 가입 사이를 이동해도 이 경로를 유지한다. 이 브랜치의 `/home`은 계정 흐름 확인용 진입 화면이다. PG-201 홈과 PG-601 프로필은 팀의 해당 구현을 연결한다.
- Figma에서 추가된 로그인 흐름에 따라 `account`와 `account_session`을 ERD의 참여자에 연결한다. 임시 아이디 규칙은 영문·숫자·밑줄 3~24자이고 대소문자를 구분하지 않는다. 비밀번호는 15~128자, 세션 유효 기간은 7일이다.

## 네트워킹 화면 연동

| 화면 | 경로 | API |
|---|---|---|
| PG-201 홈 | `/home` | `GET /api/home` |
| PG-301 친구추천 | `/recommend` | `GET /api/recommend` |
| PG-401 그룹 리스트 | `/groups` | `GET /api/groups` |
| PG-402 그룹 상세 | `/groups/<항목:값>` | `GET /api/groups/<항목:값>` |
| PG-601 타인 프로필 | `/p/<참여자 UUID>` | `GET /api/profiles/<참여자 UUID>` |
| PG-602 내 QR | `/qr` | 없음 (링크 `/p/<참여자 UUID>`) |

- 친구 요청은 `POST /api/relations` `{ toId }`, 수락은 `POST /api/relations/<요청한 참여자 UUID>/accept`다. 두 사람 사이 기록은 한 건만 둔다(`friend_relation`).
- `/home`은 위 PG-201 구현으로 교체했다. 계정 화면(`/login` · `/signup` · `/me`)은 그대로 쓴다.
- 이 화면들의 Postgres 연결본은 빌드까지만 확인했다. 실제 DB로 요청·수락 흐름을 돌려 보는 검증은 아직 하지 않았다.
- 화면 스타일은 디자인 적용 전 임시(밝은 배경 고정)다. 공통 UI는 `src/components/ui`에 모여 있다.

## 데모 모드

`NEXT_PUBLIC_DEMO=1`로 빌드하면 DB 없이 화면 흐름만 볼 수 있다. https://huddling-14team.vercel.app 배포본이 이 모드다.

- 데이터는 가상의 샘플 참여자이고, 입력한 내용은 그 브라우저에만 저장된다. 다른 기기와 공유되지 않는다.
- `/login` · `/signup` · `/me`는 `src/screens/demo`의 데모 화면으로 바뀐다(`next.config.ts`).
- 내가 보낸 친구 요청은 몇 초 뒤 상대가 수락한 것으로 표시한다.
- 내 QR에는 이름·태그가 함께 담겨서, 다른 기기로 스캔하면 그 기기에서 내 프로필이 열린다.
- 로컬에서 보려면 `NEXT_PUBLIC_DEMO=1 npm run dev`로 실행한다.
