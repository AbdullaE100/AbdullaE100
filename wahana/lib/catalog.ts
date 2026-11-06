"use client";
import { useEffect, useState } from "react";
import type { City, RefData } from "@/lib/types";

let catalogPromise: Promise<RefData> | null = null;
export function loadCatalog() {
  catalogPromise ??= fetch("/api/catalog")
    .then((r) => {
      if (!r.ok) throw new Error("catalog");
      return r.json() as Promise<RefData>;
    })
    .catch((e) => {
      catalogPromise = null;
      throw e;
    });
  return catalogPromise;
}

export function useCatalog(enabled = true) {
  const [data, setData] = useState<RefData | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadCatalog().then((d) => alive && setData(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return data;
}

const cityCache = new Map<number, Promise<City[]>>();
export function loadCities(districtId: number) {
  let p = cityCache.get(districtId);
  if (!p) {
    p = fetch(`/api/cities?district=${districtId}`).then((r) => (r.ok ? r.json() : []));
    cityCache.set(districtId, p);
  }
  return p;
}

export function useCities(districtId: number | null | undefined) {
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    if (!districtId) {
      setCities([]);
      return;
    }
    let alive = true;
    loadCities(districtId).then((c) => alive && setCities(c));
    return () => {
      alive = false;
    };
  }, [districtId]);
  return cities;
}
