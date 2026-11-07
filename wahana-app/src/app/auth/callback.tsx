import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { completeAuthFromUrl } from "@/lib/auth-links";
import { useColors } from "@/lib/theme";

/** Landing route for email links opened on the phone (wahana://auth/callback). */
export default function AuthCallback() {
  const c = useColors();
  const url = Linking.useLinkingURL();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!url || done.current) return;
    done.current = true;
    completeAuthFromUrl(url).then((r) => {
      if (!r.ok) return setError(r.message);
      track("signin_succeeded", { reason: "email_link" });
      toast({ tone: "success", title: "You're signed in" });
      router.replace(r.next as never);
    });
  }, [url, toast]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: "Signing in", headerShown: !!error }} />
      {error ? (
        <EmptyState icon={<CircleAlert size={30} color={c.brandSoftFg} />} title="That link didn't work" body={error}>
          <Button title="Sign in" onPress={() => router.replace("/signin")} />
        </EmptyState>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={c.brand} />
          <Text tone="muted">Signing you in…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: "center" }, center: { alignItems: "center", gap: 12 } });
