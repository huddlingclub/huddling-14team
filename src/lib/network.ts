import 'server-only';
// 밋업 전체 스냅샷 읽기 — 참여자·선택형 태그·기타 태그·관계·태그 카탈로그.
// 밋업 한 곳(수십~수백 명) 규모라 요청마다 한 번에 읽고, 공통점·그룹·추천은 domain.ts에서 계산한다.
import { db } from '@/lib/db';
import { CATEGORIES, keyOf } from '@/lib/tags';
import type { CatalogTag, Category, Network, Participant } from '@/lib/types';

export async function loadNetwork(): Promise<Network> {
  const pool = db();
  const [tags, people, picked, custom, relations, photos] = await Promise.all([
    pool.query<{ id: string; category: Category; label: string }>(
      'SELECT id, category, label FROM tag ORDER BY sort, length(label), label',
    ),
    pool.query<{ id: string; displayName: string }>('SELECT id, display_name AS "displayName" FROM participant'),
    pool.query<{ participantId: string; category: Category; label: string }>(
      `SELECT pt.participant_id AS "participantId", t.category, t.label
       FROM participant_tag pt JOIN tag t ON t.id = pt.tag_id`,
    ),
    pool.query<{ participantId: string; label: string }>(
      'SELECT participant_id AS "participantId", label FROM participant_custom_tag ORDER BY label',
    ),
    pool.query<{ a: string; b: string; requesterId: string; acceptedAt: Date | null }>(
      `SELECT participant_a_id AS a, participant_b_id AS b, requester_id AS "requesterId", accepted_at AS "acceptedAt"
       FROM friend_relation`,
    ),
    pool.query<{ participantId: string; v: string }>(
      `SELECT participant_id AS "participantId", floor(extract(epoch FROM updated_at))::bigint::text AS v FROM participant_photo`,
    ),
  ]);

  const order = (c: Category) => CATEGORIES.findIndex((x) => x.key === c);
  // 정렬은 안정 정렬이라 항목 안에서는 SQL 순서(짧은 라벨 → 가나다)를 유지한다
  const catalog: CatalogTag[] = tags.rows
    .map((t) => ({ ...t, key: keyOf(t.category, t.label) }))
    .sort((x, y) => order(x.category) - order(y.category));
  const rank = new Map(catalog.map((t, i) => [t.key, i] as const));

  const byId = new Map<string, Participant>(
    people.rows.map((p) => [p.id, { id: p.id, displayName: p.displayName, tags: [], customTags: [] }]),
  );
  for (const r of picked.rows) byId.get(r.participantId)?.tags.push(keyOf(r.category, r.label));
  for (const r of custom.rows) byId.get(r.participantId)?.customTags.push(r.label);
  for (const r of photos.rows) {
    const p = byId.get(r.participantId);
    if (p) p.photo = `/api/photos/${r.participantId}?v=${r.v}`;
  }

  return { participants: [...byId.values()], relations: relations.rows, catalog, rank };
}
