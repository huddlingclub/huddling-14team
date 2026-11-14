// 네트워킹 도메인 타입 — ERD.md 기준. 화면과 API가 같이 쓴다.

export type Category = 'cohort' | 'role' | 'team' | 'region';
/** 그룹 키 = '항목:값'. 예: 'team:14조'. DB tag(category, label)와 1:1 */
export type TagId = `${Category}:${string}`;

export interface Participant {
  id: string;
  displayName: string;
  /** 선택형 태그. 기수(cohort)는 정확히 1개, 나머지는 0개 이상 */
  tags: TagId[];
  /** 기타 자유 태그 */
  customTags: string[];
  /** 프로필 사진 주소 (/api/photos/:id?v=…). 없으면 마스코트 */
  photo?: string | null;
}

/** 두 사람 사이 관계 한 건 (a < b) */
export interface Relation {
  a: string;
  b: string;
  requesterId: string;
  acceptedAt: Date | string | null;
}

export interface CatalogTag {
  id: string;
  category: Category;
  label: string;
  key: TagId;
}

/** 한 번의 요청에서 쓰는 밋업 전체 스냅샷 */
export interface Network {
  participants: Participant[];
  relations: Relation[];
  /** 항목 → 선택지 순서로 정렬한 태그 카탈로그 */
  catalog: CatalogTag[];
  rank: Map<TagId, number>;
}

/** 화면 버튼 4상태: 친구 요청 · 요청 보냄 · 수락 · 친구 */
export type RelationView = 'none' | 'sent' | 'received' | 'friend';

/** 홈·추천·그룹·친구 목록에서 공통으로 쓰는 사람 행 */
export interface PersonRow {
  id: string;
  displayName: string;
  cohort: string | null;
  /** 나와 겹치는 태그 라벨 (선택형 + 기타) */
  overlap: string[];
  relation: RelationView;
  isMe: boolean;
  photo: string | null;
  /** 이름 아래 보조 줄 — "1기 · 디자이너" (기수 · 직무) */
  meta: string;
}

export interface SelfProfile {
  id: string;
  displayName: string;
  tags: TagId[];
  customTags: string[];
  cohort: string | null;
  photo: string | null;
}

export interface ProfileView {
  id: string;
  displayName: string;
  cohort: string | null;
  tagGroups: { category: Category; categoryLabel: string; labels: string[] }[];
  customTags: string[];
  overlap: string[];
  relation: RelationView;
  isMe: boolean;
  photo: string | null;
  /** "1기 · 마케터 · 14조" (기수 · 직무 · 조) */
  meta: string;
}

export interface GroupSummary {
  key: TagId;
  category: Category;
  categoryLabel: string;
  label: string;
  count: number;
  mine: boolean;
}

export interface HomeGroup extends GroupSummary {
  /** 나를 뺀 같은 태그의 사람 (미리보기) */
  members: PersonRow[];
  /** 나를 뺀 전체 인원 */
  others: number;
}

export interface HomeData {
  me: SelfProfile;
  received: PersonRow[];
  groups: HomeGroup[];
  friends: PersonRow[];
}

export interface RecommendItem extends PersonRow {
  count: number;
}

/** 그룹 탭 — 내 친구를 태그별로 모아 본다 */
export interface FriendRow extends PersonRow {
  /** 이 친구의 선택형 태그 (칩으로 걸러 보기용) */
  tags: TagId[];
}

export interface FriendTag {
  key: TagId;
  category: Category;
  label: string;
  /** 이 태그를 가진 내 친구 수 */
  count: number;
  /** 나도 가진 태그인지 */
  mine: boolean;
}

export interface FriendGroups {
  friends: FriendRow[];
  tags: FriendTag[];
}
