export async function accountRequest(path: string, method: "POST" | "PATCH", body: object) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message ?? "요청을 완료하지 못했어요. 다시 시도해 주세요.");
  }
}

export function messageFor(error: unknown) {
  if (error instanceof Error && !(error instanceof TypeError)) return error.message;
  return "연결을 확인한 뒤 다시 시도해 주세요.";
}
