export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const PHOTO_BUCKET = "listing-photos";

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.replace(/^\/+/, "")}`;
}
