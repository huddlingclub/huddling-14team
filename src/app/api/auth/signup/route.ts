import { NextResponse } from "next/server";
import { allowAttempt, fail, readJson, requesterAddress } from "@/lib/account-http";
import { transaction } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { limits, readCredentials, readProfile, validUsername } from "@/lib/profile-input";
import { getTagOptions, saveProfile } from "@/lib/profiles";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const input = await readJson(request);
  if (!input) return fail("가입 정보를 확인해 주세요.", 400);
  const { username, password } = readCredentials(input);
  if (!validUsername(username)) return fail("아이디는 영문, 숫자, 밑줄 3~24자로 입력해 주세요.", 400);
  if (password.length < limits.passwordMin || password.length > limits.passwordMax) {
    return fail(`비밀번호는 ${limits.passwordMin}~${limits.passwordMax}자로 입력해 주세요.`, 400);
  }

  try {
    const options = await getTagOptions();
    let profile;
    try {
      profile = readProfile(input, options);
    } catch (error) {
      return fail((error as Error).message, 400);
    }
    if (!(await allowAttempt(`signup:${requesterAddress(request)}`, 15))) {
      return fail("요청이 많아요. 잠시 후 다시 시도해 주세요.", 429);
    }
    const passwordHash = await hashPassword(password);
    const session = await transaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        "INSERT INTO participant (display_name) VALUES ($1) RETURNING id", [profile.displayName],
      );
      const userId = rows[0].id;
      const account = await client.query(
        "INSERT INTO account (participant_id, username, password_hash) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
        [userId, username, passwordHash],
      );
      if (!account.rowCount) throw new Error("USERNAME_TAKEN");
      await saveProfile(client, userId, profile);
      return { userId, token: await createSession(client, userId) };
    });
    await setSessionCookie(session.token);
    return NextResponse.json({ userId: session.userId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return fail("이미 사용 중인 아이디예요. 다른 아이디를 입력해 주세요.", 409);
    }
    return fail("가입 정보를 저장하지 못했어요. 다시 시도해 주세요.", 503);
  }
}
