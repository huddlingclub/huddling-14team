// PG-601 타인 프로필 (QR 링크 /p/<참여자 ID>와 같은 데이터)
import { getParticipant, profileView } from '@/lib/domain';
import { HttpError, handle, ok, participantId, viewerNetwork } from '@/lib/http';

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    const id = participantId((await ctx.params).id, '없는 프로필이에요.');
    const person = getParticipant(net, id);
    if (!person) throw new HttpError(404, '없는 프로필이에요.');
    return ok({ profile: profileView(net, me, person) });
  });
}
