import 'server-only';
// 네트워킹 API 공통 — 오류 응답 형식은 account-http.ts의 fail()과 같은 { message }
import { unstable_rethrow } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getParticipant } from '@/lib/domain';
import { loadNetwork } from '@/lib/network';
import { getSession } from '@/lib/session';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error); // Next 내부 신호는 그대로 넘긴다
    if (error instanceof HttpError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('[network api]', error instanceof Error ? error.message : error);
    return NextResponse.json({ message: '처리하지 못했어요. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new HttpError(401, '로그인해 주세요.');
  return session.userId;
}

/** 다른 사이트에서 보낸 쓰기 요청은 거절한다 (account-http readJson과 같은 기준) */
export function assertSameOrigin(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') throw new HttpError(403, '잘못된 요청이에요.');
}

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** 경로·본문으로 받은 참여자 ID. 형식이 다르면 없는 대상으로 본다 */
export function participantId(value: unknown, notFound: string) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new HttpError(404, notFound);
  return value.toLowerCase();
}

/** 로그인한 참여자와 밋업 전체 스냅샷 */
export async function viewerNetwork() {
  const uid = await requireUser();
  const net = await loadNetwork();
  const me = getParticipant(net, uid);
  if (!me) throw new HttpError(401, '로그인해 주세요.');
  return { uid, net, me };
}
