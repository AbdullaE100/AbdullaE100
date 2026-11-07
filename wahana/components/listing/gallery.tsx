"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { photoUrl } from "@/lib/env";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { cn } from "@/lib/cn";

type Photo = { id: string; path: string; thumb_path: string | null; width: number | null; height: number | null };

export function Gallery({ photos, title, type, seed }: { photos: Photo[]; title: string; type: string; seed: number }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const n = photos.length;

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const next = (i + n) % n;
      setIndex(next);
      const el = track.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    },
    [n],
  );

  // Keep index in sync with swipes.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => setIndex(Math.round(el.scrollLeft / el.clientWidth)), 60);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    if (!zoom && d.open) d.close();
  }, [zoom]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, n]);

  if (n === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2 sm:rounded-3xl lg:aspect-[16/10]">
        <VehiclePlaceholder type={type} seed={seed} label="The seller hasn't added photos yet" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="group relative overflow-hidden bg-black sm:rounded-3xl">
        <div ref={track} className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto lg:aspect-[16/10]" aria-roledescription="carousel" aria-label={`${title} photos`}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setZoom(true);
              }}
              className="relative h-full w-full shrink-0 snap-center overflow-hidden"
              aria-label={`Open photo ${i + 1} of ${n}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.thumb_path ?? p.path)!} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(p.path)!}
                alt={i === 0 ? title : ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="relative h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md opacity-0 transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 sm:grid"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md opacity-0 transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 sm:grid"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Expand className="size-3.5" /> {index + 1} / {n}
        </div>
      </div>

      {n > 1 && (
        <div className="no-scrollbar hidden gap-2 overflow-x-auto sm:flex">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={cn("relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-bg transition", i === index ? "ring-brand" : "ring-transparent opacity-70 hover:opacity-100")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.thumb_path ?? p.path)!} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialog}
        onClose={() => setZoom(false)}
        onCancel={() => setZoom(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black"
        aria-label="Photo viewer"
      >
        {zoom && (
          <div
            className="relative flex h-full w-full touch-pan-y items-center justify-center"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current == null || n < 2) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 45) setIndex((i) => (i + (dx < 0 ? 1 : -1) + n) % n);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(photos[index].path)!} alt={`${title}, photo ${index + 1}`} className="max-h-full max-w-full object-contain" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                {index + 1} / {n}
              </span>
              <button type="button" onClick={() => setZoom(false)} className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close photo viewer">
                <X className="size-5" />
              </button>
            </div>
            {n > 1 && (
              <>
                <button type="button" onClick={() => setIndex((index - 1 + n) % n)} className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Previous photo">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={() => setIndex((index + 1) % n)} className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Next photo">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
