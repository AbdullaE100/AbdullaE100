import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

/**
 * Tiny persisted store: synchronous reads from memory, writes go to
 * AsyncStorage in the background. Used for small per-device lists.
 */
export function persisted<T>(key: string, initial: T, validate: (v: unknown) => T = (v) => v as T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const ready = AsyncStorage.getItem(key)
    .then((raw) => {
      if (raw != null) value = validate(JSON.parse(raw));
    })
    .catch(() => {})
    .finally(() => {
      loaded = true;
      emit();
    });

  return {
    ready,
    get: () => value,
    isLoaded: () => loaded,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      emit();
      AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    use(): T {
      return useSyncExternalStore(this.subscribe, this.get, this.get);
    },
    useLoaded(): boolean {
      return useSyncExternalStore(this.subscribe, () => loaded, () => loaded);
    },
  };
}

const ints = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => Number.isInteger(x)) : []);

/** Recently viewed ad ids, newest first. */
export const recentStore = persisted<number[]>("wahana:recent", [], ints);
export function recordRecent(id: number) {
  recentStore.set((ids) => [id, ...ids.filter((x) => x !== id)].slice(0, 24));
}

/** Ads saved before signing in. */
export const localSavedStore = persisted<number[]>("wahana:saved", [], ints);

/** Recent free-text searches for the search screen. */
export const recentQueriesStore = persisted<string[]>("wahana:queries", [], (v) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 8) : []));
export function recordQuery(q: string) {
  const t = q.trim();
  if (!t) return;
  recentQueriesStore.set((list) => [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8));
}
