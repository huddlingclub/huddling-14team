import type { Category, TagId } from './types';

export interface CategoryDef {
  key: Category;
  label: string;
  /** false = 정확히 1개 (기수) */
  multi: boolean;
  required: boolean;
  options: string[];
}

// 선택지는 운영 기준이 정해지면 여기만 바꾸면 된다.
export const CATEGORIES: CategoryDef[] = [
  { key: 'cohort', label: '기수', multi: false, required: true, options: ['1기', '2기', '3기'] },
  { key: 'role', label: '직무', multi: true, required: false, options: ['디자이너', '기획자', '마케터', '개발자'] },
  {
    key: 'team',
    label: '이번 밋업 조',
    multi: true,
    required: false,
    options: Array.from({ length: 15 }, (_, i) => `${i + 1}조`),
  },
  {
    key: 'region',
    label: '근무 지역',
    multi: true,
    required: false,
    options: ['강남', '판교', '성수', '여의도', '마포', '종로', '원격·기타'],
  },
];

export const tagId = (category: Category, label: string): TagId => `${category}:${label}`;

export function parseTag(id: string): { category: Category; label: string } | null {
  const i = id.indexOf(':');
  if (i < 0) return null;
  const category = id.slice(0, i) as Category;
  const label = id.slice(i + 1);
  const def = CATEGORIES.find((c) => c.key === category);
  if (!def || !def.options.includes(label)) return null;
  return { category, label };
}

export const isValidTag = (id: string): id is TagId => parseTag(id) !== null;

export const categoryLabel = (category: Category) =>
  CATEGORIES.find((c) => c.key === category)?.label ?? category;

export const tagLabel = (id: TagId) => parseTag(id)?.label ?? id;

export function cohortOf(tags: TagId[]): string | null {
  const t = tags.find((x) => x.startsWith('cohort:'));
  return t ? tagLabel(t) : null;
}

/** 카테고리 → 선택지 순서로 정렬 */
export function sortTags(tags: TagId[]): TagId[] {
  const order = (id: TagId) => {
    const p = parseTag(id);
    if (!p) return 9999;
    const ci = CATEGORIES.findIndex((c) => c.key === p.category);
    return ci * 100 + CATEGORIES[ci].options.indexOf(p.label);
  };
  return [...tags].sort((a, b) => order(a) - order(b));
}
