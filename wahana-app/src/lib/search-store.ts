import { router } from "expo-router";
import { useSyncExternalStore } from "react";
import { QUERY_KEYS, parseFilters, type Filters } from "@shared/search";
import { VEHICLE_TYPES } from "@shared/constants";

// The Search tab's filters live here rather than in route params, so any
// screen can open a search and the filter sheet can edit it without param
// merging surprises. Deep links (wahana://search?make=toyota) seed it.

let current: Filters = {};
let version = 0;
const listeners = new Set<() => void>();

export const searchStore = {
  get: () => current,
  version: () => version,
  set(next: Filters) {
    current = compact(next);
    version += 1;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useFilters(): Filters {
  return useSyncExternalStore(searchStore.subscribe, searchStore.get, searchStore.get);
}

function compact(f: Filters): Filters {
  const out: Filters = {};
  for (const [k, v] of Object.entries(f)) if (v != null && v !== "") out[k as keyof Filters] = String(v);
  delete out.page;
  return out;
}

const SLUG = /^[a-z0-9-]{1,60}$/;

/** Validate untrusted params (deep links) the same way the web validates URLs. */
export function paramsToFilters(params: Record<string, string | string[] | undefined>): Filters {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s != null && s !== "") flat[k] = s;
  }
  const f = parseFilters("vehicles", [], flat) ?? {};
  if (flat.type && VEHICLE_TYPES.some((t) => t.slug === flat.type)) f.type = flat.type;
  if (flat.make && SLUG.test(flat.make)) {
    f.make = flat.make;
    if (flat.model && SLUG.test(flat.model)) f.model = flat.model;
  }
  delete f.page;
  return f;
}

export function filtersToParams(f: Filters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ["type", "make", "model", ...QUERY_KEYS] as (keyof Filters)[]) if (f[k]) out[k] = f[k]!;
  return out;
}

/** Jump to the Search tab showing these filters. */
export function openSearch(f: Filters) {
  searchStore.set(f);
  router.navigate("/search");
}
