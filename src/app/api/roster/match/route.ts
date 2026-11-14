import { NextResponse } from 'next/server';
import { allowAttempt, fail, requesterAddress } from '@/lib/account-http';
import { db } from '@/lib/db';

// 가입·프로필 수정 때 이름과 기수로 디스코드 조별 명단(meetup_roster)을 찾아 밋업 조를 미리 채운다.
// 명단의 다른 사람 정보는 내주지 않고, 같은 이름·기수의 조 이름만 돌려준다.
const normalize = (v: string) => v.replace(/\s+/g, '').trim();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = normalize(url.searchParams.get('name') ?? '');
  const cohort = url.searchParams.get('cohort') ?? '';
  if (!name || name.length > 40) return NextResponse.json({ teams: [] });
  try {
    if (!(await allowAttempt(`roster:${requesterAddress(request)}`, 120))) {
      return fail('요청이 많아요. 잠시 후 다시 시도해 주세요.', 429);
    }
    const { rows } = await db().query<{ team: string }>(
      `SELECT DISTINCT team FROM meetup_roster
       WHERE regexp_replace(display_name, '\\s', '', 'g') = $1 AND ($2 = '' OR cohort IS NULL OR cohort = $2)
       ORDER BY team`,
      [name, ['1기', '2기', '3기'].includes(cohort) ? cohort : ''],
    );
    return NextResponse.json({ teams: rows.map((r) => r.team) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ teams: [] });
  }
}
