// 입력 검증 (ERD.md · 화면정의서.md 01)
import { HttpError } from './http';
import { isValidTag } from './tags';
import type { TagId } from './types';

export interface ProfileInput {
  displayName: string;
  tags: TagId[];
  customTags: string[];
}

const MAX_NAME = 30;
const MAX_CUSTOM = 10;
const MAX_CUSTOM_LEN = 20;

/** 이름 필수(앞뒤 공백 제거) · 기수 정확히 1개 · 직무/조/지역 0개 이상 · 기타 태그 개별 */
export function normalizeProfile(raw: Record<string, unknown>): ProfileInput {
  const displayName = String(raw.displayName ?? '').trim();
  if (!displayName) throw new HttpError(400, '이름을 입력해 주세요', 'displayName');
  if (displayName.length > MAX_NAME) throw new HttpError(400, `이름은 ${MAX_NAME}자까지 쓸 수 있어요`, 'displayName');

  const rawTags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  const tags = [...new Set(rawTags)];
  if (!tags.every(isValidTag)) throw new HttpError(400, '선택할 수 없는 태그가 있어요', 'tags');
  const cohorts = tags.filter((t) => t.startsWith('cohort:'));
  if (cohorts.length !== 1) throw new HttpError(400, '기수를 하나 선택해 주세요', 'cohort');

  const rawCustom = Array.isArray(raw.customTags) ? raw.customTags.map((s) => String(s).trim()) : [];
  const customTags = [...new Set(rawCustom.filter(Boolean))];
  if (customTags.length > MAX_CUSTOM) throw new HttpError(400, `기타 태그는 ${MAX_CUSTOM}개까지예요`, 'customTags');
  if (customTags.some((t) => t.length > MAX_CUSTOM_LEN))
    throw new HttpError(400, `기타 태그는 ${MAX_CUSTOM_LEN}자까지예요`, 'customTags');

  return { displayName, tags: tags as TagId[], customTags };
}

/** 아이디 영문·숫자 4~20자 · 비밀번호 8자 이상 (화면정의서 "제안" 규칙) */
export function normalizeAccount(raw: Record<string, unknown>) {
  const loginId = String(raw.loginId ?? '').trim();
  if (!/^[A-Za-z0-9]{4,20}$/.test(loginId))
    throw new HttpError(400, '아이디는 영문·숫자 4~20자로 입력해 주세요', 'loginId');
  const password = String(raw.password ?? '');
  if (password.length < 8) throw new HttpError(400, '비밀번호는 8자 이상으로 입력해 주세요', 'password');
  if (password.length > 100) throw new HttpError(400, '비밀번호가 너무 길어요', 'password');
  return { loginId: loginId.toLowerCase(), password };
}
