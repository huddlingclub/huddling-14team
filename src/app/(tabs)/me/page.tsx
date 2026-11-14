import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account/account-form";
import { getProfile, getTagOptions } from "@/lib/profiles";
import { getSession } from "@/lib/session";

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [profile, options] = await Promise.all([getProfile(session.userId), getTagOptions()]);
  if (!profile) redirect("/login");
  return (
    <main className="account-shell">
      <header className="account-header">
        <h1>마이페이지</h1>
      </header>
      <AccountForm mode="edit" initial={profile} options={options} nextPath="/home" />
    </main>
  );
}
