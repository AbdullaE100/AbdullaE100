// Funnel instrumentation. Events are typed so funnels stay consistent across
// screens; the sink is pluggable. Set EXPO_PUBLIC_POSTHOG_KEY to send them to
// PostHog's capture API; otherwise they are only logged in development.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type FunnelEvent =
  // Discovery → contact
  | "app_open"
  | "search_submitted"
  | "results_viewed"
  | "filter_applied"
  | "ad_viewed"
  | "contact_opened"
  | "phone_revealed"
  | "call_tapped"
  | "whatsapp_tapped"
  | "chat_started"
  // Account
  | "signin_viewed"
  | "signin_succeeded"
  | "signup_succeeded"
  | "signin_failed"
  // Selling
  | "sell_started"
  | "sell_step_completed"
  | "sell_photo_added"
  | "sell_published"
  | "sell_failed"
  // Retention
  | "ad_saved"
  | "search_saved"
  | "message_sent"
  | "offer_sent";

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
let distinctId: string | null = null;
let userId: string | null = null;
const listeners = new Set<(e: { event: FunnelEvent; props: Record<string, unknown>; at: number }) => void>();

async function getDistinctId() {
  if (distinctId) return distinctId;
  try {
    distinctId = (await AsyncStorage.getItem("wahana:anon-id")) ?? `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem("wahana:anon-id", distinctId);
  } catch {
    distinctId = "anon";
  }
  return distinctId;
}

export function identify(id: string | null) {
  userId = id;
}

/** Subscribe to events (used by the in-app debug view and tests). */
export function onTrack(fn: (e: { event: FunnelEvent; props: Record<string, unknown>; at: number }) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function track(event: FunnelEvent, props: Record<string, unknown> = {}) {
  const payload = { event, props: { ...props, platform: Platform.OS }, at: Date.now() };
  listeners.forEach((l) => l(payload));
  if (__DEV__) console.log(`[track] ${event}`, props);
  if (!KEY) return;
  getDistinctId().then((anon) =>
    fetch(`${HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: KEY, event, distinct_id: userId ?? anon, properties: payload.props, timestamp: new Date(payload.at).toISOString() }),
    }).catch(() => {}),
  );
}
