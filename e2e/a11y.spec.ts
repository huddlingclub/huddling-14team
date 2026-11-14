import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signupApi } from './helpers';

// 접근성 자동 검사 (CUAgain a11y.spec 틀, WCAG 2.1 AA). 심각 · 중대 위반만 실패로 본다
test('접근성: 로그인 · 등록 · 로그인 뒤 화면', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ baseURL, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const check = async (path: string) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
    const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    return bad.map((v) => `${path} ${v.id}(${v.impact}): ${v.nodes.length}곳 — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  };
  const problems: string[] = [];
  problems.push(...(await check('/login')), ...(await check('/signup')));
  const me = await signupApi(ctx.request, { name: 'QA접근', role: ['기획자'], team: '14조', region: ['강남'] });
  for (const path of ['/home', '/recommend', '/groups', '/me', '/me/edit', '/qr', `/p/${me.userId}`]) problems.push(...(await check(path)));
  expect(problems, problems.join('\n')).toEqual([]);
  await ctx.close();
});
