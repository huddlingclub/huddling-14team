import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return null;
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  const value: unknown = await request.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

// 지난 시도 기록과 끝난 로그인 기록은 1분에 한 번쯤 지운다.
// 아무 아이디로나 로그인을 시도해 기록을 끝없이 쌓는 것을 막는다 (지우기에 실패해도 요청은 그대로 처리)
let prunedAt = 0;
async function pruneOldRows() {
  if (Date.now() - prunedAt < 60_000) return;
  prunedAt = Date.now();
  try {
    await db().query("DELETE FROM account_attempt WHERE window_start < now() - interval '10 minutes'");
    await db().query("DELETE FROM account_session WHERE expires_at < now()");
  } catch {
    // 다음 차례에 다시 시도
  }
}

export async function allowAttempt(scope: string, limit: number) {
  await pruneOldRows();
  const { rows } = await db().query<{ attempts: number }>(
    `INSERT INTO account_attempt (scope, window_start, attempts) VALUES ($1, now(), 1)
     ON CONFLICT (scope) DO UPDATE SET
       attempts = CASE WHEN account_attempt.window_start <= now() - interval '1 minute'
         THEN 1 ELSE LEAST(account_attempt.attempts + 1, $2 + 1) END,
       window_start = CASE WHEN account_attempt.window_start <= now() - interval '1 minute'
         THEN now() ELSE account_attempt.window_start END
     RETURNING attempts`,
    [scope, limit],
  );
  return rows[0].attempts <= limit;
}

export function requesterAddress(request: Request) {
  // Vercel supplies this header at ingress. Use a single bucket for local development.
  return process.env.VERCEL === "1" ? request.headers.get("x-forwarded-for") ?? "unknown" : "local";
}
