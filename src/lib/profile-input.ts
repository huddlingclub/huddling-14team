export const categories = [
  { key: "cohort", label: "기수" },
  { key: "role", label: "직무" },
  { key: "team", label: "밋업 조" },
  { key: "region", label: "근무 지역" },
] as const;

export type TagCategory = (typeof categories)[number]["key"];
export type Tag = { id: string; category: TagCategory; label: string };
export type ProfileInput = {
  displayName: string;
  tags: Record<TagCategory, string[]>;
  customTags: string[];
};
export type Profile = ProfileInput & { userId: string };

// 비밀번호 최소 길이: 밋업 현장에서 휴대폰으로 바로 입력할 수 있게 8자로 둔다 (화면정의서 제안값)
export const limits = { name: 40, customLength: 40, customCount: 20, passwordMin: 8, passwordMax: 128 };
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function destination(value: unknown) {
  return typeof value === "string" && value.startsWith("/p/") && uuid.test(value.slice(3))
    ? value
    : "/home";
}

export function readCredentials(input: Record<string, unknown>) {
  return {
    username: typeof input.username === "string" ? input.username.trim().toLowerCase() : "",
    password: typeof input.password === "string" ? input.password : "",
  };
}

export function validUsername(value: string) {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

export function readProfile(input: Record<string, unknown>, options: Tag[]): ProfileInput {
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (!displayName || displayName.length > limits.name) throw new Error("표시 이름을 확인해 주세요.");

  const selected = input.tags;
  if (!selected || typeof selected !== "object") throw new Error("기수를 하나 선택해 주세요.");
  const tags: ProfileInput["tags"] = { cohort: [], role: [], team: [], region: [] };

  for (const { key, label } of categories) {
    const values: unknown = (selected as Record<string, unknown>)[key];
    if (!Array.isArray(values)) throw new Error(`${label} 선택값을 확인해 주세요.`);
    if (key === "cohort" && values.length !== 1) throw new Error("기수를 하나 선택해 주세요.");
    if (key === "team" && values.length > 1) throw new Error("밋업 조는 하나만 선택해 주세요.");
    const allowed = new Set(options.filter((tag) => tag.category === key).map((tag) => tag.id));
    if (values.some((value) => typeof value !== "string" || !allowed.has(value))) {
      throw new Error(`${label} 선택값을 확인해 주세요.`);
    }
    tags[key] = [...new Set<string>(values)];
  }

  if (!Array.isArray(input.customTags) || input.customTags.length > limits.customCount) {
    throw new Error(`기타 태그는 최대 ${limits.customCount}개까지 추가할 수 있어요.`);
  }
  const customTags = input.customTags.map((value: unknown) => {
    const label = typeof value === "string" ? value.trim() : "";
    if (!label || label.length > limits.customLength) throw new Error("기타 태그를 확인해 주세요.");
    return label;
  });
  return { displayName, tags, customTags: [...new Set(customTags)] };
}
