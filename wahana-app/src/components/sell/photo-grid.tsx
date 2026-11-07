import { Image } from "expo-image";
import { AlertCircle, Camera, ChevronLeft, ChevronRight, ImagePlus, RotateCcw, Star, X } from "lucide-react-native";
import { useRef } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { photoUrl } from "@/lib/env";
import { uid, type DraftPhoto } from "@/lib/sell/draft";
import { MAX_PHOTOS, pickPhotos, removePhotos, uploadPhoto, type Picked } from "@/lib/sell/photos";
import { radius, useColors } from "@/lib/theme";

type Update = (fn: (prev: DraftPhoto[]) => DraftPhoto[]) => void;

export function PhotoGrid({ userId, folder, photos, onChange }: { userId: string; folder: string; photos: DraftPhoto[]; onChange: Update }) {
  const c = useColors();
  const { toast } = useToast();
  const { width } = useWindowDimensions();
  const sources = useRef(new Map<string, Picked>());
  const cols = width >= 700 ? 4 : 3;
  const size = Math.floor((Math.min(width, 720) - 32 - (cols - 1) * 8) / cols);

  const patch = (key: string, p: Partial<DraftPhoto>) => onChange((all) => all.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const run = async (key: string) => {
    const src = sources.current.get(key);
    if (!src) return;
    try {
      patch(key, { status: "uploading", error: undefined });
      const up = await uploadPhoto(userId, folder, src);
      patch(key, { status: "done", ...up });
      sources.current.delete(key);
    } catch (e) {
      patch(key, { status: "error", error: (e as Error).message || "Upload failed" });
    }
  };

  const add = async (from: "library" | "camera") => {
    const room = MAX_PHOTOS - photos.length;
    const picked = await pickPhotos(from, room);
    if (picked === "denied") {
      const msg = from === "camera" ? "Allow camera access in Settings to take photos." : "Allow photo access in Settings to add photos.";
      if (Platform.OS === "web") return toast({ tone: "error", title: msg });
      return Alert.alert("Permission needed", msg, [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
    }
    if (!picked.length) return;
    track("sell_photo_added", { count: picked.length, source: from, total: photos.length + picked.length });
    const items = picked.map((p) => {
      const key = uid();
      sources.current.set(key, p);
      return { key, status: "processing" as const, localUri: p.uri };
    });
    onChange((all) => [...all, ...items]);
    // Two at a time keeps things quick on mobile data without stalling the UI.
    const queue = items.map((i) => i.key);
    const worker = async () => {
      for (let k = queue.shift(); k; k = queue.shift()) await run(k);
    };
    await Promise.all([worker(), worker()]);
  };

  const move = (key: string, dir: -1 | 1) =>
    onChange((all) => {
      const i = all.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const makeCover = (key: string) => onChange((all) => [...all.filter((x) => x.key === key), ...all.filter((x) => x.key !== key)]);
  const remove = (key: string) => {
    const p = photos.find((x) => x.key === key);
    // New uploads aren't attached to an ad yet, so their files can go now; existing ones go on save.
    if (p && !p.id && p.path) removePhotos([p.path, p.thumb_path].filter(Boolean) as string[]).catch(() => {});
    sources.current.delete(key);
    onChange((all) => all.filter((x) => x.key !== key));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Button
          title="Add photos"
          icon={<ImagePlus size={18} color="#fff" />}
          size="lg"
          style={styles.flex}
          disabled={photos.length >= MAX_PHOTOS}
          onPress={() => add("library")}
        />
        {Platform.OS !== "web" && (
          <Button title="Camera" variant="outline" icon={<Camera size={18} color={c.brandText} />} size="lg" disabled={photos.length >= MAX_PHOTOS} onPress={() => add("camera")} />
        )}
      </View>
      <Text variant="small" tone="muted">
        {photos.length} of {MAX_PHOTOS} photos. The first one is the cover buyers see in search.
      </Text>

      {photos.length === 0 ? (
        <Pressable
          onPress={() => add("library")}
          accessibilityRole="button"
          accessibilityLabel="Add photos"
          style={({ pressed }) => [styles.empty, { borderColor: c.borderStrong, backgroundColor: pressed ? c.surface2 : c.surface }]}
        >
          <ImagePlus size={32} color={c.fgSubtle} />
          <Text variant="body" weight="700">
            Add up to {MAX_PHOTOS} photos
          </Text>
          <Text variant="small" tone="muted" style={styles.center}>
            Front, back, both sides, interior, dashboard with mileage, and the engine.
          </Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {photos.map((p, i) => {
            const uri = p.localUri ?? photoUrl(p.thumb_path ?? p.path) ?? undefined;
            const busy = p.status === "processing" || p.status === "uploading";
            return (
              <View key={p.key} style={[styles.tile, { width: size, height: size, backgroundColor: c.surface2, borderColor: p.status === "error" ? c.danger : c.border }]}>
                {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                {busy && (
                  <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                    <ActivityIndicator color="#fff" />
                    <Text variant="caption" weight="700" tone="inverse">
                      Uploading
                    </Text>
                  </View>
                )}
                {p.status === "error" && (
                  <Pressable
                    onPress={() => run(p.key)}
                    accessibilityRole="button"
                    accessibilityLabel="Retry upload"
                    style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: "rgba(120,0,0,0.55)" }]}
                  >
                    {p.localUri ? <RotateCcw size={22} color="#fff" /> : <AlertCircle size={22} color="#fff" />}
                    <Text variant="caption" weight="700" tone="inverse">
                      {p.localUri ? "Tap to retry" : "Failed"}
                    </Text>
                  </Pressable>
                )}
                {i === 0 && p.status === "done" && (
                  <View style={[styles.cover, { backgroundColor: c.brand }]}>
                    <Text variant="caption" weight="700" tone="inverse">
                      Cover
                    </Text>
                  </View>
                )}
                <Pressable onPress={() => remove(p.key)} accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} hitSlop={6} style={styles.remove}>
                  <X size={14} color="#fff" strokeWidth={3} />
                </Pressable>
                {p.status === "done" && photos.length > 1 && (
                  <View style={styles.tools}>
                    <SmallBtn label={`Move photo ${i + 1} earlier`} disabled={i === 0} onPress={() => move(p.key, -1)} icon={<ChevronLeft size={16} color="#fff" />} />
                    {i !== 0 && <SmallBtn label={`Make photo ${i + 1} the cover`} onPress={() => makeCover(p.key)} icon={<Star size={14} color="#fff" />} />}
                    <SmallBtn
                      label={`Move photo ${i + 1} later`}
                      disabled={i === photos.length - 1}
                      onPress={() => move(p.key, 1)}
                      icon={<ChevronRight size={16} color="#fff" />}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SmallBtn({ icon, label, onPress, disabled }: { icon: React.ReactNode; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={[styles.small, disabled && { opacity: 0.35 }]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  actions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  empty: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: radius.xl, padding: 28, alignItems: "center", gap: 6 },
  center: { textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1 },
  overlay: { alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.45)" },
  cover: { position: "absolute", left: 6, top: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  remove: { position: "absolute", right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  tools: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between", padding: 4, backgroundColor: "rgba(0,0,0,0.45)" },
  small: { width: 30, height: 28, alignItems: "center", justifyContent: "center" },
});
