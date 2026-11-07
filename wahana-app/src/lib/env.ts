export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || "https://wahana.lk").replace(/\/$/, "");
export const PHOTO_BUCKET = "listing-photos";

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|file:|blob:|data:)/.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.replace(/^\/+/, "")}`;
}
