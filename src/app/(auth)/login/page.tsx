import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account/account-form";
import { destination } from "@/lib/profile-input";
import { getSession } from "@/lib/session";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = destination((await searchParams).next);
  if (await getSession()) redirect(next);
  return (
    <main className="account-shell">
      <header className="account-header">
        <p className="account-brand">허들링클럽</p>
        <h1>로그인</h1>
      </header>
      <AccountForm mode="login" nextPath={next} />
    </main>
  );
}
