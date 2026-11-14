import { expect, test } from '@playwright/test';
import { PASSWORD, ROSTER_NAME, db, seedRoster, signupApi, uid } from './helpers';

// 적대적 검증 (CUAgain adversarial.spec 틀) — 주소 조작 · 출처 · 형식 · 크기 · 권한 · 중복 · 경쟁 상태 · 노출
test.describe.configure({ mode: 'serial' });

const SAME = { Origin: 'http://localhost:3200' };
const CROSS = { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' };
const NOBODY = '00000000-0000-4000-8000-000000000000';

test('로그인 안 한 요청은 모두 막힌다 (API · 사진)', async ({ request }) => {
  for (const [method, path] of [
    ['GET', '/api/home'],
    ['GET', '/api/recommend'],
    ['GET', '/api/groups'],
    ['GET', '/api/me'],
    ['GET', '/api/relations'],
    ['GET', '/api/relations/count'],
    ['GET', `/api/profiles/${NOBODY}`],
    ['GET', `/api/photos/${NOBODY}`],
    ['POST', '/api/relations'],
    ['POST', `/api/relations/${NOBODY}/accept`],
    ['POST', '/api/me/photo'],
  ] as const) {
    const res = await request.fetch(path, { method, headers: SAME, data: method === 'POST' ? { toId: NOBODY } : undefined });
    expect(res.status(), `${method} ${path}`).toBe(401);
  }
});

test('로그인 뒤 이동 주소 조작: 밖으로 나가지 않는다', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();
  const nexts = ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/p/../../admin', '/me?x=1'];
  let me = { username: '' };
  for (const [i, next] of nexts.entries()) {
    // 같은 아이디로 1분에 5번을 넘기면 대입 공격 차단(429)이 걸리므로 3번마다 새 계정
    if (i % 3 === 0) {
      me = await signupApi(ctx.request, { name: 'QA조작' });
      await ctx.clearCookies();
    }
    await page.goto(`/login?next=${encodeURIComponent(next)}`);
    await page.getByLabel('아이디').fill(me.username);
    await page.getByLabel(/^비밀번호\*?$/).fill(PASSWORD);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page, next).toHaveURL(/^http:\/\/localhost:3200\/home$/);
    await ctx.clearCookies();
  }
  await ctx.close();
});

test('쓰기 요청: 다른 사이트 출처 · 잘못된 형식 · 자기 자신 · 없는 사람 · 남의 요청 수락', async ({ browser, baseURL }) => {
  const A = await browser.newContext({ baseURL });
  const B = await browser.newContext({ baseURL });
  const a = await signupApi(A.request, { name: 'QA공격자' });
  const b = await signupApi(B.request, { name: 'QA피해자' });

  expect((await A.request.post('/api/relations', { headers: CROSS, data: { toId: b.userId } })).status()).toBe(403);
  expect((await A.request.post(`/api/relations/${b.userId}/accept`, { headers: CROSS })).status()).toBe(403);
  expect((await A.request.patch('/api/me', { headers: CROSS, data: { displayName: 'x' } })).status()).toBe(400);
  expect((await A.request.post('/api/relations', { headers: SAME, data: { toId: 'not-a-uuid' } })).status()).toBe(404);
  expect((await A.request.post('/api/relations', { headers: SAME, data: { toId: a.userId } })).status()).toBe(400);
  expect((await A.request.post('/api/relations', { headers: SAME, data: { toId: NOBODY } })).status()).toBe(404);
  // 받은 요청이 없는데 수락 → 404, 내가 보낸 요청을 내가 수락 → 409
  expect((await A.request.post(`/api/relations/${b.userId}/accept`, { headers: SAME })).status()).toBe(404);
  expect((await A.request.post('/api/relations', { headers: SAME, data: { toId: b.userId } })).status()).toBe(200);
  expect((await A.request.post(`/api/relations/${b.userId}/accept`, { headers: SAME })).status()).toBe(409);
  await A.close();
  await B.close();
});

test('동시 요청 경쟁: 서로 동시에 요청하거나 같은 요청을 여러 번 보내도 관계 기록은 한 건', async ({ browser, baseURL }) => {
  const A = await browser.newContext({ baseURL });
  const B = await browser.newContext({ baseURL });
  const a = await signupApi(A.request, { name: 'QA동시1' });
  const b = await signupApi(B.request, { name: 'QA동시2' });
  const results = await Promise.all([
    ...Array.from({ length: 5 }, () => A.request.post('/api/relations', { headers: SAME, data: { toId: b.userId } })),
    ...Array.from({ length: 5 }, () => B.request.post('/api/relations', { headers: SAME, data: { toId: a.userId } })),
  ]);
  for (const r of results) expect(r.status()).toBe(200);
  const { rows } = await db().query(
    'SELECT count(*)::int AS n FROM friend_relation WHERE participant_a_id = LEAST($1::uuid, $2::uuid) AND participant_b_id = GREATEST($1::uuid, $2::uuid)',
    [a.userId, b.userId],
  );
  expect(rows[0].n).toBe(1);
  // 수락을 여러 번 눌러도 친구 한 번
  const [first] = await db().query<{ requester_id: string }>(
    'SELECT requester_id FROM friend_relation WHERE participant_a_id = LEAST($1::uuid, $2::uuid) AND participant_b_id = GREATEST($1::uuid, $2::uuid)',
    [a.userId, b.userId],
  ).then((r) => r.rows);
  const receiver = first.requester_id === a.userId ? B : A;
  const sender = first.requester_id === a.userId ? a : b;
  const accepts = await Promise.all(
    Array.from({ length: 3 }, () => receiver.request.post(`/api/relations/${sender.userId}/accept`, { headers: SAME })),
  );
  for (const r of accepts) expect(r.status()).toBe(200);
  await A.close();
  await B.close();
});

test('입력값 공격: 아주 긴 값 · 태그 위조 · 조 여러 개 · 스크립트 이름은 글자로만 보인다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const me = await signupApi(P.request, { name: 'QA입력' });
  const bad = async (data: object) => (await P.request.patch('/api/me', { headers: SAME, data })).status();
  const base = { displayName: 'QA입력', tags: { cohort: [] as string[], role: [], team: [], region: [] }, customTags: [] };
  expect(await bad({ ...base, displayName: 'x'.repeat(41) })).toBe(400);
  expect(await bad({ ...base, displayName: '   ' })).toBe(400);
  expect(await bad(base)).toBe(400); // 기수 없음
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [NOBODY] } })).toBe(400); // 없는 태그
  const { rows } = await db().query<{ id: string; category: string }>("SELECT id, category FROM tag WHERE category IN ('cohort','team') ORDER BY sort, label");
  const cohort = rows.filter((r) => r.category === 'cohort').map((r) => r.id);
  const teams = rows.filter((r) => r.category === 'team').map((r) => r.id);
  expect(await bad({ ...base, tags: { ...base.tags, cohort: cohort.slice(0, 2) } })).toBe(400); // 기수 두 개
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [cohort[0]], team: teams.slice(0, 2) } })).toBe(400); // 조 두 개
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [cohort[0]] }, customTags: Array.from({ length: 21 }, (_, i) => `t${i}`) })).toBe(400);
  // 스크립트처럼 생긴 이름은 그대로 글자로 저장되고, 화면에서 실행되지 않는다
  const xss = '<img src=x onerror="window.__pwned=1">';
  expect(await bad({ ...base, displayName: xss, tags: { ...base.tags, cohort: [cohort[0]] } })).toBe(200);
  const page = await P.newPage();
  await page.goto(`/home`);
  await expect(page.getByText(xss).first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(me.userId).toBeTruthy();
  await P.close();
});

test('사진: 형식 · 크기 · 다른 출처 검사, 로그인한 사람만 볼 수 있다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const me = await signupApi(P.request, { name: 'QA사진' });
  const post = (dataUrl: string, headers = SAME) => P.request.post('/api/me/photo', { headers, data: { dataUrl } });
  expect((await post('data:text/html;base64,PHNjcmlwdD4=')).status()).toBe(400);
  expect((await post('data:image/svg+xml;base64,PHN2Zy8+')).status()).toBe(400);
  expect((await post(`data:image/jpeg;base64,${Buffer.alloc(400_000, 1).toString('base64')}`)).status()).toBe(413);
  expect((await post(`data:image/jpeg;base64,${Buffer.from('fake').toString('base64')}`, CROSS)).status()).toBe(400);
  const ok = await post(`data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')}`);
  expect(ok.status()).toBe(200);
  const anon = await browser.newContext({ baseURL });
  expect((await anon.request.get(`/api/photos/${me.userId}`)).status()).toBe(401);
  expect((await P.request.get(`/api/photos/${me.userId}`)).headers()['cache-control']).toContain('private');
  await anon.close();
  await P.close();
});

test('로그인 대입 공격: 같은 아이디는 1분에 5번까지만 시도', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const me = await signupApi(P.request, { name: 'QA잠금' });
  await P.clearCookies();
  const codes: number[] = [];
  for (let i = 0; i < 7; i++) {
    const r = await P.request.post('/api/auth/login', { headers: SAME, data: { username: me.username, password: `wrong-${i}` } });
    codes.push(r.status());
  }
  expect(codes.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
  expect(codes.slice(5)).toEqual([429, 429]);
  await P.close();
});

test('명단 · 아이디 확인 API는 명단의 다른 사람 정보를 내주지 않는다', async ({ request }) => {
  await seedRoster();
  const r = await request.get('/api/roster/match?name=' + encodeURIComponent(`${ROSTER_NAME}' OR '1'='1`) + '&cohort=1기');
  expect(await r.json()).toEqual({ teams: [] });
  const ok = await (await request.get('/api/roster/match?name=' + encodeURIComponent(ROSTER_NAME) + '&cohort=1기')).json();
  expect(ok).toEqual({ teams: ['14조'] });
  const keys = Object.keys(ok);
  expect(keys).toEqual(['teams']);
  expect(await (await request.get('/api/auth/username?u=' + encodeURIComponent('A B'))).json()).toEqual({ available: false, reason: 'format' });
  expect((await (await request.get(`/api/auth/username?u=${uid()}`)).json()).available).toBe(true);
});

test('공유 미리보기 · 파비콘 · 앱 아이콘이 연결돼 있다', async ({ page, request }) => {
  await page.goto('/login');
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /opengraph-image/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /허들워킹/);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  for (const path of ['/favicon.ico', '/icon.png', '/apple-icon.png', '/opengraph-image.jpg', '/manifest.webmanifest', '/icons/icon-512.png']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});
