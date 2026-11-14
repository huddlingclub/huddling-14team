# 허들링클럽 밋업

Next.js App Router, Node.js 22, PostgreSQL을 사용한다.

## 로컬 실행

1. Node.js 22와 PostgreSQL 13 이상을 준비하고 빈 개발용 DB를 생성한다.
2. `.env.example`을 `.env.local`로 복사하고 `DATABASE_URL`을 개발용 DB 연결 문자열로 설정한다.
3. 해당 DB에 `psql "<개발용 DATABASE_URL>" -v ON_ERROR_STOP=1 -f db/001_accounts.sql`을 한 번 실행한다.
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
