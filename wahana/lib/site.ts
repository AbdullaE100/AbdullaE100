export const site = {
  name: "Wahana",
  domain: "wahana.lk",
  tagline: "Sri Lanka's vehicle marketplace",
  description:
    "Buy and sell cars, SUVs, vans, bikes and three-wheelers across Sri Lanka. Fair-price ratings on every ad, private chat with sellers, and free listings.",
  // Set NEXT_PUBLIC_SUPPORT_EMAIL before launch; PayHere checks for a working contact.
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@wahana.lk",
  /** Legal entity shown on policy pages, e.g. "Wahana (Pvt) Ltd, PV 00000". Optional. */
  operator: process.env.NEXT_PUBLIC_OPERATOR || "",
  policiesUpdated: "7 November 2026",
};
