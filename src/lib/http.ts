// route handler 공통: 오류 응답 · 세션 확인 · 본문 읽기
import { unstable_rethrow } from 'next/navigation';
import { getSession } from './auth';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e); // Next 내부 신호(빌드 때 동적 처리 전환 등)는 그대로 넘긴다
    if (e instanceof HttpError) {
      return Response.json({ error: e.message, field: e.field }, { status: e.status });
    }
    console.error('[api]', e instanceof Error ? e.message : e);
    return Response.json({ error: '저장하지 못했어요. 다시 시도해 주세요' }, { status: 500 });
  }
}

/** 로그인한 참여자 ID. 없으면 401 */
export async function requireUser(): Promise<string> {
  const s = await getSession();
  if (!s) throw new HttpError(401, '로그인이 필요해요');
  return s.participantId;
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, '잘못된 요청이에요');
  }
}
