// 친구 관계 — 목록 조회 · 친구 요청
import { findRelation, getParticipant, pair, relationLists, relationView } from '@/lib/domain';
import { HttpError, handle, ok, readBody, requireUser } from '@/lib/http';
import { read, write } from '@/lib/store';

export async function GET() {
  return handle(async () => {
    const uid = await requireUser();
    const lists = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      return relationLists(db, me);
    });
    return ok(lists);
  });
}

/**
 * 요청. 두 사람 사이 기록은 한 건만 유지한다.
 * 이미 기록이 있으면(반대 방향 대기 포함) 바꾸지 않고 현재 상태를 돌려준다 (ERD.md).
 */
export async function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUser();
    const toId = String((await readBody(req)).toId ?? '');
    if (!toId) throw new HttpError(400, '요청할 사람을 찾지 못했어요');
    if (toId === uid) throw new HttpError(400, '나에게는 요청할 수 없어요');
    const relation = await write((db) => {
      if (!getParticipant(db, uid)) throw new HttpError(401, '로그인이 필요해요');
      if (!getParticipant(db, toId)) throw new HttpError(404, '없는 프로필이에요');
      let rel = findRelation(db, uid, toId);
      if (!rel) {
        const [a, b] = pair(uid, toId);
        rel = { a, b, requesterId: uid, requestedAt: new Date().toISOString(), acceptedAt: null };
        db.relations.push(rel);
      }
      return relationView(rel, uid);
    });
    return ok({ relation });
  });
}
