import { expect, test, type Page } from '@playwright/test';
import { PASSWORD, ROSTER_NAME, db, seedRoster, signupApi, tagId, uid } from './helpers';

// 적대적 검증 (CUAgain adversarial.spec 틀) — 주소 조작 · 출처 · 형식 · 크기 · 권한 · 중복 · 경쟁 상태 · 노출 · 쏟아붓기
// 한 번에 하나씩 순서대로 돈다(playwright.config workers: 1). 하나가 실패해도 나머지는 계속 확인한다.

const SAME = { Origin: 'http://localhost:3200' };
const CROSS = { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' };
const NOBODY = '00000000-0000-4000-8000-000000000000';
const ch = (...codes: number[]) => String.fromCharCode(...codes);

/** 브라우저 캔버스로 진짜 JPEG · PNG를 만든다 (화면이 사진을 줄여 보내는 방식과 같다) */
async function images(page: Page) {
  await page.goto('/login');
  return page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const g = c.getContext('2d')!;
    g.fillStyle = '#c9b8ff';
    g.fillRect(0, 0, 16, 16);
    return { jpeg: c.toDataURL('image/jpeg', 0.8), png: c.toDataURL('image/png') };
  });
}

/** JPEG 머리말의 가로 · 세로 값만 바꾼다 (용량은 그대로인데 아주 큰 사진인 척) */
function fakeSize(jpegDataUrl: string, side: number) {
  const bytes = Buffer.from(jpegDataUrl.split(',')[1], 'base64');
  const at = bytes.indexOf(Buffer.from([0xff, 0xc0]));
  expect(at, 'JPEG 크기 정보 위치').toBeGreaterThan(0);
  bytes.writeUInt16BE(side, at + 5);
  bytes.writeUInt16BE(side, at + 7);
  return `data:image/jpeg;base64,${bytes.toString('base64')}`;
}

test('로그인 안 한 요청은 모두 막힌다 (API · 사진)', async ({ request }) => {
  for (const [method, path] of [
    ['GET', '/api/home'],
    ['GET', '/api/recommend'],
    ['GET', '/api/groups'],
    ['GET', `/api/groups/${encodeURIComponent('team:14조')}`],
    ['GET', '/api/friends'],
    ['GET', '/api/me'],
    ['GET', '/api/relations'],
    ['GET', '/api/relations/count'],
    ['GET', `/api/profiles/${NOBODY}`],
    ['GET', `/api/photos/${NOBODY}`],
    ['POST', '/api/relations'],
    ['POST', `/api/relations/${NOBODY}/accept`],
    ['POST', '/api/me/photo'],
    ['PATCH', '/api/me'],
    ['DELETE', '/api/me/photo'],
  ] as const) {
    const res = await request.fetch(path, { method, headers: SAME, data: method === 'GET' ? undefined : { toId: NOBODY } });
    expect(res.status(), `${method} ${path}`).toBe(401);
  }
});

test('로그인 안 한 화면 요청에는 참여자 정보가 실리지 않는다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const marker = `QA비공개${Date.now().toString(36)}`;
  const me = await signupApi(P.request, { name: marker, custom: [`${marker}태그`] });
  const anon = await browser.newContext({ baseURL });
  for (const path of [`/p/${me.userId}`, '/home', '/recommend', '/groups', '/me', '/me/edit', '/qr', '/scan']) {
    for (const headers of [{}, { RSC: '1' }]) {
      const res = await anon.request.get(path, { headers, maxRedirects: 0 });
      const body = await res.text();
      expect(body, path).not.toContain(marker);
      expect(body, path).not.toContain(me.username);
    }
  }
  await anon.close();
  await P.close();
});

test('보안 머리말: 액자 금지 · 형식 추측 금지 · 서버 종류 숨김이 화면과 API에 모두 붙는다', async ({ request }) => {
  for (const path of ['/login', '/signup', '/api/auth/username?u=abc', '/api/home']) {
    const h = (await request.get(path)).headers();
    expect(h['x-frame-options'], path).toBe('DENY');
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['permissions-policy'], path).toContain('camera=(self)');
    expect(h['x-powered-by'], path).toBeUndefined();
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

test('세션: 쿠키는 스크립트가 읽을 수 없고, 로그아웃한 쿠키 · 지어낸 쿠키는 통하지 않는다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const me = await signupApi(P.request, { name: 'QA세션' });
  const [cookie] = (await P.cookies()).filter((c) => c.name === 'huddling-session');
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe('Lax');
  expect(cookie.value.length).toBeGreaterThanOrEqual(40);
  // DB에는 쿠키 값이 그대로 저장되지 않는다(해시만)
  const stored = await db().query('SELECT 1 FROM account_session WHERE token_hash = $1', [cookie.value]);
  expect(stored.rowCount).toBe(0);
  const page = await P.newPage();
  await page.goto('/home');
  expect(await page.evaluate(() => document.cookie)).not.toContain('huddling-session');

  expect((await P.request.post('/api/auth/logout', { headers: SAME, data: {} })).status()).toBe(204);
  const replay = await browser.newContext({ baseURL });
  await replay.addCookies([{ name: 'huddling-session', value: cookie.value, url: baseURL! }]);
  expect((await replay.request.get('/api/me')).status(), '로그아웃한 쿠키 다시 쓰기').toBe(401);
  await replay.clearCookies();
  await replay.addCookies([{ name: 'huddling-session', value: me.userId, url: baseURL! }]);
  expect((await replay.request.get('/api/me')).status(), '참여자 ID를 쿠키로').toBe(401);
  await replay.close();
  await P.close();
});

test('쓰기 요청: 다른 사이트 출처 · 잘못된 형식 · 자기 자신 · 없는 사람 · 남의 요청 수락', async ({ browser, baseURL }) => {
  const A = await browser.newContext({ baseURL });
  const B = await browser.newContext({ baseURL });
  const a = await signupApi(A.request, { name: 'QA공격자' });
  const b = await signupApi(B.request, { name: 'QA피해자' });

  expect((await A.request.post('/api/relations', { headers: CROSS, data: { toId: b.userId } })).status()).toBe(403);
  expect((await A.request.post(`/api/relations/${b.userId}/accept`, { headers: CROSS })).status()).toBe(403);
  expect((await A.request.patch('/api/me', { headers: CROSS, data: { displayName: 'x' } })).status()).toBe(400);
  expect((await A.request.delete('/api/me/photo', { headers: CROSS })).status()).toBe(403);
  expect((await A.request.post('/api/auth/logout', { headers: CROSS, data: {} })).status()).toBe(400);
  expect((await A.request.get('/api/me')).status(), '다른 사이트의 로그아웃 시도 뒤에도 로그인 유지').toBe(200);
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

test('남의 친구 관계 · 받은 요청은 제3자에게 보이지 않고, 제3자가 대신 수락할 수 없다', async ({ browser, baseURL }) => {
  const [A, B, C] = await Promise.all([1, 2, 3].map(() => browser.newContext({ baseURL })));
  const a = await signupApi(A.request, { name: 'QA요청한사람', team: '11조' });
  const b = await signupApi(B.request, { name: 'QA요청받은사람', team: '11조' });
  await signupApi(C.request, { name: 'QA제3자', team: '11조' });
  expect((await A.request.post('/api/relations', { headers: SAME, data: { toId: b.userId } })).status()).toBe(200);

  // C가 A 대신 · B 대신 수락해 보려 해도 C와 얽힌 요청이 없으므로 404
  expect((await C.request.post(`/api/relations/${a.userId}/accept`, { headers: SAME })).status()).toBe(404);
  expect((await C.request.post(`/api/relations/${b.userId}/accept`, { headers: SAME })).status()).toBe(404);
  const pending = await db().query('SELECT accepted_at FROM friend_relation WHERE requester_id = $1', [a.userId]);
  expect(pending.rows[0].accepted_at).toBeNull();

  const home = await (await C.request.get('/api/home')).json();
  expect(home.received).toEqual([]);
  expect(home.friends).toEqual([]);
  const lists = await (await C.request.get('/api/relations')).json();
  expect(lists).toEqual({ received: [], sent: [], friends: [] });
  // A 프로필을 C가 봐도 A–B 사이 일은 실리지 않는다
  const seen = await (await C.request.get(`/api/profiles/${a.userId}`)).text();
  expect(JSON.parse(seen).profile.relation).toBe('none');
  expect(seen).not.toContain(b.userId);

  expect((await B.request.post(`/api/relations/${a.userId}/accept`, { headers: SAME })).status()).toBe(200);
  expect((await (await C.request.get('/api/friends')).json()).friends).toEqual([]);
  const group = await (await C.request.get(`/api/groups/${encodeURIComponent('team:11조')}`)).json();
  for (const id of [a.userId, b.userId]) {
    expect(group.members.find((m: { id: string }) => m.id === id).relation, 'C에게는 둘 다 아직 남').toBe('none');
  }
  await Promise.all([A, B, C].map((x) => x.close()));
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

test('같은 아이디로 동시에 가입: 한 명만 성공하고 반쪽짜리 참여자가 남지 않는다', async ({ playwright, baseURL }) => {
  const username = uid();
  const marker = `QA동시가입${Date.now().toString(36)}`;
  const cohort = await tagId('cohort', '1기');
  const contexts = await Promise.all([1, 2, 3, 4].map(() => playwright.request.newContext({ baseURL })));
  const results = await Promise.all(
    contexts.map((c) =>
      c.post('/api/auth/signup', {
        headers: SAME,
        data: { username, password: PASSWORD, displayName: marker, tags: { cohort: [cohort], role: [], team: [], region: [] }, customTags: [] },
      }),
    ),
  );
  expect(results.map((r) => r.status()).sort()).toEqual([201, 409, 409, 409]);
  const { rows } = await db().query('SELECT count(*)::int AS n FROM participant WHERE display_name = $1', [marker]);
  expect(rows[0].n).toBe(1);
  await Promise.all(contexts.map((c) => c.dispose()));
});

test('친구 요청 쏟아붓기: 한 사람은 1분에 60번까지만 보낼 수 있다', async ({ browser, baseURL }) => {
  const A = await browser.newContext({ baseURL });
  const B = await browser.newContext({ baseURL });
  await signupApi(A.request, { name: 'QA쏟아붓기' });
  const b = await signupApi(B.request, { name: 'QA받는사람' });
  const codes: number[] = [];
  for (let i = 0; i < 62; i++) {
    codes.push((await A.request.post('/api/relations', { headers: SAME, data: { toId: b.userId } })).status());
  }
  expect(codes.slice(0, 60).every((c) => c === 200)).toBe(true);
  expect(codes.slice(60)).toEqual([429, 429]);
  // 다른 사람은 영향을 받지 않는다
  expect((await B.request.get('/api/home')).status()).toBe(200);
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
  const { rows } = await db().query<{ id: string; category: string }>("SELECT id, category FROM tag WHERE category IN ('cohort','team','role') ORDER BY sort, label");
  const cohort = rows.filter((r) => r.category === 'cohort').map((r) => r.id);
  const teams = rows.filter((r) => r.category === 'team').map((r) => r.id);
  const roles = rows.filter((r) => r.category === 'role').map((r) => r.id);
  expect(await bad({ ...base, tags: { ...base.tags, cohort: cohort.slice(0, 2) } })).toBe(400); // 기수 두 개
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [cohort[0]], team: teams.slice(0, 2) } })).toBe(400); // 조 두 개
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [cohort[0]], role: [teams[0]] } })).toBe(400); // 조 태그를 직무 칸에
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [roles[0]] } })).toBe(400); // 직무 태그를 기수 칸에
  expect(await bad({ ...base, tags: { ...base.tags, cohort: [cohort[0]] }, customTags: Array.from({ length: 21 }, (_, i) => `t${i}`) })).toBe(400);
  // 스크립트처럼 생긴 이름은 그대로 글자로 저장되고, 화면에서 실행되지 않는다
  const xss = '<img src=x onerror="window.__pwned=1">';
  expect(await bad({ ...base, displayName: xss, tags: { ...base.tags, cohort: [cohort[0]] }, customTags: ['<script>window.__pwned=1</script>'] })).toBe(200);
  const page = await P.newPage();
  for (const path of ['/home', '/me', `/p/${me.userId}`, '/me/edit']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned), path).toBeUndefined();
  }
  await page.goto('/home');
  await expect(page.getByText(xss).first()).toBeVisible();
  await P.close();
});

test('이름 장난: 안 보이는 글자뿐인 이름은 거절, 줄 뒤집기 · 겹쳐 쌓은 기호 · 여러 칸 띄어쓰기는 정리해서 저장', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  await signupApi(P.request, { name: 'QA이름' });
  const cohort = await tagId('cohort', '1기');
  const base = { tags: { cohort: [cohort], role: [], team: [], region: [] }, customTags: [] as string[] };
  const patch = async (data: object) => (await P.request.patch('/api/me', { headers: SAME, data })).status();
  const saved = async () => (await (await P.request.get('/api/me')).json()) as { displayName: string; customTags: string[] };

  // 폭 없는 공백 · 한글 채움 문자 · 점자 빈칸 · 글머리 표식 · 잇는 글자만
  const blank = ch(0x200b, 0x3164, 0x2800, 0xfeff, 0x200d, 0x1160);
  expect(await patch({ ...base, displayName: blank })).toBe(400);
  expect(await patch({ ...base, displayName: 'QA이름', customTags: [blank] })).toBe(400);
  // 오른쪽에서 왼쪽으로 뒤집는 글자 · 폭 없는 공백 · 줄바꿈 · 여러 칸
  expect(await patch({ ...base, displayName: `QA${ch(0x202e)}뒤집기${ch(0x200b)}   이름${ch(0x0a)}둘째` })).toBe(200);
  expect((await saved()).displayName).toBe('QA뒤집기 이름 둘째');
  // 기호 30개를 한 글자 위에 쌓기 → 3개까지만 남는다
  expect(await patch({ ...base, displayName: `QA쌓기a${ch(...Array.from({ length: 30 }, () => 0x0301))}` })).toBe(200);
  expect((await saved()).displayName.length).toBeLessThanOrEqual(8);
  // 보이는 모양이 같은 기타 태그는 하나로
  expect(await patch({ ...base, displayName: 'QA이름', customTags: ['관심사', ` 관심사${ch(0x200b)}`] })).toBe(200);
  expect((await saved()).customTags).toEqual(['관심사']);
  await P.close();
});

test('이상한 형식의 요청: 서버 오류 없이 거절한다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const anon = await browser.newContext({ baseURL });
  await signupApi(P.request, { name: 'QA형식' });
  const cohort = await tagId('cohort', '1기');
  const tags = { cohort: [cohort], role: [], team: [], region: [] };
  const post = async (path: string, data: unknown) => (await anon.request.post(path, { headers: SAME, data })).status();
  expect(await post('/api/auth/login', { username: {}, password: [] })).toBe(401);
  expect(await post('/api/auth/login', [1, 2])).toBe(400);
  expect(await post('/api/auth/login', { username: 'qa_e2e_nobody', password: 'x'.repeat(129) })).toBe(401);
  expect(await post('/api/auth/signup', { username: 'ab', password: PASSWORD, displayName: 'QA형식', tags, customTags: [] })).toBe(400);
  expect(await post('/api/auth/signup', { username: uid(), password: 'x'.repeat(129), displayName: 'QA형식', tags, customTags: [] })).toBe(400);
  expect(await post('/api/auth/signup', { username: uid(), password: PASSWORD, displayName: 'QA형식', tags: 'nope', customTags: [] })).toBe(400);
  expect(await post('/api/auth/signup', { username: uid(), password: PASSWORD, displayName: ['QA'], tags, customTags: [] })).toBe(400);
  expect(await post('/api/auth/signup', { username: uid(), password: PASSWORD, displayName: 'QA형식', tags: { ...tags, cohort: 'x' }, customTags: [] })).toBe(400);
  expect(await post('/api/auth/signup', { username: uid(), password: PASSWORD, displayName: 'QA형식', tags, customTags: 'x' })).toBe(400);
  // JSON이 아닌 형식으로 보낸 쓰기 요청
  const plain = await anon.request.post('/api/auth/login', { headers: { ...SAME, 'Content-Type': 'text/plain' }, data: '{"username":"a","password":"b"}' });
  expect(plain.status()).toBe(400);
  // 없는 방식 · 없는 그룹 · 이상한 주소
  expect((await P.request.delete('/api/relations', { headers: SAME })).status()).toBe(405);
  expect((await P.request.get('/api/groups/custom:x')).status()).toBe(404);
  expect((await P.request.get(`/api/groups/${encodeURIComponent("team:14조' OR '1'='1")}`)).status()).toBe(404);
  expect((await P.request.get('/api/profiles/not-a-uuid')).status()).toBe(404);
  expect((await P.request.get(`/api/photos/${encodeURIComponent('../../etc/passwd')}`)).status()).toBe(404);
  await anon.close();
  await P.close();
});

test('사진: 진짜 JPEG만 · 용량 · 가로세로 · 횟수 제한, 로그인한 사람만 볼 수 있다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const me = await signupApi(P.request, { name: 'QA사진' });
  const { jpeg, png } = await images(await P.newPage());
  const post = (dataUrl: string, headers = SAME) => P.request.post('/api/me/photo', { headers, data: { dataUrl } });
  const b64 = (v: string | number[]) => Buffer.from(v as never).toString('base64');
  expect((await post('data:text/html;base64,PHNjcmlwdD4=')).status()).toBe(400);
  expect((await post('data:image/svg+xml;base64,PHN2Zy8+')).status()).toBe(400);
  expect((await post(png)).status(), 'PNG').toBe(400);
  // 이름표만 JPEG이고 내용은 다른 파일
  expect((await post(`data:image/jpeg;base64,${b64('<html><script>alert(1)</script></html>')}`)).status()).toBe(400);
  expect((await post(`data:image/jpeg;base64,${b64([0xff, 0xd8, 0xff, 0xd9])}`)).status()).toBe(400);
  // 용량은 작은데 가로세로를 5000px로 적은 사진 (펼치면 휴대폰이 멈추는 사진)
  expect((await post(fakeSize(jpeg, 5000))).status()).toBe(400);
  expect((await post(`data:image/jpeg;base64,${Buffer.alloc(400_000, 1).toString('base64')}`)).status()).toBe(413);
  expect((await post(jpeg, CROSS)).status()).toBe(400);
  expect((await post(jpeg)).status()).toBe(200);

  const anon = await browser.newContext({ baseURL });
  expect((await anon.request.get(`/api/photos/${me.userId}`)).status()).toBe(401);
  const photo = await P.request.get(`/api/photos/${me.userId}`);
  expect(photo.headers()['content-type']).toBe('image/jpeg');
  expect(photo.headers()['cache-control']).toContain('private');
  expect(photo.headers()['x-content-type-options']).toBe('nosniff');

  // 사진을 계속 바꿔 올리기: 한 사람 1분에 10번까지 (위에서 1번 성공)
  const codes: number[] = [];
  for (let i = 0; i < 10; i++) codes.push((await post(jpeg)).status());
  expect(codes.slice(0, 9).every((c) => c === 200)).toBe(true);
  expect(codes[9]).toBe(429);
  await anon.close();
  await P.close();
});

test('보는 도중 로그인이 풀리면: 친구 요청을 누를 때 로그인 화면으로 가고, 로그인하면 그 프로필로 돌아온다', async ({ browser, baseURL }) => {
  const A = await browser.newContext({ baseURL });
  const B = await browser.newContext({ baseURL });
  const a = await signupApi(A.request, { name: 'QA만료' });
  const b = await signupApi(B.request, { name: 'QA상대' });
  const page = await A.newPage();
  await page.goto(`/p/${b.userId}`);
  const button = page.getByRole('button', { name: /친구 요청/ });
  await expect(button).toBeVisible();
  await db().query('DELETE FROM account_session WHERE participant_id = $1', [a.userId]); // 서버에서 로그인이 끝난 상황
  await button.click();
  await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fp%2F${b.userId}$`));
  const sent = await db().query('SELECT 1 FROM friend_relation WHERE requester_id = $1', [a.userId]);
  expect(sent.rowCount, '풀린 로그인으로는 요청이 저장되지 않는다').toBe(0);
  await page.getByLabel('아이디').fill(a.username);
  await page.getByLabel(/^비밀번호\*?$/).fill(PASSWORD);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${b.userId}$`));
  await A.close();
  await B.close();
});

test('명함 읽기를 꺼 둔 동안에는 주소로 직접 불러도 동작하지 않는다', async ({ browser, baseURL }) => {
  const P = await browser.newContext({ baseURL });
  const { jpeg } = await images(await P.newPage());
  const res = await P.request.post('/api/ocr/card', { headers: SAME, data: { image: jpeg } });
  expect(res.status()).toBe(404);
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
  // 막힌 동안에는 맞는 비밀번호도 통하지 않는다(대입으로 맞혀도 못 들어간다)
  expect((await P.request.post('/api/auth/login', { headers: SAME, data: { username: me.username, password: PASSWORD } })).status()).toBe(429);
  await P.close();
});

test('명단 · 아이디 확인 API는 명단의 다른 사람 정보를 내주지 않는다', async ({ request }) => {
  await seedRoster();
  const match = async (name: string, cohort?: string) =>
    (await request.get(`/api/roster/match?name=${encodeURIComponent(name)}${cohort ? `&cohort=${encodeURIComponent(cohort)}` : ''}`)).json();
  expect(await match(`${ROSTER_NAME}' OR '1'='1`, '1기')).toEqual({ teams: [] });
  expect(await match(ROSTER_NAME), '이름만으로는 찾지 않는다').toEqual({ teams: [] });
  expect(await match(ROSTER_NAME, '2기'), '기수가 다르면 찾지 않는다').toEqual({ teams: [] });
  expect(await match(ROSTER_NAME, '%'), '기수 자리에 아무 값').toEqual({ teams: [] });
  expect(await match('%', '1기'), '이름 자리에 와일드카드').toEqual({ teams: [] });
  expect(await match(ROSTER_NAME.slice(0, 3), '1기'), '이름 일부').toEqual({ teams: [] });
  const ok = await match(ROSTER_NAME, '1기');
  expect(ok).toEqual({ teams: ['14조'] });
  expect(Object.keys(ok)).toEqual(['teams']);
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
