# Wahana.lk

A vehicle marketplace for Sri Lanka: buy, sell and price cars, SUVs, vans, bikes, three-wheelers, lorries and more. It's a mobile-first web app built on the existing Supabase backend (project `projectX`, ref `foscdnhzmpuvtydqvkmz`).

## What's in it

**Buyers**
- Home page with a quick search (type, make, model, district, budget), good-deal and newest rails, popular models and districts.
- Browse pages with search-friendly URLs (`/cars/toyota/aqua?district=colombo`), live facet counts, sort options and a removable chip for each active filter. On phones the filters open in a full-screen sheet, and its button shows how many ads match.
- Header search that suggests makes, models and districts as you type (district search also matches Sinhala names).
- Ad page with a swipeable photo gallery and full-screen viewer, key specs, and a **price check** chart showing where the price sits among similar live ads. It also has price history, a leasing estimate, safety tips and similar vehicles.
- A tap reveals the seller's number, with Call and WhatsApp buttons. In-app chat comes with quick replies, live updates, unread badges and read receipts.
- Saved ads (they work signed out and sync when you sign in), plus saved searches showing what's new since your last visit.
- **Compare** up to three vehicles side by side (`/compare?ids=…`), with the best value in each row highlighted and a feature-by-feature matrix.
- **Make an offer**: buyers can attach an offer to their first message or send one from the chat. Offers show as cards with how far they are from the asking price.
- **Recently viewed** ads on the home and ad pages, **price drops** on saved ads ("Rs 200K cheaper since you saved it"), and a "More from this seller" rail.
- **Share previews**: links pasted into WhatsApp or Facebook show the photo, price and price rating (`/og/ad/[id]`), plus a one-tap "Share on WhatsApp" button.
- Tools: "What's my vehicle worth?", a leasing calculator, a dealer directory and a safety guide.

**Sellers**
- A six-step posting wizard with an autosaved draft, inline validation and a live preview card.
- Photos are resized to WebP on the phone before upload. Sellers can drag to reorder and pick the cover.
- A market guide on the price step, e.g. "At Rs 8.9M buyers will see this as a Fair price".
- My ads: views, number reveals and chats per ad, plus edit, mark as sold, relist, remove and boost.
- Dealer accounts get a public dealer page with their stock.
- Boosts (bump, top ad, urgent) paid through PayHere.

**Staff**
- `/admin` moderation queue: ads with 3 or more reports are hidden automatically and can be restored or removed here.

Light and dark themes follow the device, and the whole site passes automated WCAG 2.1 AA checks (axe-core) on phone and desktop, in both themes. Loading skeletons keep slow connections feeling responsive. The app works in any modern browser and can be installed as a PWA.

## Stack

- Next.js 16 (App Router, Turbopack) with React 19 and TypeScript
- Tailwind CSS 4 with design tokens in `app/globals.css`
- Supabase: Postgres RPCs, Auth, Storage and Realtime, via `@supabase/ssr` with cookie sessions
- PayHere checkout through two Supabase Edge Functions (Deno)

The frontend only uses what the database already exposes: the `search_listings`, `search_facets`, `listing_card`, `price_spread`, `similar_listings`, `reveal_contact`, `start_conversation` and `create_promotion` RPCs, and the RLS-protected tables. No schema changes were needed.

## Run it

```bash
cd wahana
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

`.env` holds only public values: the project URL and the publishable key, which is designed to ship to browsers. Row-level security protects the data. For production, set `NEXT_PUBLIC_SITE_URL` to your real domain.

## Before launch

- Set `NEXT_PUBLIC_SUPPORT_EMAIL` (and optionally `NEXT_PUBLIC_OPERATOR`, your registered business name) in `.env` or your host. They appear on the About, Terms, Privacy and Refund pages, which PayHere checks during merchant approval.
- Have a lawyer review `/terms`, `/privacy` and `/refunds`. They're written in plain language for this marketplace but aren't legal advice.

## Supabase settings to change before launch

1. **Auth → URL Configuration**
   - Site URL: `https://your-domain`
   - Redirect URLs: `https://your-domain/auth/callback` and `http://localhost:3000/auth/callback`

   Confirmation, magic-link and password-reset emails land on `/auth/callback`.
2. **Auth → SMTP.** Set up a custom SMTP provider (Resend, Amazon SES, Postmark and so on). The built-in email service only delivers to members of your Supabase team and is heavily rate-limited, so real users won't get their confirmation emails without this.
3. **Listing expiry.** `public.expire_listings()` is service-role only. If it isn't scheduled yet, schedule it with pg_cron:
   ```sql
   select cron.schedule('expire-listings', '15 * * * *', $$select public.expire_listings()$$);
   ```
4. **Moderators.** Add one with `insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');`

## Payments (PayHere)

The boost page calls `payhere-checkout`. That function creates the promotion as the signed-in seller, so ownership and price are checked by the `create_promotion` RPC, and returns a signed checkout form. PayHere then calls `payhere-notify`, which verifies `md5sig` and the amount before running `apply_promotion` with the service role.

```bash
supabase secrets set --project-ref foscdnhzmpuvtydqvkmz \
  PAYHERE_MERCHANT_ID=xxxx PAYHERE_MERCHANT_SECRET=xxxx PAYHERE_SANDBOX=true SITE_URL=https://your-domain
supabase functions deploy payhere-checkout --project-ref foscdnhzmpuvtydqvkmz
supabase functions deploy payhere-notify   --project-ref foscdnhzmpuvtydqvkmz --no-verify-jwt
```

Also add your domain in the PayHere merchant portal. Until the functions are deployed, the boost page shows a friendly "coming soon" message and charges nothing.

## Code map

```
app/
  page.tsx                     home
  [type]/[[...slug]]/          browse: /cars, /cars/toyota, /cars/toyota/aqua, /vehicles?q=
  ad/[id]/[[...slug]]/         ad page (redirects to its canonical slug)
  sell/, sell/[id]/            posting wizard (create and edit)
  messages/, messages/[id]/    inbox and realtime chat
  account/                     my ads, saved, saved searches, profile, promote/[id]
  dealers/, value/, leasing/, safety/, admin/
  compare/                     side-by-side comparison
  about/, terms/, privacy/, refunds/
  og/ad/[id]/                  social share image for an ad
  auth/callback, auth/signout  email links and sign-out
  api/catalog, api/cities      cached reference data for client components
  sitemap.ts, robots.ts, manifest.ts
components/
  ui/                          buttons, fields, combobox, dialog/sheet, toast, chips
  browse/                      URL-driven filters, toolbar, results grid, pagination
  listing/                     gallery, price check, contact and chat, owner actions
  sell/                        wizard, photo uploader, draft model and validation
lib/
  search.ts                    filter <-> URL <-> RPC mapping
  queries.ts, ref.ts           server data access (reference data cached for 10 min)
  supabase/                    server and browser clients
  photos.ts                    on-device resize and upload
supabase/functions/            payhere-checkout, payhere-notify
proxy.ts                       refreshes the auth session cookie (Next 16's renamed middleware)
```

## Deploying

Vercel works out of the box: set the root directory to `wahana`, add the three `NEXT_PUBLIC_*` variables, and deploy. Any Node host that can run `next start` works too.
