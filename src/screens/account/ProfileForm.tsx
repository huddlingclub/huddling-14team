'use client';
// [교체 예정] 프로필 입력 폼 — 온보딩(가입)과 마이페이지가 같이 쓴다 (ERD.md 입력 규칙)
// 이름·기수 필수 · 기수 1개 · 직무/조/지역 여러 개 · 기타 태그 개별 추가·삭제
import { useState } from 'react';
import { CATEGORIES, tagId, type CategoryDef } from '@/lib/tags';
import type { TagId } from '@/lib/types';

export interface ProfileValue {
  displayName: string;
  tags: TagId[];
  customTags: string[];
}

export const emptyProfile = (): ProfileValue => ({ displayName: '', tags: [], customTags: [] });

export function ProfileForm({ value, onChange }: { value: ProfileValue; onChange: (v: ProfileValue) => void }) {
  const [custom, setCustom] = useState('');

  function toggle(c: CategoryDef, label: string) {
    const id = tagId(c.key, label);
    const has = value.tags.includes(id);
    const tags = c.multi
      ? has
        ? value.tags.filter((t) => t !== id)
        : [...value.tags, id]
      : [...value.tags.filter((t) => !t.startsWith(`${c.key}:`)), id];
    onChange({ ...value, tags });
  }

  function addCustom() {
    const t = custom.trim();
    if (!t || value.customTags.includes(t)) return setCustom('');
    onChange({ ...value, customTags: [...value.customTags, t] });
    setCustom('');
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold">이름 *</span>
        <input
          value={value.displayName}
          onChange={(e) => onChange({ ...value, displayName: e.target.value })}
          maxLength={30}
          placeholder="다른 참여자에게 보이는 이름"
          className="mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
        />
      </label>

      {CATEGORIES.map((c) => (
        <fieldset key={c.key}>
          <legend className="text-sm font-semibold">
            {c.label}
            {c.required ? ' *' : ''}
            <span className="ml-1 font-normal text-gray-500">{c.multi ? '여러 개 선택' : '1개 선택'}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {c.options.map((o) => {
              const on = value.tags.includes(tagId(c.key, o));
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c, o)}
                  className={`h-10 rounded-full border px-4 text-sm ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white'}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset>
        <legend className="text-sm font-semibold">
          기타 <span className="font-normal text-gray-500">직접 입력 · 선택</span>
        </legend>
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            maxLength={20}
            placeholder="예: 러닝"
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-base"
          />
          <button type="button" onClick={addCustom} className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold">
            추가
          </button>
        </div>
        {value.customTags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {value.customTags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, customTags: value.customTags.filter((x) => x !== t) })}
                  aria-label={`${t} 삭제`}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-gray-300 px-3 text-sm"
                >
                  {t} <span aria-hidden>✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  );
}
