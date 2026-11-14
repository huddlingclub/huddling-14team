import { NextResponse } from 'next/server';
import { allowAttempt, fail, requesterAddress } from '@/lib/account-http';
import { db } from '@/lib/db';
import { validUsername } from '@/lib/profile-input';

// 등록 화면에서 아이디를 다 쓰면 바로 쓸 수 있는지 알려 준다 (저장 때 서버가 다시 확인한다)
export async function GET(request: Request) {
  const u = (new URL(request.url).searchParams.get('u') ?? '').trim().toLowerCase();
  if (!validUsername(u)) return NextResponse.json({ available: false, reason: 'format' });
  try {
    if (!(await allowAttempt(`username-check:${requesterAddress(request)}`, 120))) {
      return fail('요청이 많아요. 잠시 후 다시 시도해 주세요.', 429);
    }
    const { rowCount } = await db().query('SELECT 1 FROM account WHERE username = $1', [u]);
    return NextResponse.json({ available: !rowCount }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ available: true }); // 확인 못 하면 막지 않고 저장 때 확인
  }
}
