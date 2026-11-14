import { defineConfig, devices } from '@playwright/test';

/**
 * 휴대폰 화면 자동 점검 (CUAgain e2e 설정을 가져와 맞춤).
 * 개발 서버(3200)와 .env.local의 DB를 쓴다. 테스트가 만든 계정은 아이디가 qa_e2e_로 시작하고 끝나면 지운다.
 * 실행: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
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
