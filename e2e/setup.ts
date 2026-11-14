import { request, type FullConfig } from '@playwright/test';
import { closeDb, db } from './helpers';

// 시작 전에 개발 서버와 테스트가 같은 DB를 보는지 확인한다.
// 서버는 운영 DB, 테스트는 로컬 DB를 보면 화면으로 만든 테스트 계정이 운영에 남기 때문이다.
// 방법: 테스트 DB의 명단에 임시 이름 한 줄을 넣고, 서버의 명단 조회가 그 이름을 찾는지 본다.
export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3200';
  const name = `큐에이확인${Date.now().toString(36)}`;
  await db().query(`INSERT INTO meetup_roster (display_name, cohort, team, source) VALUES ($1, '1기', '14조', 'e2e')`, [name]);
  const ctx = await request.newContext({ baseURL });
  let teams: string[] = [];
  try {
    const res = await ctx.get(`/api/roster/match?name=${encodeURIComponent(name)}&cohort=${encodeURIComponent('1기')}`);
    teams = ((await res.json()) as { teams?: string[] }).teams ?? [];
  } finally {
    await db().query(`DELETE FROM meetup_roster WHERE display_name = $1 AND source = 'e2e'`, [name]);
    await ctx.dispose();
    await closeDb();
  }
  if (!teams.includes('14조')) {
    throw new Error(
      `개발 서버(${baseURL})와 테스트가 서로 다른 DB를 보고 있어요. 개발 서버를 테스트와 같은 DATABASE_URL로 다시 띄워 주세요.`,
    );
  }
}
