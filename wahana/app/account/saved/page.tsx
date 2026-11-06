import type { Metadata } from "next";
import { SavedAds } from "./saved-ads";

export const metadata: Metadata = { title: "Saved ads", robots: { index: false } };

export default function SavedPage() {
  return <SavedAds />;
}
