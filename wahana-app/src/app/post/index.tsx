import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSellerDefaults } from "@/components/sell/loaders";
import { SellWizard } from "@/components/sell/wizard";
import { useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

export default function PostScreen() {
  const c = useColors();
  const { ready, userId } = useSession();
  const defaults = useSellerDefaults(userId);
  // Anyone can start an ad; the wizard asks them to sign in before photos.
  // Stay mounted through sign-in so nothing typed so far is lost.
  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }
  return <SellWizard mode="create" userId={userId} defaults={defaults.data ?? ANON} />;
}

const ANON = { phone: "", whatsapp: "", name: "", hasSaved: false };

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center" } });
