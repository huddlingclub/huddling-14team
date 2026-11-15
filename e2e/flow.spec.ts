import { expect, test, type Browser } from '@playwright/test';
import { PASSWORD, ROSTER_NAME, loginUi, noHorizontalOverflow, seedRoster, signupApi, uid } from './helpers';

// PRD §5 "휴대폰 두 대로 확인할 상황"을 두 개의 브라우저(=두 기기)로 그대로 따라간다
test.describe.configure({ mode: 'serial' });

async function phone(browser: Browser, baseURL?: string) {
  const u = test.info().project.use;
  const ctx = await browser.newContext({
    baseURL,
    viewport: u.viewport,
    userAgent: u.userAgent,
    deviceScaleFactor: u.deviceScaleFactor,
    isMobile: u.isMobile,
    hasTouch: u.hasTouch,
    locale: 'ko-KR',
    colorScheme: 'dark',
  });
  return { ctx, page: await ctx.newPage() };
}

test('1·2. 같은 조·직무 두 사람: 홈 두 그룹 · 추천 한 장 → 요청 → 받은 요청 배지 → 수락 → 양쪽 친구', async ({ browser, baseURL }) => {
  const A = await phone(browser, baseURL);
  const B = await phone(browser, baseURL);
  const a = await signupApi(A.ctx.request, { name: 'QA가영', cohort: '1기', role: ['기획자'], team: '3조' });
  const b = await signupApi(B.ctx.request, { name: 'QA나리', cohort: '2기', role: ['기획자'], team: '3조' });

  // A 홈: B가 직무 · 밋업 조 두 그룹에 각각 보인다
  await A.page.goto('/home');
  // A 홈: 내 태그별 그룹 칩에 직무 · 조가 있다 (인원 수는 같은 DB의 다른 참여자에 따라 달라진다)
  for (const label of ['기획자', '3조']) {
    await expect(A.page.locator('a[href^="/groups/"]').filter({ hasText: label })).toHaveCount(1);
  }
  await noHorizontalOverflow(A.page);
  // 두 그룹 상세에 각각 B가 보인다
  for (const key of ['role:기획자', 'team:3조']) {
    await A.page.goto(`/groups/${encodeURIComponent(key)}`);
    await expect(A.page.getByText('QA나리')).toHaveCount(1);
  }

  // A 추천: B 카드 한 장, 겹치는 태그 칩 2개(기획자 · 3조)
  await A.page.goto('/recommend');
  const row = A.page.locator('li', { hasText: 'QA나리' });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('겹치는 태그');
  await expect(row).toContainText('기획자');
  await expect(row).toContainText('3조');
  await row.getByRole('button', { name: /친구 요청/ }).click();
  await expect(A.page.getByRole('status').filter({ hasText: 'QA나리 님에게 친구 요청을 보냈어요' })).toBeVisible();
  await expect(row.locator('[data-relation="sent"]')).toBeVisible();

  // B: 하단 탭 홈에 받은 요청 배지 1 → 홈의 받은 요청에서 수락
  await B.page.goto('/groups');
  await expect(B.page.getByRole('link', { name: /홈/ }).first()).toContainText('1');
  await B.page.goto('/home');
  const received = B.page.locator('section', { hasText: '받은 친구 요청' });
  await expect(received).toContainText('1명');
  await received.getByRole('button', { name: /수락/ }).click();
  await expect(B.page.getByRole('status').filter({ hasText: 'QA가영 님과 친구가 됐어요' })).toBeVisible();

  // 다음 조회에서 양쪽 '내 친구'에 서로 한 번씩
  for (const [p, other] of [
    [A.page, 'QA나리'],
    [B.page, 'QA가영'],
  ] as const) {
    await p.goto('/home');
    const friends = p.locator('section', { hasText: '내 친구' });
    await expect(friends).toContainText('1명');
    await expect(friends.getByText(other)).toHaveCount(1);
    await expect(friends.locator('[data-relation="friend"]')).toHaveCount(1);
  }
  // 친구가 되면 추천에서 사라진다
  await A.page.goto('/recommend');
  await expect(A.page.getByText('QA나리')).toHaveCount(0);

  // 4. 친구가 된 B가 공통 태그를 모두 지워도 친구는 남는다
  await B.page.goto('/me/edit');
  await B.page.getByRole('button', { name: '기획자', exact: true }).click();
  await B.page.getByRole('button', { name: '3조', exact: true }).click();
  await B.page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(B.page).toHaveURL(/\/me$/);
  await A.page.goto('/home');
  await expect(A.page.locator('section', { hasText: '내 친구' }).getByText('QA나리')).toHaveCount(1);
  expect(a.userId).not.toBe(b.userId);
  await A.ctx.close();
  await B.ctx.close();
});

test('3. 공통점 없는 두 사람: QR 링크 → 처음 온 사람은 등록 뒤 상대 프로필로 복귀 → 요청 → 역방향으로 수락', async ({ browser, baseURL }) => {
  const B = await phone(browser, baseURL);
  const b = await signupApi(B.ctx.request, { name: 'QA다온', cohort: '3기', role: ['개발자'], team: '9조' });

  // 처음 온 C가 B의 QR(=/p/B) 링크를 연다 → 로그인 화면(돌아갈 곳 유지) → 등록하기
  const C = await phone(browser, baseURL);
  await C.page.goto(`/p/${b.userId}`);
  await expect(C.page).toHaveURL(new RegExp(`/login\\?next=%2Fp%2F${b.userId}`));
  await expect(C.page.getByText('로그인하면 QR로 연 프로필로 바로 이어져요')).toBeVisible();
  await C.page.getByRole('link', { name: '등록하기' }).click();
  await expect(C.page).toHaveURL(/\/signup\?next=/);
  await expect(C.page.getByRole('button', { name: '저장하고 상대 프로필 보기' })).toBeVisible();
  const username = uid();
  await C.page.getByLabel(/^아이디/).fill(username);
  await C.page.getByLabel(/^비밀번호\*?$/).fill(PASSWORD);
  await C.page.getByLabel(/^표시 이름/).fill('QA라온');
  await C.page.getByRole('button', { name: '1기', exact: true }).click();
  await C.page.getByRole('button', { name: '저장하고 상대 프로필 보기' }).click();
  await expect(C.page).toHaveURL(new RegExp(`/p/${b.userId}$`));
  await expect(C.page.getByText('나와 겹치는 태그는 없어요')).toBeVisible();
  await C.page.getByRole('button', { name: /친구 요청/ }).click();
  await expect(C.page.locator('[data-relation="sent"]')).toBeVisible();

  // B가 C의 QR(=/p/C)로 들어오면 '수락' 상태 → 수락 → 반복해서 열어도 '친구'
  const { rows } = await (await import('./helpers')).db().query<{ id: string }>(
    'SELECT participant_id AS id FROM account WHERE username = $1',
    [username],
  );
  await B.page.goto(`/p/${rows[0].id}`);
  await B.page.getByRole('button', { name: /수락/ }).click();
  await expect(B.page.locator('[data-relation="friend"]')).toBeVisible();
  await B.page.reload();
  await expect(B.page.locator('[data-relation="friend"]')).toBeVisible();
  await C.page.goto('/home');
  await expect(C.page.locator('section', { hasText: '내 친구' }).getByText('QA다온')).toHaveCount(1);
  await B.ctx.close();
  await C.ctx.close();
});

test('등록 입력 검사: 빈 칸 · 짧은 비밀번호 · 이미 쓰는 아이디 · 명단으로 조 자동 채움', async ({ browser, baseURL }) => {
  const X = await phone(browser, baseURL);
  const taken = await signupApi(X.ctx.request, { name: 'QA마루' });
  const P = await phone(browser, baseURL);
  await P.page.goto('/signup');
  await P.page.getByRole('button', { name: '내 그룹 보기' }).click();
  for (const m of ['아이디를 입력해 주세요.', '비밀번호를 입력해 주세요.', '이름을 입력해 주세요.', '기수를 하나 골라 주세요.']) {
    await expect(P.page.getByText(m)).toBeVisible();
  }
  await expect(P.page.getByLabel(/^아이디/)).toBeFocused();
  await P.page.getByLabel(/^아이디/).fill(taken.username);
  await P.page.getByLabel(/^비밀번호\*?$/).fill('short');
  await expect(P.page.getByText('이미 쓰는 아이디예요. 다른 아이디를 입력해 주세요.')).toBeVisible();
  await P.page.getByLabel(/^표시 이름/).click();
  await expect(P.page.getByText('비밀번호는 8자 이상 입력해 주세요.')).toBeVisible();
  // 디스코드 명단: 이름 + 기수가 같으면 조를 골라 둔다
  await seedRoster();
  await P.page.getByLabel(/^표시 이름/).fill(ROSTER_NAME);
  await P.page.getByRole('button', { name: '1기', exact: true }).click();
  await expect(P.page.getByRole('button', { name: '14조', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
  await expect(P.page.getByText(/디스코드 14조 스레드 명단에서 찾아 골라 뒀어요/)).toBeVisible();
  await noHorizontalOverflow(P.page);
  await X.ctx.close();
  await P.ctx.close();
});

test('추가한 선택지(기수 운영진 · 퍼스트펭귄, 직무 기타): 순서 · 등록 · 홈 칩 · 그룹 상세 · 수정', async ({ browser, baseURL }) => {
  const P = await phone(browser, baseURL);
  // 등록 화면: 각 칸의 선택지가 이 순서로 있다 ('기타'는 직무 · 근무 지역 두 칸에 있어 칸 안에서 찾는다. 좁은 화면에서는 줄이 바뀐다)
  await P.page.goto('/signup');
  await expect(P.page.getByRole('group', { name: /^기수/ }).getByRole('button')).toHaveText(['1기', '2기', '3기', '운영진', '퍼스트펭귄']);
  await expect(P.page.getByRole('group', { name: /^직무/ }).getByRole('button')).toHaveText(['디자이너', '기획자', '마케터', '개발자', '기타']);
  // 운영진은 디스코드 명단의 기수가 아니라서 조를 미리 채우지 않는다
  const match = await P.ctx.request.get(`/api/roster/match?name=${encodeURIComponent(ROSTER_NAME)}&cohort=${encodeURIComponent('운영진')}`);
  expect(await match.json()).toEqual({ teams: [] });

  // 운영진 · 직무 기타로 등록 → 홈 칩 → 그룹 상세
  // 기기(프로젝트)마다 이름을 달리한다 — 앞 기기에서 만든 계정이 같은 그룹에 남아 있다
  const name = `QA다솜${test.info().project.name}`;
  await signupApi(P.ctx.request, { name, cohort: '운영진', role: ['기타'] });
  await P.page.goto('/home');
  for (const key of ['cohort:운영진', 'role:기타']) {
    // 이 사람은 근무 지역을 고르지 않아 홈의 '기타' 칩은 직무 기타 하나뿐이다
    await expect(P.page.locator('a[href^="/groups/"]').filter({ hasText: key.split(':')[1] }), key).toHaveCount(1);
    await P.page.goto(`/groups/${encodeURIComponent(key)}`);
    await expect(P.page.getByText(name), key).toBeVisible(); // 내 줄은 "이름 (나)"
    await P.page.goto('/home');
  }

  // 프로필 수정에서 퍼스트펭귄으로 바꾸면 운영진은 풀린다 (기수는 하나만)
  await P.page.goto('/me/edit');
  await P.page.getByRole('button', { name: '퍼스트펭귄', exact: true }).click();
  await expect(P.page.getByRole('button', { name: '퍼스트펭귄', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(P.page.getByRole('button', { name: '운영진', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await P.page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(P.page).toHaveURL(/\/me$/);
  await expect(P.page.getByText('퍼스트펭귄', { exact: true })).toBeVisible();
  await P.ctx.close();
});

test('로그인 실패 안내 · 로그아웃 뒤 보호 화면은 로그인으로', async ({ browser, baseURL }) => {
  const P = await phone(browser, baseURL);
  const me = await signupApi(P.ctx.request, { name: 'QA바다' });
  await P.ctx.clearCookies();
  await P.page.goto('/login');
  await P.page.getByLabel(/^아이디/).fill(me.username);
  await P.page.getByLabel(/^비밀번호\*?$/).fill('wrong-password');
  await P.page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(P.page.getByText('아이디 또는 비밀번호를 확인해 주세요.')).toBeVisible();
  await loginUi(P.page, me.username);
  await expect(P.page).toHaveURL(/\/home$/);
  await P.page.goto('/me');
  await P.page.getByRole('button', { name: '로그아웃' }).click();
  await expect(P.page).toHaveURL(/\/login$/);
  for (const path of ['/home', '/recommend', '/groups', '/me', '/me/edit', '/qr', '/scan']) {
    await P.page.goto(path);
    await expect(P.page, path).toHaveURL(/\/login/);
  }
  await P.ctx.close();
});

test('화면 폭 360 · 375 · 768에서 가로 넘침 없음', async ({ browser, baseURL }) => {
  const P = await phone(browser, baseURL);
  const me = await signupApi(P.ctx.request, { name: 'QA사랑', role: ['디자이너', '기획자', '마케터', '개발자'], team: '14조', region: ['강남', '판교', '서초', '여의도', '성수'], custom: ['아주긴기타태그이름입니다아주긴기타태그이름입니다'] });
  for (const width of [360, 375, 768]) {
    await P.page.setViewportSize({ width, height: 800 });
    for (const path of ['/home', '/recommend', '/groups', '/me', '/me/edit', '/qr', `/p/${me.userId}`]) {
      await P.page.goto(path);
      await P.page.waitForLoadState('networkidle');
      await noHorizontalOverflow(P.page);
    }
  }
  await P.ctx.close();
});
