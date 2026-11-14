import { fail, readJson } from "@/lib/account-http";
import { endSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await readJson(request))) return fail("잘못된 요청이에요.", 400);
  try {
    await endSession();
    return new Response(null, { status: 204 });
  } catch {
    return fail("로그아웃하지 못했어요. 다시 시도해 주세요.", 503);
  }
}
