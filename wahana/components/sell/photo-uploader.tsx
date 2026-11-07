"use client";
import { useRef, useState } from "react";
import { ImagePlus, Star, X, ChevronLeft, ChevronRight, AlertCircle, RotateCcw, Camera } from "lucide-react";
import { processImage, removeImages, uploadImage } from "@/lib/photos";
import { photoUrl } from "@/lib/env";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import type { DraftPhoto } from "./draft";

export const MAX_PHOTOS = 15;

export function PhotoUploader({
  userId,
  folder,
  photos,
  onChange,
}: {
  userId: string;
  folder: string;
  photos: DraftPhoto[];
  onChange: (update: (prev: DraftPhoto[]) => DraftPhoto[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const files = useRef(new Map<string, File>());
  const [dragOver, setDragOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);

  const patch = (key: string, p: Partial<DraftPhoto>) => onChange((all) => all.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const run = async (key: string, file: File) => {
    try {
      patch(key, { status: "processing", error: undefined });
      const img = await processImage(file);
      patch(key, { status: "uploading" });
      const up = await uploadImage(userId, folder, img);
      patch(key, { status: "done", ...up });
      files.current.delete(key);
    } catch (e) {
      patch(key, { status: "error", error: (e as Error).message });
    }
  };

  const add = async (list: FileList | File[]) => {
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, room));
    if (!picked.length) return;
    const items = picked.map((f) => {
      const key = crypto.randomUUID();
      files.current.set(key, f);
      return { key, file: f, item: { key, status: "processing" as const, preview: URL.createObjectURL(f) } };
    });
    onChange((all) => [...all, ...items.map((i) => i.item)]);
    // Upload two at a time to stay snappy on mobile data.
    const queue = [...items];
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) await run(next.key, next.file);
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
    // Fresh uploads aren't linked to an ad yet, so their files can go now.
    // Existing photos are only deleted when the seller saves.
    if (p && !p.id && p.path) removeImages([p.path, p.thumb_path].filter(Boolean) as string[]).catch(() => {});
    if (p?.preview) URL.revokeObjectURL(p.preview);
    onChange((all) => all.filter((x) => x.key !== key));
  };

  const full = photos.length >= MAX_PHOTOS;

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) add(e.target.files);
          e.target.value = "";
        }}
        aria-label="Choose photos"
      />

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            add(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            dragOver ? "border-brand bg-brand-soft/50" : "border-border-strong bg-surface hover:border-brand hover:bg-brand-soft/30",
          )}
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-soft-fg">
            <Camera className="size-7" />
          </span>
          <span className="mt-4 text-lg font-bold">Add photos</span>
          <span className="mt-1 max-w-xs text-[15px] text-fg-muted">Take them in daylight: front, back, both sides, the dashboard, seats and engine.</span>
          <span className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-fg">
            <ImagePlus className="size-5" /> Choose photos
          </span>
          <span className="mt-3 text-xs text-fg-subtle">Up to {MAX_PHOTOS} photos. We resize them on your phone so they upload quickly.</span>
        </button>
      ) : (
        <>
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!dragKey && e.dataTransfer.files.length) add(e.dataTransfer.files);
            }}
          >
            {photos.map((p, i) => {
              const src = p.preview ?? photoUrl(p.thumb_path ?? p.path);
              return (
                <li
                  key={p.key}
                  draggable={p.status === "done"}
                  onDragStart={() => setDragKey(p.key)}
                  onDragEnd={() => setDragKey(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragKey || dragKey === p.key) return;
                    onChange((all) => {
                      const from = all.findIndex((x) => x.key === dragKey);
                      const to = all.findIndex((x) => x.key === p.key);
                      if (from < 0 || to < 0) return all;
                      const next = [...all];
                      const [m] = next.splice(from, 1);
                      next.splice(to, 0, m);
                      return next;
                    });
                  }}
                  className={cn("group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-surface-2", i === 0 ? "border-brand ring-2 ring-brand/30" : "border-border", dragKey === p.key && "opacity-50")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {src && <img src={src} alt={`Photo ${i + 1}`} className={cn("h-full w-full object-cover", p.status !== "done" && "opacity-60")} />}
                  {i === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-fg">
                      <Star className="size-3 fill-current" /> Cover
                    </span>
                  )}
                  {(p.status === "processing" || p.status === "uploading") && (
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
                        <Spinner className="size-3.5" /> {p.status === "processing" ? "Preparing" : "Uploading"}
                      </span>
                    </span>
                  )}
                  {p.status === "error" && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-danger-soft/90 p-3 text-center">
                      <AlertCircle className="size-5 text-danger" />
                      <span className="text-xs font-medium text-danger">{p.error}</span>
                      {files.current.get(p.key) && (
                        <button type="button" onClick={() => run(p.key, files.current.get(p.key)!)} className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-semibold">
                          <RotateCcw className="size-3" /> Retry
                        </button>
                      )}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(p.key)}
                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                  {p.status === "done" && photos.length > 1 && (
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
                      <button type="button" disabled={i === 0} onClick={() => move(p.key, -1)} className="grid size-8 place-items-center rounded-full bg-black/60 text-white disabled:opacity-0" aria-label="Move earlier">
                        <ChevronLeft className="size-4" />
                      </button>
                      {i !== 0 && (
                        <button type="button" onClick={() => makeCover(p.key)} className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/80">
                          Make cover
                        </button>
                      )}
                      <button type="button" disabled={i === photos.length - 1} onClick={() => move(p.key, 1)} className="grid size-8 place-items-center rounded-full bg-black/60 text-white disabled:opacity-0" aria-label="Move later">
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
            {!full && (
              <li>
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border-strong text-fg-muted hover:border-brand hover:bg-brand-soft/30 hover:text-brand-text"
                >
                  <ImagePlus className="size-6" />
                  <span className="text-sm font-semibold">Add more</span>
                  <span className="text-xs text-fg-subtle">
                    {photos.length} of {MAX_PHOTOS}
                  </span>
                </button>
              </li>
            )}
          </ul>
          <p className="mt-3 text-[13px] text-fg-muted">The first photo is the cover buyers see in search. Drag photos to reorder, or use the arrows.</p>
        </>
      )}
    </div>
  );
}
