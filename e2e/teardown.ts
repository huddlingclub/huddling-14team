import { db } from './helpers';

// 테스트가 만든 계정(qa_e2e_…)과 그 프로필·관계·사진을 지운다 (participant 삭제 시 나머지는 CASCADE)
export default async function teardown() {
  const pool = db();
  const { rowCount } = await pool.query(
    `DELETE FROM participant WHERE id IN (SELECT participant_id FROM account WHERE username LIKE 'qa\\_e2e\\_%')`,
  );
  await pool.query(`DELETE FROM account_attempt WHERE scope LIKE '%qa\\_e2e\\_%'`);
  await pool.query(`DELETE FROM meetup_roster WHERE source = 'e2e'`);
  console.log(`[정리] 테스트 참여자 ${rowCount}명 삭제`);
  await pool.end();
}
