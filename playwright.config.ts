import { defineConfig, devices } from '@playwright/test';

/**
 * 휴대폰 화면 자동 점검 (CUAgain e2e 설정을 가져와 맞춤).
 * 개발 서버(3200)와 로컬 테스트 DB를 쓴다 — 운영 DB에는 실제 참여자가 있어서 로컬 DB가 아니면 시작하지 않는다.
 * 테스트가 만든 계정은 아이디가 qa_e2e_로 시작하고 끝나면 지운다.
 * 실행: DATABASE_URL=postgresql://localhost/<테스트 DB> npm run test:e2e  (README "자동 점검")
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/setup.ts',
  globalTeardown: './e2e/teardown.ts',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3200',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'android', use: { ...devices['Pixel 7'] }, testIgnore: /(adversarial|a11y)\.spec\.ts/ },
  ],
  webServer: {
    command: 'npx next dev -p 3200',
    url: 'http://localhost:3200/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
