"use client";

import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState, type KeyboardEvent } from "react";
import { categories, limits, type ProfileInput, type Tag, type TagCategory } from "@/lib/profile-input";

export function ProfileFields({
  value, options, onChange,
}: {
  value: ProfileInput;
  options: Tag[];
  onChange: (profile: ProfileInput) => void;
}) {
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");

  function selectTag(category: TagCategory, id: string) {
    const selected = value.tags[category];
    const next = category === "cohort" ? [id]
      : selected.includes(id) ? selected.filter((tagId) => tagId !== id)
      : [...selected, id];
    onChange({ ...value, tags: { ...value.tags, [category]: next } });
  }

  function addTag() {
    const label = draft.trim();
    if (!label) return;
    if (label.length > limits.customLength) {
      setFeedback(`기타 태그는 ${limits.customLength}자까지 입력할 수 있어요.`);
      return;
    }
    if (value.customTags.includes(label)) {
      setFeedback("이미 추가한 태그예요.");
      return;
    }
    if (value.customTags.length >= limits.customCount) {
      setFeedback(`기타 태그는 최대 ${limits.customCount}개까지 추가할 수 있어요.`);
      return;
    }
    onChange({ ...value, customTags: [...value.customTags, label] });
    setDraft("");
    setFeedback("");
  }

  function handleTagKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    addTag();
  }

  return (
    <div className="profile-fields">
      <TextInput
        label="표시 이름" autoComplete="nickname" isRequired width="100%"
        value={value.displayName}
        onChange={(displayName) => onChange({ ...value, displayName })}
      />
      {categories.map(({ key, label }) => (
        <fieldset key={key}>
          <legend className="font-semibold">{label} {key === "cohort" ? "(필수)" : ""}</legend>
          <div className="tag-options">
            {options.filter((tag) => tag.category === key).map((tag) => (
              <label key={tag.id} className="tag-option">
                <input
                  type={key === "cohort" ? "radio" : "checkbox"}
                  name={key}
                  checked={value.tags[key].includes(tag.id)}
                  required={key === "cohort"}
                  onChange={() => selectTag(key, tag.id)}
                />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="grid gap-2">
        <legend className="font-semibold">기타</legend>
        <div className="custom-input">
          <TextInput
            label="기타 태그" isLabelHidden placeholder="예: 러닝" value={draft} width="100%"
            onChange={(value) => { setDraft(value); setFeedback(""); }}
            onKeyDown={handleTagKey}
          />
          <Button type="button" variant="secondary" label="추가" onClick={addTag} />
        </div>
        {feedback && <p className="account-hint" role="status">{feedback}</p>}
        {value.customTags.length > 0 && (
          <ul className="tag-options">
            {value.customTags.map((label) => (
              <li key={label}>
                <Button
                  type="button" variant="secondary" label={`${label} 삭제`}
                  onClick={() => {
                    setFeedback("");
                    onChange({ ...value, customTags: value.customTags.filter((tag) => tag !== label) });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  );
}
