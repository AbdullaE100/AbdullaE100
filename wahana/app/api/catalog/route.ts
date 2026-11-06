import { NextResponse } from "next/server";
import { getRef } from "@/lib/ref";

export async function GET() {
  const ref = await getRef();
  return NextResponse.json(ref, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600" },
  });
}
