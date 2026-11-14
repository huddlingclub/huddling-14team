import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  if (!(await getSession())) redirect("/login");
  return (
    <main className="account-shell">
      <header className="account-header"><h1>홈</h1></header>
      <Link href="/me" className="account-link">마이페이지</Link>
    </main>
  );
}
