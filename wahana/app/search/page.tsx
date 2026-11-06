import { redirect } from "next/navigation";

export default async function SearchRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  redirect(qs ? `/vehicles?${qs}` : "/vehicles");
}
