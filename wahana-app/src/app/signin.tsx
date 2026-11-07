import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff, MailCheck, MessageCircle, Bookmark, Flag, Heart, CirclePlus, X } from "lucide-react-native";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { track } from "@/lib/analytics";
import { SITE_URL } from "@/lib/env";
import { pendingAction } from "@/lib/pending";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";

type Mode = "signin" | "signup" | "magic" | "reset";

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Check them, or get a sign-in link instead.";
  if (m.includes("email not confirmed")) return "Confirm your email first. We sent you a link when you signed up.";
  if (m.includes("already registered")) return "There's already an account with this email. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("network") || m.includes("fetch")) return "No connection. Check your internet and try again.";
  if (m.includes("password")) return message;
  return message || "Something went wrong. Try again.";
}

const REASONS: Record<string, { icon: typeof Heart; text: string }> = {
  chat: { icon: MessageCircle, text: "Sign in to message the seller. Your number stays private." },
  save_search: { icon: Bookmark, text: "Sign in to save this search and see what's new each time." },
  saved: { icon: Heart, text: "Sign in to keep your saved ads on all your devices." },
  sell: { icon: CirclePlus, text: "Sign in to post your ad. It's free and takes a few minutes." },
  report: { icon: Flag, text: "Sign in to report an ad, so we can follow up if needed." },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignInScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { next, reason, mode: initialMode } = useLocalSearchParams<{ next?: string; reason?: string; mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(initialMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});
  const [sent, setSent] = useState<null | "confirm" | "magic" | "reset">(null);
  const passRef = useRef<ComponentRef<typeof TextInput>>(null);
  const why = reason ? REASONS[reason] : undefined;

  useEffect(() => track("signin_viewed", { reason: reason ?? null }), [reason]);

  const done = () => {
    if (router.canGoBack()) router.back();
    const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
    // Pages that resume on their own (the ad page, search) are already underneath.
    if (target && !target.startsWith("/ad/") && target !== "/search") setTimeout(() => router.push(target as never), 50);
  };

  const submit = async () => {
    setError(null);
    const fe: typeof fieldErr = {};
    if (!EMAIL.test(email.trim())) fe.email = "Enter your email address, e.g. name@gmail.com.";
    if ((mode === "signin" || mode === "signup") && password.length < (mode === "signup" ? 8 : 1)) fe.password = mode === "signup" ? "Use at least 8 characters." : "Enter your password.";
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    setBusy(true);
    const addr = email.trim().toLowerCase();
    const callback = `${SITE_URL}/auth/callback?next=${encodeURIComponent(next && next.startsWith("/") ? next : "/")}`;
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (error) throw error;
        track("signin_succeeded", { reason: reason ?? null });
        return done();
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: addr, password, options: { emailRedirectTo: callback, data: { display_name: name.trim() || undefined } } });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) throw new Error("User already registered");
        track("signup_succeeded", { reason: reason ?? null, confirmed: !!data.session });
        if (data.session) return done();
        setSent("confirm");
      }
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email: addr, options: { emailRedirectTo: callback } });
        if (error) throw error;
        setSent("magic");
      }
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent("/account/profile?reset=1")}` });
        if (error) throw error;
        setSent("reset");
      }
    } catch (e) {
      const msg = friendly((e as Error).message);
      track("signin_failed", { mode, message: (e as Error).message?.slice(0, 80) });
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    pendingAction.clear();
    router.back();
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.headerBtn}>
              <X size={24} color={c.fg} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Logo />
        {sent ? (
          <View style={styles.sent}>
            <View style={[styles.sentIcon, { backgroundColor: c.goodSoft }]}>
              <MailCheck size={30} color={c.good} />
            </View>
            <Text variant="h2" style={styles.center} accessibilityRole="header">
              Check your email
            </Text>
            <Text tone="muted" style={styles.center}>
              {sent === "confirm" && `We sent a confirmation link to ${email.trim()}. Open it, then come back here and sign in.`}
              {sent === "magic" && `We sent a sign-in link to ${email.trim()}. It works once and expires in an hour.`}
              {sent === "reset" && `If there's an account for ${email.trim()}, you'll get a link to choose a new password.`}
            </Text>
            <Text variant="small" tone="subtle" style={styles.center}>
              Nothing yet? Check your spam folder, or wait a minute and try again.
            </Text>
            {sent === "confirm" && (
              <Button
                title="I've confirmed, sign in"
                size="lg"
                full
                onPress={() => {
                  setSent(null);
                  setMode("signin");
                  setTimeout(() => passRef.current?.focus(), 100);
                }}
              />
            )}
            <Button title="Use a different email" variant="ghost" icon={<ArrowLeft size={16} color={c.fgMuted} />} onPress={() => setSent(null)} />
          </View>
        ) : (
          <>
            {why && (
              <View style={[styles.why, { backgroundColor: c.brandSoft }]}>
                <why.icon size={20} color={c.brandSoftFg} />
                <Text variant="body" weight="600" style={[styles.flex, { color: c.brandSoftFg }]}>
                  {why.text}
                </Text>
              </View>
            )}
            {mode === "signin" || mode === "signup" ? (
              <View style={[styles.tabs, { backgroundColor: c.surface2 }]} role="tablist">
                {(["signin", "signup"] as const).map((m) => (
                  <Pressable
                    key={m}
                    role="tab"
                    accessibilityState={{ selected: mode === m }}
                    onPress={() => {
                      setMode(m);
                      setError(null);
                      setFieldErr({});
                    }}
                    style={[styles.tab, mode === m && [{ backgroundColor: c.surface }, styles.tabOn]]}
                  >
                    <Text weight="700" tone={mode === m ? "default" : "muted"}>
                      {m === "signin" ? "Sign in" : "Create account"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.subHead}>
                <Pressable onPress={() => setMode("signin")} accessibilityRole="button" hitSlop={8} style={styles.backLink}>
                  <ArrowLeft size={16} color={c.brandText} />
                  <Text variant="small" weight="700" tone="brand">
                    Back to sign in
                  </Text>
                </Pressable>
                <Text variant="h2" accessibilityRole="header">
                  {mode === "magic" ? "Get a sign-in link" : "Reset your password"}
                </Text>
                <Text tone="muted">{mode === "magic" ? "We'll email you a link that signs you in, no password needed." : "We'll email you a link to choose a new password."}</Text>
              </View>
            )}

            <View style={styles.form}>
              {mode === "signup" && (
                <Input label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Shown to buyers and sellers" maxLength={60} returnKeyType="next" />
              )}
              <Input
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (fieldErr.email) setFieldErr((f) => ({ ...f, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="you@example.com"
                returnKeyType={mode === "signin" || mode === "signup" ? "next" : "go"}
                onSubmitEditing={() => (mode === "signin" || mode === "signup" ? passRef.current?.focus() : submit())}
                error={fieldErr.email}
              />
              {(mode === "signin" || mode === "signup") && (
                <Input
                  ref={passRef}
                  label="Password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (fieldErr.password) setFieldErr((f) => ({ ...f, password: undefined }));
                  }}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  textContentType={mode === "signup" ? "newPassword" : "password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  error={fieldErr.password}
                  right={
                    <Pressable onPress={() => setShow((s) => !s)} accessibilityRole="button" accessibilityLabel={show ? "Hide password" : "Show password"} hitSlop={10}>
                      {show ? <EyeOff size={20} color={c.fgMuted} /> : <Eye size={20} color={c.fgMuted} />}
                    </Pressable>
                  }
                />
              )}
              {!!error && (
                <View style={[styles.error, { backgroundColor: c.dangerSoft }]} role="alert">
                  <Text variant="body" style={{ color: c.danger }}>
                    {error}
                  </Text>
                </View>
              )}
              <Button
                title={mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "magic" ? "Email me a link" : "Send reset link"}
                size="lg"
                full
                loading={busy}
                onPress={submit}
              />
              {mode === "signin" && (
                <View style={styles.links}>
                  <Pressable onPress={() => setMode("magic")} accessibilityRole="button" hitSlop={6} style={styles.link}>
                    <Text variant="body" weight="700" tone="brand">
                      Email me a sign-in link
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setMode("reset")} accessibilityRole="button" hitSlop={6} style={styles.link}>
                    <Text variant="body" weight="600" tone="muted">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
              )}
              {mode === "signup" && (
                <Text variant="small" tone="subtle" style={styles.center}>
                  By creating an account you agree to Wahana's terms and privacy policy.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 18, width: "100%", maxWidth: 480, alignSelf: "center" },
  headerBtn: { minHeight: 40, minWidth: 40, justifyContent: "center" },
  why: { flexDirection: "row", gap: 10, alignItems: "center", padding: 14, borderRadius: radius.xl },
  flex: { flex: 1 },
  tabs: { flexDirection: "row", padding: 4, borderRadius: radius.xl },
  tab: { flex: 1, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.lg },
  tabOn: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  subHead: { gap: 8 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
  form: { gap: 16 },
  error: { padding: 12, borderRadius: radius.lg },
  links: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  link: { minHeight: 40, justifyContent: "center" },
  sent: { alignItems: "center", gap: 12, paddingTop: 24 },
  sentIcon: { width: 64, height: 64, borderRadius: radius.xxl, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
});
