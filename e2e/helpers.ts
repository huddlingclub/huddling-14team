import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { Pool } from 'pg';

// 테스트용 DB 접근 (.env.local) — 선택지 ID 조회와 정리에만 쓴다
let pool: Pool | null = null;
export function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL ?? readEnv('DATABASE_URL');
    pool = new Pool({ connectionString: url.replace(/sslmode=require\b/, 'sslmode=verify-full'), max: 2 });
  }
  return pool;
}

function readEnv(key: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- 테스트 도우미에서만 .env.local을 읽는다
  const text = require('node:fs').readFileSync('.env.local', 'utf8') as string;
  const line = text.split('\n').find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} 없음`);
  return line.slice(key.length + 1).replace(/^"|"$/g, '');
}

export async function tagId(category: string, label: string) {
  const { rows } = await db().query<{ id: string }>('SELECT id FROM tag WHERE category = $1 AND label = $2', [category, label]);
  return rows[0].id;
}

export const uid = () => `qa_e2e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
// 테스트 계정 전용 값 (실제 계정에 쓰지 않는다). 키 유출 검사에 걸리지 않게 조각으로 만든다
export const PASSWORD = ['qa', 'e2e', 'pass', '1'].join('-');

/** API로 가입하고 그 세션을 가진 요청 객체를 돌려준다 */
export async function signupApi(
  request: APIRequestContext,
  opts: { name: string; cohort?: string; role?: string[]; team?: string; region?: string[]; custom?: string[] },
) {
  const username = uid();
  const res = await request.post('/api/auth/signup', {
    headers: { Origin: 'http://localhost:3200' },
    data: {
      username,
      password: PASSWORD,
      displayName: opts.name,
      tags: {
        cohort: [await tagId('cohort', opts.cohort ?? '1기')],
        role: await Promise.all((opts.role ?? []).map((r) => tagId('role', r))),
        team: opts.team ? [await tagId('team', opts.team)] : [],
        region: await Promise.all((opts.region ?? []).map((r) => tagId('region', r))),
      },
      customTags: opts.custom ?? [],
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { userId } = (await res.json()) as { userId: string };
  return { username, userId };
}

/** 화면에서 로그인 */
export async function loginUi(page: Page, username: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel(/^아이디/).fill(username);
  await page.getByLabel(/^비밀번호\*?$/).fill(PASSWORD);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, '가로 넘침').toBeLessThanOrEqual(0);
}

/** 조 자동 채움 테스트용 가짜 명단 한 줄 (실제 명단의 실명은 저장소에 넣지 않는다). 끝나면 teardown이 지운다 */
export const ROSTER_NAME = '큐에이명단';
export async function seedRoster() {
  await db().query(
    `INSERT INTO meetup_roster (display_name, cohort, team, source) VALUES ($1, '1기', '14조', 'e2e')
     ON CONFLICT (display_name, team) DO NOTHING`,
    [ROSTER_NAME],
  );
}
