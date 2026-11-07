import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, MessageCircle, Heart, Tag, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const NOTICES: Record<string, { tone: "good" | "bad"; text: string }> = {
  confirmed: { tone: "good", text: "Your email is confirmed. Sign in to continue." },
  other_browser: {
    tone: "bad",
    text: "That link has to be opened in the browser you used to sign up or request it. If you just signed up, your email is confirmed now: sign in below, or ask for a new sign-in link.",
  },
  reset_other_browser: { tone: "bad", text: "Password reset links only work in the browser you requested them from. Ask for a new one below." },
  link_expired: { tone: "bad", text: "That link has expired or was already used. Ask for a new one below." },
};

const REASONS: Record<string, string> = {
  chat: "Sign in to message the seller",
  sell: "Sign in to post your ad",
  save: "Sign in to keep your saved ads",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getUser()) redirect(next);
  const heading = REASONS[sp.reason ?? ""] ?? `Welcome to ${site.name}`;
  // Only fixed messages: never echo text from the URL.
  const notice = sp.confirmed ? NOTICES.confirmed : sp.error ? NOTICES[sp.error] ?? NOTICES.link_expired : null;

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-start gap-10 py-8 sm:py-14 lg:grid-cols-2 lg:items-center">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold">{heading}</h1>
        <p className="mb-6 mt-2 text-fg-muted">One account for buying and selling. It&apos;s free.</p>
        {notice && (
          <p className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${notice.tone === "good" ? "border-good/30 bg-good-soft" : "border-danger/30 bg-danger-soft text-danger"}`}>
            {notice.tone === "good" && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />}
            {notice.text}
          </p>
        )}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <AuthForm next={next} initialMode={sp.mode === "signup" ? "signup" : "signin"} />
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <h2 className="text-xl font-bold">With an account you can</h2>
          <ul className="mt-5 space-y-4">
            {[
              { icon: Tag, t: "Post ads for free", d: "Up to 10 live ads for private sellers, more for dealers." },
              { icon: MessageCircle, t: "Chat with buyers and sellers", d: "Your number stays private until you share it." },
              { icon: Heart, t: "Save ads and searches", d: "Pick up where you left off on any device." },
              { icon: ShieldCheck, t: "Report suspicious ads", d: "Ads with several reports are hidden for review." },
            ].map(({ icon: I, t, d }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <I className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-[15px] text-fg-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
