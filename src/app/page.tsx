import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function EntryPage() {
  redirect(await getSession() ? "/home" : "/login");
}
