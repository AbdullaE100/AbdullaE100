# Wahana app: funnel audit

Audit of the iOS/Android app (Expo SDK 58) against the five journeys that matter for a vehicle marketplace. Each funnel was instrumented with typed events, driven end to end with scripted runs against the live Supabase backend (phone-sized web build, the same React Native code), and reviewed screen by screen. Findings are ranked by how much of the funnel they lose.

There are no real users yet, so the drop-off points below come from measured friction (taps, screens, waits, walls, dead ends), not from analytics. The same events are wired up for production, so real drop-off can be read straight from PostHog once the key is set (see [Measuring it for real](#measuring-it-for-real)).

## Method

- **Instrumentation.** `src/lib/analytics.ts` defines every funnel event as a typed union and sends them to PostHog when `EXPO_PUBLIC_POSTHOG_KEY` is set. On web builds the stream is also exposed on `globalThis.__wahanaEvents`, which the test scripts read.
- **Scripted journeys.** Playwright drove a phone-sized (iPhone 13 and iPhone SE) build through each funnel with two real test accounts: posting an ad with photos, finding it as a buyer, revealing the number, starting a chat with an offer, the seller replying live, editing, removing, filters, saved searches and profile.
- **Severe UI pass.** axe-core (WCAG 2.2 AA) on every screen in light and dark mode at 375 and 430 px, plus checks for touch targets, tiny text and horizontal overflow; visual review on phone, small phone and tablet.
- **Build checks.** `tsc`, `expo lint` (React Compiler rules), `expo-doctor` (20/20), and `expo export` for iOS and Android Hermes bundles.

## The funnels

| # | Funnel | Steps (events) | Measured |
|---|--------|----------------|----------|
| 1 | Discover → contact | `app_open` → `search_submitted` → `results_viewed` → `ad_viewed` → `contact_opened` → `phone_revealed` → `call_tapped` / `whatsapp_tapped` | 4 taps from Home to dialling; no sign-in needed |
| 2 | Discover → chat | … `ad_viewed` → `contact_opened(method=chat)` → `signin_viewed` → `signin_succeeded` → `chat_started` → `message_sent` | 13 s scripted, including sign-in; chat resumes by itself after sign-in |
| 3 | Sell | `sell_started` → `sell_step_completed` ×5 → `sell_photo_added` → `sell_published` | ~20 taps over 6 steps; 15 s scripted; sign-in only before photos |
| 4 | Account | `signin_viewed` → `signin_succeeded` / `signup_succeeded` (or `signin_failed`) | email + password, magic link or reset; email links open the app |
| 5 | Return | `ad_saved`, `search_saved`, saved-search "new" counts, recently viewed on Home | 1 tap to save an ad or a search |

## Findings, worst first

Status: **Fixed** (in this change), **Open** (needs a decision or access outside the code).

### P0: blocks the funnel

1. **Every live ad is a sample ad, so funnels 1 and 2 cannot complete.** All 300 listings are seeded demos with no seller contact. Tapping Call told buyers "this seller hasn't shared a phone number", which reads as an evasive seller. **Fixed** in the app: sample ads carry a "Sample ad" label, and Call/WhatsApp/Chat explain that it's a sample and route to real ads instead of a dead end or a sign-in wall. **Open:** remove the sample ads (or seed real dealer stock) before launch; until then the contact funnel converts at 0% by construction.
2. **Selling started with a sign-in wall.** New sellers had to create an account and confirm their email before seeing a single question, the classic first-screen drop. **Fixed:** the wizard opens for anyone; sign-in is asked for only when they reach photos (after they've invested in the vehicle details), every answer is kept through sign-in, they land back on the photos step, and their saved phone/WhatsApp/name are filled in.
3. **Email links stranded people on the website.** Confirming a new account, magic-link sign-in and password reset all opened wahana.lk in a browser, leaving the person signed out in the app with no way back except retyping their password. **Fixed:** the app sends `wahana://auth/callback` as the redirect and finishes sign-in itself (`src/app/auth/callback.tsx`). **Open:** add `wahana://auth/callback` under Supabase → Authentication → URL configuration → Redirect URLs; until then Supabase falls back to the website, exactly as before.

### P1: loses a meaningful share

- **Posting limits surfaced only at the last step.** The database allows 10 new ads per 24 hours (everyone) and 10 live ads (private sellers), but a seller found out only when Publish failed, after six steps. **Fixed:** the wizard checks both rules when it opens and on the review step, says exactly when they can publish again (or links to My ads to mark one sold), and keeps the draft.

4. **Chat needs an account.** Unavoidable (messages need an identity), so the wall was made cheap: Call and WhatsApp work signed out; the sign-in screen says why ("Sign in to message the seller. Your number stays private."); and after signing in the message sheet reopens on the same ad with the text ready. Measured: the whole chat journey, sign-in included, is 13 s scripted. **Fixed.** Worth adding later: Sign in with Apple/Google to remove password typing.
5. **Truncated primary CTA.** "WhatsApp" rendered as "WhatsA…" on the ad page's sticky bar and on result cards at 375–390 px wide, the most common Sri Lankan Android widths. **Fixed** with weighted button widths.
6. **Mistyped prices were rewarded.** Entering Rs 5,450,000 for a car whose similar ads sit at a Rs 9.38M median earned a green "Good price" tag. A missing digit becomes a too-good-to-be-true ad buyers distrust. **Fixed:** the price step warns at 30% below or 50% above similar ads and offers "Use the median".
7. **No push notifications.** Sellers only see new chats when they open the app, and saved searches can't alert. In marketplaces this is the single biggest lever on reply rate and return visits. **Open:** needs an EAS project (`eas init`) for Expo push tokens, a `push_tokens` table, and a Supabase function triggered on new messages/listings. The UI, unread badge and realtime are already in place.

### P2: friction and polish

8. **Offline Home looked broken** (skeleton bar forever, empty "Good deals"/"Recently added" headers). **Fixed:** a "Can't reach Wahana" banner with Retry; failed sections are hidden.
9. **Stale toast over sign-in.** A "Saved on this phone · Sign in" toast stayed over the sign-in screen; tapping it opened a second sign-in. **Fixed:** sign-in clears toasts.
10. **iOS top inset doubled on tab screens** (manual safe-area padding plus iOS's automatic scroll inset). **Fixed** with a fixed status-bar spacer, matching Home.
11. **Duplicate-save noise.** Syncing saved ads after sign-in produced HTTP 409s. **Fixed** with idempotent upserts.
12. **Accessibility** (axe, light + dark, 375 + 430 px): tab bar roles, labels that didn't contain their visible text, switches nested inside tappable rows, an unlabelled stepper, one low-contrast caption, and 36 px heart buttons. **Fixed;** the only remaining items are a deliberate concise label on result cards and web-only header/back button sizes that don't exist on native.
13. **Wide screens.** On tablets, lists and Home stretched edge to edge and "Three-wheelers" truncated on its tile. **Fixed** with max content widths and auto-sized tiles.

### Found in code review (all fixed)

- A draft started while signed out could be deleted when the same person later opened Sell signed in; it's now picked up and moved to their account.
- A brand-new vehicle could publish mileage typed before the condition was changed.
- A heart tap or ad view in the first moments after launch could be lost while saved data was still loading.
- A retry on a failed photo upload stopped working after leaving the photos step and coming back.
- A previous account's staff flag could briefly apply to the next account on the same phone.
- A failed message load showed an empty chat and marked it read; it now shows an error.
- Saving contact details could fail silently after publishing or saving the profile.
- A re-render during a number reveal could cancel it and send a second reveal, using up the rate limit.
- Catching up on missed messages before the first load could put old messages at the bottom of the chat.
- Saving an edit stacked a second copy of the ad page; it now returns to where the edit started.

### Decisions for the business

- **Boost payments.** Promotion checkout stays on the website (PayHere). Apple and Google may treat in-app boosts of a listing as digital goods; keeping payment on the web avoids that review risk, at the cost of one hand-off. Revisit once PayHere keys are live.
- **Sample ads.** See finding 1.

## Measuring it for real

1. Create a PostHog project and set `EXPO_PUBLIC_POSTHOG_KEY` (and `EXPO_PUBLIC_POSTHOG_HOST` if not EU) in EAS environment variables.
2. Build these funnels in PostHog (ordered, 1-day window unless noted):
   - **Contact:** `ad_viewed` → `contact_opened` → `phone_revealed` → `call_tapped` or `whatsapp_tapped`.
   - **Chat:** `contact_opened (method = chat)` → `signin_succeeded` (optional) → `chat_started` → `message_sent`.
   - **Sell (7 days):** `sell_started` → `sell_step_completed (step = vehicle)` → `details` → `photos` → `price` → `contact` → `sell_published`. Break down by `signed_in` to see the sign-in step's cost.
   - **Search quality:** `search_submitted` → `results_viewed (total > 0)` → `ad_viewed`.
   - **Account:** `signin_viewed` → `signin_succeeded`; chart `signin_failed` by `message`.
3. Watch `contact_opened (demo = true)`: every one is a buyer who wanted a real seller.
