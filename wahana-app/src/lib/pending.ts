// An action someone started while signed out ("Chat", "Save search"), to
// finish automatically once they've signed in instead of making them redo it.
export type Pending =
  | { kind: "chat"; listingId: number; title: string; price?: number; sellerName: string; source: string }
  | { kind: "save_search" }
  | null;

let pending: Pending = null;
let at = 0;

export const pendingAction = {
  set(p: Pending) {
    pending = p;
    at = Date.now();
  },
  /** Returns and clears the action if it matches and is less than 15 minutes old. */
  take<K extends NonNullable<Pending>["kind"]>(kind: K): Extract<NonNullable<Pending>, { kind: K }> | null {
    if (!pending || pending.kind !== kind || Date.now() - at > 15 * 60_000) return null;
    const p = pending as Extract<NonNullable<Pending>, { kind: K }>;
    pending = null;
    return p;
  },
  clear() {
    pending = null;
  },
};
