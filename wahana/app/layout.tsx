import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers, type Session } from "./providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { CompareTray } from "@/components/compare";
import { createClient, getUser } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name}: buy and sell vehicles in Sri Lanka`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_LK" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12151b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function loadSession(): Promise<Session> {
  const user = await getUser();
  if (!user) return null;
  const db = await createClient();
  const [{ data: profile }, { data: staff }] = await Promise.all([
    db.from("profiles").select("display_name, dealer_name, account_type").eq("id", user.id).maybeSingle(),
    db.rpc("is_staff"),
  ]);
  const name = (profile?.account_type === "dealer" && profile.dealer_name) || profile?.display_name || null;
  return { userId: user.id, name, email: user.email ?? null, isStaff: !!staff };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  return (
    <html lang="en-LK">
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-[100] rounded-lg bg-brand px-4 py-2 font-semibold text-brand-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Skip to content
        </a>
        <Providers session={session}>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <CompareTray />
        </Providers>
      </body>
    </html>
  );
}
