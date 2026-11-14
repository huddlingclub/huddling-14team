'use client';
// 프로필 입력 (등록 · 프로필 수정 공용) — Figma 07 PG-102-4 · PG-502
// 이름 → 선택 정보(기수 · 직무 · 조 · 근무 지역 칩, 기타 태그). 기수는 그룹 계산에 필요해 필수로 둔다.
// 이름과 기수가 디스코드 조별 명단과 같으면 조를 미리 골라 둔다
import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Chip, iconProps, snapWidth, TextField } from '@/components/ui';
import { limits, type ProfileInput, type Tag, type TagCategory } from '@/lib/profile-input';

export type FieldErrors = Partial<Record<'displayName' | 'cohort' | 'custom', string>>;

/** 저장 전에 화면에서 먼저 확인하는 규칙 (서버 readProfile과 같은 기준) */
export function checkProfile(value: ProfileInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = value.displayName.trim();
  if (!name) errors.displayName = '이름을 입력해 주세요.';
  else if (name.length > limits.name) errors.displayName = `이름은 ${limits.name}자까지 입력할 수 있어요.`;
  if (value.tags.cohort.length !== 1) errors.cohort = '기수를 하나 골라 주세요.';
  return errors;
}

export const emptyProfile = (): ProfileInput => ({
  displayName: '',
  tags: { cohort: [], role: [], team: [], region: [] },
  customTags: [],
});

const GROUPS: { key: TagCategory; label: string; hint?: string }[] = [
  { key: 'cohort', label: '기수' },
  { key: 'role', label: '직무', hint: '여러 개' },
  { key: 'team', label: '조' },
  { key: 'region', label: '근무 지역', hint: '여러 개' },
];

export function ProfileForm({
  value,
  onChange,
  options,
  errors,
  idPrefix,
  nameLabel = '이름',
  optionalHint = '입력할수록 공통점이 있는 사람을 더 잘 찾아줘요',
  rosterMatch = true,
  beforeOptional,
}: {
  value: ProfileInput;
  onChange: (next: ProfileInput) => void;
  options: Tag[];
  errors: FieldErrors;
  idPrefix: string;
  nameLabel?: string;
  optionalHint?: string;
  /** 이름·기수로 디스코드 명단을 찾아 조를 채울지 */
  rosterMatch?: boolean;
  /** 이름 칸 다음 · 선택 정보 앞에 넣을 칸 (예: 수정 화면의 아이디) */
  beforeOptional?: React.ReactNode;
}) {
  const [draft, setDraft] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  // 조를 누가 정했는지: 명단 자동(roster) · 직접(user). 직접 고른 값은 덮어쓰지 않는다
  const [teamSource, setTeamSource] = useState<'none' | 'roster' | 'user'>(value.tags.team.length ? 'user' : 'none');
  const [teamHint, setTeamHint] = useState<string | null>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const byCategory = (c: TagCategory) => options.filter((t) => t.category === c);
  const labelOf = (id: string) => options.find((t) => t.id === id)?.label ?? '';
  const cohortLabel = value.tags.cohort[0] ? labelOf(value.tags.cohort[0]) : '';

  // 빠르게 연달아 눌러도 앞의 선택이 사라지지 않게 마지막 값(latest)에 이어서 바꾼다
  function update(next: ProfileInput) {
    latest.current = next;
    onChange(next);
  }

  function toggle(category: TagCategory, id: string) {
    const cur = latest.current;
    const selected = cur.tags[category];
    let next: string[];
    if (category === 'cohort') next = [id];
    else if (category === 'team') {
      next = selected.includes(id) ? [] : [id]; // 조는 하나만 (다시 누르면 해제)
      setTeamSource(next.length ? 'user' : 'none');
      setTeamHint(null);
    } else next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    update({ ...cur, tags: { ...cur.tags, [category]: next } });
  }

  // 이름·기수가 바뀌면 0.5초 뒤 명단에서 조를 찾는다
  useEffect(() => {
    if (!rosterMatch || teamSource === 'user') return;
    const name = value.displayName.trim();
    if (name.length < 2 || !cohortLabel) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/roster/match?name=${encodeURIComponent(name)}&cohort=${encodeURIComponent(cohortLabel)}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ teams: string[] }>) : { teams: [] }))
        .catch(() => ({ teams: [] as string[] }));
      const cur = latest.current;
      if (res.teams.length === 1) {
        const tag = options.find((t) => t.category === 'team' && t.label === res.teams[0]);
        if (!tag) return;
        update({ ...cur, tags: { ...cur.tags, team: [tag.id] } });
        setTeamSource('roster');
        setTeamHint(`디스코드 ${tag.label} 스레드 명단에서 찾아 골라 뒀어요. 다르면 바꿔 주세요.`);
      } else {
        if (teamSource === 'roster') update({ ...cur, tags: { ...cur.tags, team: [] } });
        setTeamSource('none');
        setTeamHint(res.teams.length > 1 ? `명단에 같은 이름이 ${res.teams.join(' · ')}에 있어요. 내 조를 골라 주세요.` : null);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 이름·기수가 바뀔 때만 찾는다
  }, [value.displayName, cohortLabel, rosterMatch]);

  function addCustom() {
    const label = draft.trim();
    if (!label) return;
    if (label.length > limits.customLength) return setCustomError(`기타 태그는 ${limits.customLength}자까지 입력할 수 있어요.`);
    if (latest.current.customTags.includes(label)) return setCustomError('이미 추가한 태그예요.');
    if (latest.current.customTags.length >= limits.customCount)
      return setCustomError(`기타 태그는 ${limits.customCount}개까지 추가할 수 있어요.`);
    update({ ...latest.current, customTags: [...latest.current.customTags, label] });
    setDraft('');
    setCustomError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <TextField
          id={`${idPrefix}-name`}
          label={nameLabel}
          required
          value={value.displayName}
          onChange={(e) => update({ ...latest.current, displayName: e.target.value })}
          maxLength={limits.name}
          autoComplete="name"
          placeholder="다른 참여자에게 보이는 이름"
          hint="디스코드에 쓰는 실명과 같게 적으면 조를 찾아 골라 드려요"
          error={errors.displayName}
        />
        {beforeOptional}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="t-label-strong">선택 정보</h2>
          <p className="t-support text-[color:var(--color-text-secondary)]">{optionalHint}</p>
        </div>

        {GROUPS.map((g) => {
          const required = g.key === 'cohort';
          const errorId = `${idPrefix}-${g.key}-error`;
          return (
            <fieldset
              key={g.key}
              className="flex flex-col gap-2"
              aria-describedby={required && errors.cohort ? errorId : g.key === 'team' && teamHint ? `${idPrefix}-team-hint` : undefined}
            >
              <legend className="t-support mb-2 flex gap-1 text-[color:var(--color-text-secondary)]">
                {g.label}
                {required && (
                  <span aria-hidden className="text-[color:var(--color-status-error)]">
                    *
                  </span>
                )}
                {g.hint && <span>· {g.hint}</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {byCategory(g.key).map((t) => (
                  <Chip
                    key={t.id}
                    as="button"
                    tone={value.tags[g.key].includes(t.id) ? 'selected' : 'default'}
                    onClick={() => toggle(g.key, t.id)}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
              {required && errors.cohort && (
                <p id={errorId} role="alert" className="t-support text-[color:var(--color-status-error)]">
                  {errors.cohort}
                </p>
              )}
              {g.key === 'team' && teamHint && (
                <p id={`${idPrefix}-team-hint`} role="status" className="t-support text-[color:var(--color-on-highlight-muted)]">
                  {teamHint}
                </p>
              )}
            </fieldset>
          );
        })}

        <div className="flex flex-col gap-2">
          <label htmlFor={`${idPrefix}-custom`} className="t-support flex gap-1 text-[color:var(--color-text-secondary)]">
            기타 태그 <span>· 취미 · 관심사</span>
          </label>
          <div className="flex gap-2">
            <input
              id={`${idPrefix}-custom`}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setCustomError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addCustom();
                }
              }}
              maxLength={limits.customLength}
              enterKeyHint="done"
              placeholder="예: 러닝, 독서"
              aria-invalid={customError ? true : undefined}
              aria-describedby={customError ? `${idPrefix}-custom-error` : undefined}
              className="h-11 min-w-0 flex-1 rounded-[var(--radius-element)] border border-[color:var(--color-border-emphasized)] bg-[var(--color-background-card)] px-3 text-[16px] leading-5 outline-none placeholder:text-[color:var(--color-text-disabled)] focus:border-[color:var(--color-accent)]"
            />
            <button
              ref={snapWidth}
              type="button"
              onClick={addCustom}
              className="t-label flex h-11 shrink-0 items-center gap-1 rounded-[var(--radius-element)] bg-[var(--color-neutral)] px-3"
            >
              <Plus size={16} {...iconProps} />
              추가
            </button>
          </div>
          {customError && (
            <p id={`${idPrefix}-custom-error`} role="alert" className="t-support text-[color:var(--color-status-error)]">
              {customError}
            </p>
          )}
          {value.customTags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {value.customTags.map((t) => (
                <li key={t}>
                  <button
                    ref={snapWidth}
                    type="button"
                    onClick={() => update({ ...latest.current, customTags: latest.current.customTags.filter((x) => x !== t) })}
                    aria-label={`${t} 태그 지우기`}
                    className="t-label inline-flex h-7 items-center gap-1 rounded-full border border-[color:var(--color-border-emphasized)] pl-3 pr-2"
                  >
                    {t}
                    <X size={14} {...iconProps} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
