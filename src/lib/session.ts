import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { PoolClient } from "pg";
import { db } from "@/lib/db";

const production = process.env.NODE_ENV === "production";
const cookieName = production ? "__Host-huddling-session" : "huddling-session";
const sessionSeconds = 60 * 60 * 24 * 7;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getSession(): Promise<{ userId: string } | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const { rows } = await db().query<{ userId: string }>(
    'SELECT participant_id AS "userId" FROM account_session WHERE token_hash = $1 AND expires_at > now()',
    [digest(token)],
  );
  return rows[0] ?? null;
}

export async function createSession(client: PoolClient, userId: string) {
  const oldToken = (await cookies()).get(cookieName)?.value;
  if (oldToken) await client.query("DELETE FROM account_session WHERE token_hash = $1", [digest(oldToken)]);
  const token = randomBytes(32).toString("base64url");
  await client.query(
    "INSERT INTO account_session (token_hash, participant_id, expires_at) VALUES ($1, $2, now() + $3::integer * interval '1 second')",
    [digest(token), userId, sessionSeconds],
  );
  return token;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(cookieName, token, {
    httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge: sessionSeconds,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db().query("DELETE FROM account_session WHERE token_hash = $1", [digest(token)]);
  jar.set(cookieName, "", { httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge: 0 });
}
