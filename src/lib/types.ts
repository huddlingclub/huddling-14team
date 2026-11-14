// 도메인 타입 — ERD.md 기준. 바꾸려면 개발자 A·B 합의 (WORK_SPLIT.md 4장).

export type Category = 'cohort' | 'role' | 'team' | 'region';
/** 선택형 태그 ID = 그룹 키. 예: 'team:14조', 'role:기획자' */
export type TagId = `${Category}:${string}`;

export interface Participant {
  id: string;
  displayName: string;
  /** 선택형 태그. 기수(cohort)는 정확히 1개, 나머지는 0개 이상 */
  tags: TagId[];
  /** 기타 자유 태그 (앞뒤 공백 제거, 참여자별 중복 없음) */
  customTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  participantId: string;
  /** 소문자로 정규화해 저장 */
  loginId: string;
  passwordHash: string;
  salt: string;
}

export interface Session {
  token: string;
  participantId: string;
  createdAt: string;
}

/** 두 사람 사이 관계는 한 건. a < b 로 정렬해 저장 */
export interface Relation {
  a: string;
  b: string;
  requesterId: string;
  requestedAt: string;
  acceptedAt: string | null;
}

export interface DB {
  participants: Participant[];
  accounts: Account[];
  sessions: Session[];
  relations: Relation[];
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
}

export interface SelfProfile {
  id: string;
  displayName: string;
  tags: TagId[];
  customTags: string[];
  cohort: string | null;
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
