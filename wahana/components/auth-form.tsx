"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, MailCheck, ArrowLeft } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Mode = "signin" | "signup" | "magic" | "reset";

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Check them, or use a sign-in link instead.";
  if (m.includes("email not confirmed")) return "Confirm your email first. We sent you a link when you signed up.";
  if (m.includes("already registered")) return "There's already an account with this email. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password")) return message;
  return message || "Something went wrong. Try again.";
}

export function AuthForm({ next = "/", initialMode = "signin", compact }: { next?: string; initialMode?: Mode; compact?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "magic" | "reset">(null);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const db = supabaseBrowser();
    try {
      if (mode === "signin") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(), data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
          return;
        }
        if (data.user && data.user.identities?.length === 0) throw new Error("User already registered");
        setSent("confirm");
      }
      if (mode === "magic") {
        const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        setSent("magic");
      }
      if (mode === "reset") {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account/profile?reset=1")}`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      setError(friendly((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-good-soft text-good">
          <MailCheck className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Check your email</h2>
        <p className="mt-2 text-[15px] text-fg-muted">
          {sent === "confirm" && (
            <>
              We sent a confirmation link to <strong className="text-fg">{email}</strong>. Open it on this device to finish creating your account.
            </>
          )}
          {sent === "magic" && (
            <>
              We sent a sign-in link to <strong className="text-fg">{email}</strong>. It works once and expires in an hour.
            </>
          )}
          {sent === "reset" && (
            <>
              If there&apos;s an account for <strong className="text-fg">{email}</strong>, you&apos;ll get a link to set a new password.
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-fg-subtle">Nothing yet? Check your spam folder, or wait a minute and try again.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setSent(null)}>
          <ArrowLeft className="size-4" /> Use a different email
        </Button>
      </div>
    );
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "signin", label: "Sign in" },
    { id: "signup", label: "Create account" },
  ];

  return (
    <div>
      {(mode === "signin" || mode === "signup") && (
        <div role="tablist" className="mb-6 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => {
                setMode(t.id);
                setError(null);
              }}
              className={cn("h-10 rounded-lg text-[15px] font-semibold transition", mode === t.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {(mode === "magic" || mode === "reset") && (
        <div className="mb-5">
          <button type="button" onClick={() => setMode("signin")} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
            <ArrowLeft className="size-4" /> Back to sign in
          </button>
          <h2 className="mt-3 text-xl font-bold">{mode === "magic" ? "Get a sign-in link" : "Reset your password"}</h2>
          <p className="mt-1 text-[15px] text-fg-muted">
            {mode === "magic" ? "We'll email you a link that signs you in, no password needed." : "We'll email you a link to choose a new password."}
          </p>
        </div>
      )}

      <form onSubmit={submit} className={cn("space-y-4", compact && "space-y-3")} noValidate>
        {mode === "signup" && (
          <div>
            <Label htmlFor="auth-name">Your name</Label>
            <Input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown to buyers and sellers" maxLength={60} />
          </div>
        )}
        <div>
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leading={<Mail className="size-4" />}
          />
        </div>
        {(mode === "signin" || mode === "signup") && (
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {mode === "signin" && (
                <button type="button" onClick={() => setMode("reset")} className="-my-1 mb-0.5 inline-flex min-h-7 items-center px-1 text-sm font-medium text-brand-text hover:underline">
                  Forgot it?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                type={show ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : ""}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-lg text-fg-subtle hover:bg-surface-2 hover:text-fg"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}
        <FieldError>{error}</FieldError>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={busy}
          disabled={!email || ((mode === "signin" || mode === "signup") && !password) || (mode === "signup" && password.length < 8)}
        >
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "magic" ? "Email me a link" : "Send reset link"}
        </Button>
      </form>

      {(mode === "signin" || mode === "signup") && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setMode("magic")}>
            <Mail className="size-[18px]" /> Email me a sign-in link
          </Button>
          {mode === "signup" && <p className="mt-4 text-center text-xs text-fg-subtle">By creating an account you agree to keep ads honest and chats respectful.</p>}
        </>
      )}
    </div>
  );
}
