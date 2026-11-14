import { NextResponse } from "next/server";
import { allowAttempt, fail, readJson } from "@/lib/account-http";
import { transaction } from "@/lib/db";
import { readProfile } from "@/lib/profile-input";
import { getProfile, getTagOptions, saveProfile } from "@/lib/profiles";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("로그인해 주세요.", 401);
    const profile = await getProfile(session.userId);
    if (!profile) return fail("프로필을 찾지 못했어요.", 404);
    return NextResponse.json(profile, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("프로필을 불러오지 못했어요. 다시 시도해 주세요.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("로그인해 주세요.", 401);
    const input = await readJson(request);
    if (!input) return fail("프로필 정보를 확인해 주세요.", 400);
    if (!(await allowAttempt(`profile:${session.userId}`, 30))) {
      return fail("요청이 많아요. 잠시 후 다시 시도해 주세요.", 429);
    }
    const options = await getTagOptions();
    let profile;
    try {
      profile = readProfile(input, options);
    } catch (error) {
      return fail((error as Error).message, 400);
    }
    await transaction((client) => saveProfile(client, session.userId, profile));
    return NextResponse.json({ userId: session.userId, ...profile });
  } catch {
    return fail("변경사항을 저장하지 못했어요. 다시 시도해 주세요.", 503);
  }
}
