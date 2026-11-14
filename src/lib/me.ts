import 'server-only';
// 마이페이지 · 프로필 수정 · 내 QR 화면이 서버에서 바로 읽는 내 정보
import { db } from '@/lib/db';
import { getProfile, getTagOptions } from '@/lib/profiles';
import { CATEGORIES, keyOf } from '@/lib/tags';
import type { Category, TagId } from '@/lib/types';

export async function getMe(userId: string) {
  const [profile, options, extra] = await Promise.all([
    getProfile(userId),
    getTagOptions(),
    db().query<{ username: string | null; v: string | null }>(
      `SELECT a.username, floor(extract(epoch FROM ph.updated_at))::bigint::text AS v
       FROM participant p
       LEFT JOIN account a ON a.participant_id = p.id
       LEFT JOIN participant_photo ph ON ph.participant_id = p.id
       WHERE p.id = $1`,
      [userId],
    ),
  ]);
  if (!profile) return null;
  const row = extra.rows[0];
  // 화면 표시용 태그 (선택지 순서대로)
  const picked = new Set(Object.values(profile.tags).flat());
  const order = (c: string) => CATEGORIES.findIndex((x) => x.key === c);
  const tags: TagId[] = options
    .filter((t) => picked.has(t.id))
    .sort((a, b) => order(a.category) - order(b.category)) // 기수 → 직무 → 조 → 지역 (같은 항목 안에서는 선택지 순서 유지)
    .map((t) => keyOf(t.category as Category, t.label));
  return {
    id: userId,
    profile,
    options,
    tags,
    username: row?.username ?? '',
    photo: row?.v ? `/api/photos/${userId}?v=${row.v}` : null,
  };
}
