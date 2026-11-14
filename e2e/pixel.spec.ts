import { expect, test } from '@playwright/test';
import { signupApi } from './helpers';

// UI_PIXEL 규칙 점검 — 아이콘(svg)과 테두리 있는 상자가 정수 px 위치·크기에 놓이는지 (DPR 1 · 2, 폭 360 · 375 · 768)
test('아이콘 · 테두리 상자가 정수 px', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'iphone', '한 번만');
  test.setTimeout(400_000);
  const problems: string[] = [];
  for (const deviceScaleFactor of [1, 2]) {
    const ctx = await browser.newContext({ baseURL, deviceScaleFactor, colorScheme: 'dark' });
    const guest = await browser.newContext({ baseURL, deviceScaleFactor, colorScheme: 'dark' });
    const gp = await guest.newPage();
    for (const width of [360, 375, 768]) {
      await gp.setViewportSize({ width, height: 900 });
      for (const path of ['/login', '/signup']) {
        await gp.goto(path);
        await gp.waitForLoadState('load');
        await gp.waitForTimeout(700);
        const bad = await gp.evaluate(() => {
          const frac = (v: number) => Math.abs(v - Math.round(v)) > 0.01;
          const out: string[] = [];
          const els = [...document.querySelectorAll('svg')].concat([...document.querySelectorAll('*')].filter((el) => {
            const cs = getComputedStyle(el);
            return parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && el.tagName !== 'INPUT' && el.tagName !== 'SELECT';
          }));
          for (const el of els) {
            const b = el.getBoundingClientRect();
            if (b.width && [b.left, b.top, b.width, b.height].some(frac)) out.push(`${el.tagName} "${(el.parentElement?.textContent ?? '').trim().slice(0, 12)}" ${[b.left, b.top, b.width, b.height].map((v) => +v.toFixed(2)).join(',')}`);
          }
          return out;
        });
        problems.push(...bad.map((b) => `DPR${deviceScaleFactor} ${width} ${path} ${b}`));
      }
    }
    await guest.close();
    const other = await signupApi((await browser.newContext({ baseURL })).request, { name: 'QA픽셀상대', role: ['기획자'], team: '14조' });
    await signupApi(ctx.request, { name: 'QA픽셀', role: ['기획자', '개발자'], team: '14조', region: ['강남'] });
    const page = await ctx.newPage();
    for (const width of [360, 375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/home', '/recommend', '/groups', '/me', '/me/edit', '/qr', '/scan', `/p/${other.userId}`]) {
        await page.goto(path);
        await page.waitForLoadState('load');
        await page.waitForTimeout(700);
        const bad = await page.evaluate(() => {
          const frac = (v: number) => Math.abs(v - Math.round(v)) > 0.01;
          const out: string[] = [];
          const check = (el: Element, what: string) => {
            const b = el.getBoundingClientRect();
            if (b.width === 0) return;
            if ([b.left, b.top, b.width, b.height].some(frac))
              out.push(`${what} "${(el.parentElement?.textContent ?? '').trim().slice(0, 12)}" ${[b.left, b.top, b.width, b.height].map((v) => +v.toFixed(2)).join(',')}`);
          };
          document.querySelectorAll('svg').forEach((s) => check(s, 'icon'));
          document.querySelectorAll('*').forEach((el) => {
            const cs = getComputedStyle(el);
            if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') check(el, `box(${el.tagName})`);
          });
          return out;
        });
        problems.push(...bad.map((b) => `DPR${deviceScaleFactor} ${width} ${path} ${b}`));
      }
    }
    await ctx.close();
  }
  expect(problems, problems.join('\n')).toEqual([]);
});
