// 태그 항목과 그룹 키 도우미 (화면·서버 공용). 선택지 자체는 DB tag 카탈로그에서 온다.
import type { Category, TagId } from './types';

// 순서·이름은 src/lib/profile-input.ts의 categories와 같게 둔다.
export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'cohort', label: '기수' },
  { key: 'role', label: '직무' },
  { key: 'team', label: '밋업 조' },
  { key: 'region', label: '근무 지역' },
];

export const keyOf = (category: Category, label: string) => `${category}:${label}` as TagId;

export function splitKey(key: string): { category: Category; label: string } | null {
  const i = key.indexOf(':');
  if (i < 0) return null;
  const category = key.slice(0, i) as Category;
  if (!CATEGORIES.some((c) => c.key === category)) return null;
  return { category, label: key.slice(i + 1) };
}

export const categoryLabel = (category: Category) =>
  CATEGORIES.find((c) => c.key === category)?.label ?? category;

export const tagLabel = (key: TagId) => key.slice(key.indexOf(':') + 1);

export function cohortOf(tags: TagId[]): string | null {
  const t = tags.find((x) => x.startsWith('cohort:'));
  return t ? tagLabel(t) : null;
}
