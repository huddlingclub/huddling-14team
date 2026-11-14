// 공통점 · 관계 · 그룹 · 추천 계산 (ERD.md "공통점 계산" · "친구 상태와 쓰기 규칙")
import { CATEGORIES, categoryLabel, cohortOf, parseTag, sortTags, tagLabel } from './tags';
import type {
  DB,
  GroupSummary,
  HomeData,
  HomeGroup,
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

export const pair = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);

export function findRelation(db: DB, x: string, y: string): Relation | undefined {
  const [a, b] = pair(x, y);
  return db.relations.find((r) => r.a === a && r.b === b);
}

export function relationView(rel: Relation | undefined, viewerId: string): RelationView {
  if (!rel) return 'none';
  if (rel.acceptedAt) return 'friend';
  return rel.requesterId === viewerId ? 'sent' : 'received';
}

/** 선택형끼리 + 기타끼리 교집합. 같은 항목에서 두 값이 겹치면 두 개로 센다 */
export function overlap(me: Participant, other: Participant): string[] {
  const mine = new Set(me.tags);
  const selected = sortTags(other.tags.filter((t) => mine.has(t))).map(tagLabel);
  const myCustom = new Set(me.customTags);
  const custom = other.customTags.filter((t) => myCustom.has(t));
  return [...selected, ...custom];
}

export function selfProfile(p: Participant): SelfProfile {
  return {
    id: p.id,
    displayName: p.displayName,
    tags: sortTags(p.tags),
    customTags: p.customTags,
    cohort: cohortOf(p.tags),
  };
}

export function getParticipant(db: DB, id: string) {
  return db.participants.find((p) => p.id === id);
}

export function personRow(db: DB, viewer: Participant, p: Participant): PersonRow {
  const isMe = p.id === viewer.id;
  return {
    id: p.id,
    displayName: p.displayName,
    cohort: cohortOf(p.tags),
    overlap: isMe ? [] : overlap(viewer, p),
    relation: isMe ? 'none' : relationView(findRelation(db, viewer.id, p.id), viewer.id),
    isMe,
  };
}

const byName = (a: { displayName: string }, b: { displayName: string }) =>
  a.displayName.localeCompare(b.displayName, 'ko');

export function profileView(db: DB, viewer: Participant, p: Participant): ProfileView {
  const tags = sortTags(p.tags);
  const tagGroups = CATEGORIES.map((c) => ({
    category: c.key,
    categoryLabel: c.label,
    labels: tags.filter((t) => t.startsWith(`${c.key}:`)).map(tagLabel),
  })).filter((g) => g.labels.length > 0);
  const row = personRow(db, viewer, p);
  return {
    id: p.id,
    displayName: p.displayName,
    cohort: row.cohort,
    tagGroups,
    customTags: p.customTags,
    overlap: row.overlap,
    relation: row.relation,
    isMe: row.isMe,
  };
}

/** 이번 밋업의 전체 그룹 (선택형 태그로 집계, 0명 그룹 제외) */
export function groupsOf(db: DB, viewer: Participant): GroupSummary[] {
  const count = new Map<TagId, number>();
  for (const p of db.participants) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
  const out: GroupSummary[] = [];
  for (const c of CATEGORIES) {
    for (const label of c.options) {
      const key = `${c.key}:${label}` as TagId;
      const n = count.get(key) ?? 0;
      if (n === 0) continue;
      out.push({ key, category: c.key, categoryLabel: c.label, label, count: n, mine: viewer.tags.includes(key) });
    }
  }
  return out;
}

export function groupSummary(db: DB, viewer: Participant, key: TagId): GroupSummary | null {
  const p = parseTag(key);
  if (!p) return null;
  return {
    key,
    category: p.category,
    categoryLabel: categoryLabel(p.category),
    label: p.label,
    count: db.participants.filter((x) => x.tags.includes(key)).length,
    mine: viewer.tags.includes(key),
  };
}

export function groupMembers(db: DB, viewer: Participant, key: TagId): PersonRow[] {
  return db.participants
    .filter((p) => p.tags.includes(key))
    .map((p) => personRow(db, viewer, p))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe) || byName(a, b));
}

/** 본인·기존 친구 제외, 공통점 1개 이상, 공통점 많은 순 */
export function recommend(db: DB, viewer: Participant): RecommendItem[] {
  return db.participants
    .filter((p) => p.id !== viewer.id)
    .map((p) => personRow(db, viewer, p))
    .filter((r) => r.relation !== 'friend' && r.overlap.length > 0)
    .map((r) => ({ ...r, count: r.overlap.length }))
    .sort((a, b) => b.count - a.count || byName(a, b));
}

export function relationLists(db: DB, viewer: Participant) {
  const rows = (pred: (r: Relation) => boolean) =>
    db.relations
      .filter((r) => (r.a === viewer.id || r.b === viewer.id) && pred(r))
      .map((r) => getParticipant(db, r.a === viewer.id ? r.b : r.a))
      .filter((p): p is Participant => Boolean(p))
      .map((p) => personRow(db, viewer, p))
      .sort(byName);
  return {
    received: rows((r) => !r.acceptedAt && r.requesterId !== viewer.id),
    sent: rows((r) => !r.acceptedAt && r.requesterId === viewer.id),
    friends: rows((r) => Boolean(r.acceptedAt)),
  };
}

export function homeData(db: DB, viewer: Participant): HomeData {
  const { received, friends } = relationLists(db, viewer);
  const groups: HomeGroup[] = sortTags(viewer.tags).map((key) => {
    const summary = groupSummary(db, viewer, key)!;
    const others = groupMembers(db, viewer, key).filter((r) => !r.isMe);
    return { ...summary, members: others.slice(0, HOME_PREVIEW), others: others.length };
  });
  return { me: selfProfile(viewer), received, groups, friends };
}
