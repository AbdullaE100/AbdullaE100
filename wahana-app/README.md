# Wahana for iOS and Android

The Wahana.lk vehicle marketplace as a native app, built with Expo SDK 58 and Expo Router on the same Supabase backend as the website (`../wahana`). Business logic shared with the site (search filters, formatting, offers, leasing maths, database types) is imported from `../wahana/lib` through the `@shared/*` alias, so both stay in step.

## What's in it

- **Home:** search, vehicle types, good deals, popular makes and models, recently viewed and recently added, valuation and leasing tools.
- **Search:** free-text search, quick filters (type, make, model, sort, good price), a full filter screen with a live result count, infinite results with Call / WhatsApp / Chat on every card, saved searches.
- **Ad page:** photo gallery with full-screen viewer, price with fair-price rating and price check against similar ads, leasing estimate, key facts and details, seller card, similar ads, report, share, and a sticky contact bar.
- **Contact:** number reveal with Call and WhatsApp, private chat with quick replies and offers, realtime messages, unread badge on the Chats tab.
- **Sell:** six-step wizard (vehicle, details, photos, price, contact, review) with draft autosave, on-device photo resizing, live price guidance, and sign-in only before photos. Edit, mark as sold, relist and remove from My ads.
- **Account:** sign in or create an account (password, email link, reset), saved ads with price-drop notes, saved searches with new-ad counts, profile and dealer page settings.

Funnel instrumentation and the audit behind the current design are in [docs/FUNNEL_AUDIT.md](docs/FUNNEL_AUDIT.md).

## Run it

```bash
npm install
npx expo start          # press i for iOS, a for Android, w for web
```

Every native module is an Expo SDK package, so Expo Go should run it for quick checks. Anything you ship goes through an EAS build (below).

Configuration lives in `.env` (public values only; the publishable key is safe to ship because row-level security protects the data):

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase publishable key |
| `EXPO_PUBLIC_SITE_URL` | Website, for share links, policies and boost checkout |
| `EXPO_PUBLIC_POSTHOG_KEY` | Optional. Sends funnel events to PostHog |
| `EXPO_PUBLIC_POSTHOG_HOST` | Optional. Defaults to `https://eu.i.posthog.com` |

## Check it

```bash
npm run typecheck       # TypeScript
npm run lint            # ESLint with the React Compiler rules
npm run doctor          # expo-doctor
npx expo export --platform ios --platform android   # proves the native bundles build
```

## Build and ship

Builds run on EAS, so no Xcode or Android Studio is needed.

```bash
npx eas-cli@latest login
npx eas-cli@latest init                       # links the project and adds its projectId
npx eas-cli@latest build --profile preview    # installable test builds (APK + internal iOS)
npx eas-cli@latest build --profile production
npx eas-cli@latest submit --platform ios      # App Store Connect
npx eas-cli@latest submit --platform android  # Google Play
```

Bundle identifiers are `lk.wahana.app` on both platforms (`app.json`).

## Before launch

- In Supabase → Authentication → URL configuration, add `wahana://auth/callback` to Redirect URLs so confirmation and sign-in emails open the app.
- Remove or replace the 300 sample ads; buyers can't contact them.
- Push notifications for new messages and saved-search matches need an EAS project, a push token table and a Supabase function; see the audit.
