import { NextResponse, type NextRequest } from "next/server";
import { getCities } from "@/lib/ref";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("district"));
  if (!Number.isInteger(id) || id < 1 || id > 99) return NextResponse.json([], { status: 400 });
  const cities = await getCities(id);
  return NextResponse.json(cities, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
