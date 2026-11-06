import "server-only";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

export async function requireUser(next: string) {
  const user = await getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}
