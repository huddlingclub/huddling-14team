// 공통점 · 관계 · 그룹 · 추천 계산 (ERD.md "공통점 계산" · "친구 상태와 쓰기 규칙")
import { CATEGORIES, categoryLabel, cohortOf, splitKey, tagLabel } from './tags';
import type {
  FriendGroups,
  GroupSummary,
  HomeData,
  HomeGroup,
  Network,
  Participant,
  PersonRow,
  ProfileView,
  RecommendItem,
  Relation,
  RelationView,
  SelfProfile,
  TagId,
} from './types';

export const HOME_PREVIEW = 5; // 홈 그룹 섹션 미리보기 인원 (화면정의서 "확정 필요" — 임시값)

/** 두 사람 사이 관계 한 건 (저장 순서와 무관하게 찾는다) */
export function findRelation(net: Network, x: string, y: string): Relation | undefined {
  return net.relations.find((r) => (r.a === x && r.b === y) || (r.a === y && r.b === x));
}

export function relationView(
  rel: Pick<Relation, 'requesterId' | 'acceptedAt'> | undefined,
  viewerId: string,
): RelationView {
  if (!rel) return 'none';
  if (rel.acceptedAt) return 'friend';
  return rel.requesterId === viewerId ? 'sent' : 'received';
}

const sortTags = (net: Network, tags: TagId[]) =>
  [...tags].sort((x, y) => (net.rank.get(x) ?? 1e6) - (net.rank.get(y) ?? 1e6));

/** 선택형끼리 + 기타끼리 교집합. 같은 항목에서 두 값이 겹치면 두 개로 센다 */
export function overlap(net: Network, me: Participant, other: Participant): string[] {
  const mine = new Set(me.tags);
  const selected = sortTags(net, other.tags.filter((t) => mine.has(t))).map(tagLabel);
  const myCustom = new Set(me.customTags);
  return [...selected, ...other.customTags.filter((t) => myCustom.has(t))];
}

export function getParticipant(net: Network, id: string) {
  return net.participants.find((p) => p.id === id);
}

export function selfProfile(net: Network, p: Participant): SelfProfile {
  return { id: p.id, displayName: p.displayName, tags: sortTags(net, p.tags), customTags: p.customTags, cohort: cohortOf(p.tags), photo: p.photo ?? null };
}

/** 이름 아래 보조 줄 — 기수 · 직무 (· 조) */
function metaOf(net: Network, p: Participant, categories: string[]) {
  return sortTags(net, p.tags)
    .filter((t) => categories.some((c) => t.startsWith(`${c}:`)))
    .map(tagLabel)
    .join(' · ');
}

export function personRow(net: Network, viewer: Participant, p: Participant): PersonRow {
  const isMe = p.id === viewer.id;
  return {
    id: p.id,
    displayName: p.displayName,
    cohort: cohortOf(p.tags),
    overlap: isMe ? [] : overlap(net, viewer, p),
    relation: isMe ? 'none' : relationView(findRelation(net, viewer.id, p.id), viewer.id),
    isMe,
    photo: p.photo ?? null,
    meta: metaOf(net, p, ['cohort', 'role']),
  };
}

const byName = (a: { displayName: string }, b: { displayName: string }) =>
  a.displayName.localeCompare(b.displayName, 'ko');

export function profileView(net: Network, viewer: Participant, p: Participant): ProfileView {
  const tags = sortTags(net, p.tags);
  const tagGroups = CATEGORIES.map((c) => ({
    category: c.key,
    categoryLabel: c.label,
    labels: tags.filter((t) => t.startsWith(`${c.key}:`)).map(tagLabel),
  })).filter((g) => g.labels.length > 0);
  const row = personRow(net, viewer, p);
  return {
    id: p.id,
    displayName: p.displayName,
    cohort: row.cohort,
    tagGroups,
    customTags: p.customTags,
    overlap: row.overlap,
    relation: row.relation,
    isMe: row.isMe,
    photo: row.photo,
    meta: metaOf(net, p, ['cohort', 'role', 'team']),
  };
}

/** 이번 밋업의 전체 그룹 (선택형 태그로 집계, 0명 그룹 제외) */
export function groupsOf(net: Network, viewer: Participant): GroupSummary[] {
  const count = new Map<TagId, number>();
  for (const p of net.participants) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return net.catalog
    .filter((t) => (count.get(t.key) ?? 0) > 0)
    .map((t) => ({
      key: t.key,
      category: t.category,
      categoryLabel: categoryLabel(t.category),
      label: t.label,
      count: count.get(t.key) ?? 0,
      mine: viewer.tags.includes(t.key),
    }));
}

export function groupSummary(net: Network, viewer: Participant, key: string): GroupSummary | null {
  const parts = splitKey(key);
  if (!parts || !net.rank.has(key as TagId)) return null;
  const k = key as TagId;
  return {
    key: k,
    category: parts.category,
    categoryLabel: categoryLabel(parts.category),
    label: parts.label,
    count: net.participants.filter((x) => x.tags.includes(k)).length,
    mine: viewer.tags.includes(k),
  };
}

export function groupMembers(net: Network, viewer: Participant, key: TagId): PersonRow[] {
  return net.participants
    .filter((p) => p.tags.includes(key))
    .map((p) => personRow(net, viewer, p))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe) || byName(a, b));
}

/** 본인·기존 친구 제외, 공통점 1개 이상, 공통점 많은 순 */
export function recommend(net: Network, viewer: Participant): RecommendItem[] {
  return net.participants
    .filter((p) => p.id !== viewer.id)
    .map((p) => personRow(net, viewer, p))
    .filter((r) => r.relation !== 'friend' && r.overlap.length > 0)
    .map((r) => ({ ...r, count: r.overlap.length }))
    .sort((a, b) => b.count - a.count || byName(a, b));
}

export function relationLists(net: Network, viewer: Participant) {
  const rows = (pred: (r: Relation) => boolean) =>
    net.relations
      .filter((r) => (r.a === viewer.id || r.b === viewer.id) && pred(r))
      .map((r) => getParticipant(net, r.a === viewer.id ? r.b : r.a))
      .filter((p): p is Participant => Boolean(p))
      .map((p) => personRow(net, viewer, p))
      .sort(byName);
  return {
    received: rows((r) => !r.acceptedAt && r.requesterId !== viewer.id),
    sent: rows((r) => !r.acceptedAt && r.requesterId === viewer.id),
    friends: rows((r) => Boolean(r.acceptedAt)),
  };
}

export function homeData(net: Network, viewer: Participant): HomeData {
  const { received, friends } = relationLists(net, viewer);
  const groups: HomeGroup[] = sortTags(net, viewer.tags).flatMap((key) => {
    const summary = groupSummary(net, viewer, key);
    if (!summary) return [];
    const others = groupMembers(net, viewer, key).filter((r) => !r.isMe);
    return [{ ...summary, members: others.slice(0, HOME_PREVIEW), others: others.length }];
  });
  return { me: selfProfile(net, viewer), received, groups, friends };
}

/** 그룹 탭 — 내 친구와, 친구들이 가진 태그(친구 수 포함). 태그 순서는 카탈로그 순서(기수 → 직무 → 조 → 지역) */
export function friendGroups(net: Network, viewer: Participant): FriendGroups {
  const friends = relationLists(net, viewer).friends.map((row) => ({
    ...row,
    tags: sortTags(net, getParticipant(net, row.id)?.tags ?? []),
  }));
  const count = new Map<TagId, number>();
  for (const f of friends) for (const t of f.tags) count.set(t, (count.get(t) ?? 0) + 1);
  const tags = net.catalog
    .filter((t) => count.has(t.key))
    .map((t) => ({ key: t.key, category: t.category, label: t.label, count: count.get(t.key) ?? 0, mine: viewer.tags.includes(t.key) }));
  return { friends, tags };
}
