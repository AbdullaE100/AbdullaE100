import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSellerDefaults } from "@/components/sell/loaders";
import { SellWizard } from "@/components/sell/wizard";
import { useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

export default function PostScreen() {
  const c = useColors();
  const { ready, userId } = useSession();
  const defaults = useSellerDefaults(userId);
  if (ready && !userId) return <Redirect href={{ pathname: "/signin", params: { reason: "sell", next: "/post" } }} />;
  if (!userId || !defaults.data) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }
  return <SellWizard mode="create" userId={userId} defaults={defaults.data} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center" } });
