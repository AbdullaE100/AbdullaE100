import { formatLKR } from "@shared/format";
import { parseOffer } from "@shared/offer";

/** One-line preview of a chat message, with offers shown as amounts. */
export function previewText(body: string | null, mine: boolean) {
  if (!body) return "";
  const offer = parseOffer(body);
  const text = offer ? `Offer: ${formatLKR(offer.amount)}` : body.replace(/\s+/g, " ");
  return mine ? `You: ${text}` : text;
}
