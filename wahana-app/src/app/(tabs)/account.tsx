import Constants from "expo-constants";
import { router } from "expo-router";
import {
  BadgeCheck,
  Bookmark,
  Calculator,
  CarFront,
  FileText,
  Gauge,
  Heart,
  Info,
  LogOut,
  MessagesSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuGroup, MenuItem } from "@/components/menu";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useMyAds } from "@/lib/api";
import { openWeb } from "@/lib/links";
import { radius, useColors } from "@/lib/theme";
import { useFavourites } from "@/providers/favourites";
import { useInbox } from "@/providers/inbox";
import { displayName, useSession } from "@/providers/session";

export default function AccountScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { userId, email, profile, signOut } = useSession();
  const { ids } = useFavourites();
  const { unread } = useInbox();
  const ads = useMyAds(userId ?? undefined);
  const live = ads.data?.filter((a) => a.status === "active").length ?? 0;
  const name = displayName(profile, email);
  const isDealer = profile?.account_type === "dealer";
  const ic = (I: typeof Heart) => <I size={20} color={c.fg} />;

  const confirmSignOut = () => {
    const go = () => signOut();
    if (Platform.OS === "web") return go();
    Alert.alert("Sign out?", "Saved ads stay in your account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: go },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      <View style={{ height: insets.top, backgroundColor: c.bg }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 12 }]}>
        <Text variant="h1" accessibilityRole="header">
          Account
        </Text>

        {userId ? (
          <View style={[styles.profile, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.avatar, { backgroundColor: c.brand }]}>
              <Text variant="h2" tone="inverse">
                {name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text variant="h3" numberOfLines={1} style={styles.shrink}>
                  {name}
                </Text>
                {isDealer && <BadgeCheck size={18} color={c.brandText} />}
              </View>
              <Text variant="small" tone="muted" numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.signin, { backgroundColor: c.brandSoft }]}>
            <Text variant="h3" style={{ color: c.brandSoftFg }}>
              Sign in to Wahana
            </Text>
            <Text variant="body" style={{ color: c.brandSoftFg }}>
              Chat with sellers, keep saved ads on every device, save searches and post ads for free.
            </Text>
            <View style={styles.row}>
              <Button title="Sign in" style={styles.flex} onPress={() => router.push("/signin")} />
              <Button title="Create account" variant="secondary" style={styles.flex} onPress={() => router.push({ pathname: "/signin", params: { mode: "signup" } })} />
            </View>
          </View>
        )}

        {userId && (
          <View style={styles.stats}>
            <Stat value={live} label="Live ads" onPress={() => router.push("/my-ads")} />
            <Stat value={ids.length} label="Saved" onPress={() => router.push("/saved")} />
            <Stat value={unread} label="Unread chats" onPress={() => router.navigate("/chats")} highlight={unread > 0} />
          </View>
        )}

        {userId ? (
          <MenuGroup title="Selling">
            <MenuItem first icon={ic(CarFront)} label="My ads" sub="Edit, mark as sold, boost" value={ads.data?.length || ""} onPress={() => router.push("/my-ads")} />
            <MenuItem icon={ic(MessagesSquare)} label="Messages" value={unread || ""} onPress={() => router.navigate("/chats")} />
          </MenuGroup>
        ) : null}

        <MenuGroup title="Buying">
          <MenuItem first icon={ic(Heart)} label="Saved ads" value={ids.length || ""} onPress={() => router.push("/saved")} />
          <MenuItem icon={ic(Bookmark)} label="Saved searches" sub={userId ? undefined : "Sign in to save searches"} onPress={() => router.push(userId ? "/searches" : { pathname: "/signin", params: { next: "/searches" } })} />
          <MenuItem icon={ic(Gauge)} label="Value my vehicle" onPress={() => router.push("/value")} />
          <MenuItem icon={ic(Calculator)} label="Leasing calculator" onPress={() => router.push("/leasing")} />
        </MenuGroup>

        {userId && (
          <MenuGroup title="Settings">
            <MenuItem first icon={ic(UserRound)} label="Profile and contact details" sub="Name, phone, WhatsApp, dealer page" onPress={() => router.push("/profile")} />
          </MenuGroup>
        )}

        <MenuGroup title="Help">
          <MenuItem first icon={ic(ShieldCheck)} label="Buying and selling safely" onPress={() => openWeb("/safety")} />
          <MenuItem icon={ic(FileText)} label="Terms of use" onPress={() => openWeb("/terms")} />
          <MenuItem icon={ic(FileText)} label="Privacy policy" onPress={() => openWeb("/privacy")} />
          <MenuItem icon={ic(Info)} label="About Wahana" onPress={() => openWeb("/about")} />
        </MenuGroup>

        {userId && (
          <MenuGroup>
            <MenuItem first danger icon={<LogOut size={20} color={c.danger} />} label="Sign out" onPress={confirmSignOut} />
          </MenuGroup>
        )}

        <Text variant="caption" tone="subtle" style={styles.version}>
          Wahana {Constants.expoConfig?.version ?? ""}
        </Text>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, onPress, highlight }: { value: number; label: string; onPress: () => void; highlight?: boolean }) {
  const c = useColors();
  return (
    <Button
      variant="secondary"
      onPress={onPress}
      style={[styles.stat, highlight && { borderColor: c.brand, backgroundColor: c.brandSoft }]}
      icon={
        <View style={styles.statInner}>
          <Text variant="h2" numeric tone={highlight ? "brand" : "default"}>
            {value}
          </Text>
          <Text variant="caption" tone="muted">
            {label}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.xxl, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  signin: { padding: 18, borderRadius: radius.xxl, gap: 10 },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, height: 76, borderRadius: radius.xl },
  statInner: { alignItems: "center" },
  version: { textAlign: "center" },
});
