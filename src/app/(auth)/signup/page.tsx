import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account/account-form";
import { destination, type Tag } from "@/lib/profile-input";
import { getTagOptions } from "@/lib/profiles";
import { getSession } from "@/lib/session";

export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = destination((await searchParams).next);
  if (await getSession()) redirect(next);
  let options: Tag[] | null = null;
  try {
    options = await getTagOptions();
  } catch {
    // The sign-up options come from the same catalog the server validates.
  }
  return (
    <main className="account-shell">
      <header className="account-header">
        <p className="account-brand">허들링클럽</p>
        <h1>가입하기</h1>
      </header>
      {options?.some((tag) => tag.category === "cohort") ? (
        <AccountForm mode="signup" options={options} nextPath={next} />
      ) : (
        <>
          <p className="feedback" role="alert">선택지를 불러오지 못했어요.</p>
          <Link href={next === "/home" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`} prefetch={false} className="account-link">다시 시도</Link>
        </>
      )}
    </main>
  );
}
