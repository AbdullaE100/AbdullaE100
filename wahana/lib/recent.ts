"use client";
const KEY = "wahana:recent";
const MAX = 24;

export function readRecent(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

export function recordRecent(id: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, MAX)));
  } catch {}
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
