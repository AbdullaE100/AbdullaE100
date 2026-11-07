import { decode } from "base64-arraybuffer";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { PHOTO_BUCKET } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { uid } from "./draft";

export const MAX_PHOTOS = 15;

export type Picked = { uri: string; width: number; height: number };

/** Pick from the library (several at once) or take one with the camera. */
export async function pickPhotos(source: "library" | "camera", room: number): Promise<Picked[] | "denied"> {
  if (room <= 0) return [];
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return "denied";
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, exif: false });
    return r.canceled ? [] : r.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
  }
  if (Platform.OS !== "web") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // iOS "limited" access still lets the picker run.
    if (!perm.granted && perm.accessPrivileges !== "limited") return "denied";
  }
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: room,
    orderedSelection: true,
    quality: 1,
    exif: false,
  });
  return r.canceled ? [] : r.assets.slice(0, room).map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

async function render(uri: string, w: number, h: number, maxEdge: number, compress: number) {
  const scale = Math.min(1, maxEdge / Math.max(w || maxEdge, h || maxEdge));
  const ctx = ImageManipulator.manipulate(uri);
  if (scale < 1) ctx.resize(w >= h ? { width: Math.round(w * scale) } : { height: Math.round(h * scale) });
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
  return out;
}

/** Resize on the phone (1600px + 640px thumb) so uploads are quick on mobile data. */
export async function uploadPhoto(userId: string, folder: string, p: Picked) {
  const full = await render(p.uri, p.width, p.height, 1600, 0.82);
  const thumb = await render(p.uri, p.width, p.height, 640, 0.72);
  if (!full.base64 || !thumb.base64) throw new Error("Couldn't process this photo");
  const id = uid();
  const path = `${userId}/${folder}/${id}.jpg`;
  const thumb_path = `${userId}/${folder}/${id}_t.jpg`;
  const opts = { contentType: "image/jpeg", cacheControl: "31536000", upsert: false };
  const [a, b] = await Promise.all([
    supabase.storage.from(PHOTO_BUCKET).upload(path, decode(full.base64), opts),
    supabase.storage.from(PHOTO_BUCKET).upload(thumb_path, decode(thumb.base64), opts),
  ]);
  if (a.error || b.error) throw new Error((a.error || b.error)!.message || "Upload failed");
  return { path, thumb_path, width: full.width, height: full.height };
}

export function removePhotos(paths: string[]) {
  if (!paths.length) return Promise.resolve();
  return supabase.storage
    .from(PHOTO_BUCKET)
    .remove(paths)
    .then(() => {});
}
