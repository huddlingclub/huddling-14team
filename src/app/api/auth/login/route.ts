import { NextResponse } from "next/server";
import { allowAttempt, fail, readJson, requesterAddress } from "@/lib/account-http";
import { db, transaction } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import { limits, readCredentials, validUsername } from "@/lib/profile-input";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const input = await readJson(request);
  const invalid = () => fail("아이디 또는 비밀번호를 확인해 주세요.", 401);
  if (!input) return fail("로그인 정보를 확인해 주세요.", 400);
  const { username, password } = readCredentials(input);
  if (!validUsername(username) || !password || password.length > limits.passwordMax) return invalid();

  try {
    if (!(await allowAttempt(`login:address:${requesterAddress(request)}`, 30))) {
      return fail("로그인 시도가 많아요. 잠시 후 다시 시도해 주세요.", 429);
    }
    if (!(await allowAttempt(`login:username:${username}`, 5))) {
      return fail("로그인 시도가 많아요. 잠시 후 다시 시도해 주세요.", 429);
    }
    const { rows: [account] } = await db().query<{ userId: string; hash: string }>(
      'SELECT participant_id AS "userId", password_hash AS hash FROM account WHERE username = $1', [username],
    );
    if (!(await verifyPassword(password, account?.hash)) || !account) return invalid();
    const token = await transaction((client) => createSession(client, account.userId));
    await setSessionCookie(token);
    return NextResponse.json({ userId: account.userId });
  } catch {
    return fail("로그인하지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
  }
}
