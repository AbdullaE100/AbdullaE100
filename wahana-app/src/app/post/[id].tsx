import { Redirect, router, useLocalSearchParams } from "expo-router";
import { FileX } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useEditDraft, useSellerDefaults } from "@/components/sell/loaders";
import { SellWizard } from "@/components/sell/wizard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

export default function EditScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Number(id);
  const { ready, userId } = useSession();
  const defaults = useSellerDefaults(userId);
  const q = useEditDraft(userId, listingId);
  if (ready && !userId) return <Redirect href={{ pathname: "/signin", params: { next: `/post/${id}` } }} />;
  if (q.isLoading || !defaults.data || !userId) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }
  if (!q.data || q.data.status === "removed" || q.data.status === "rejected") {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <EmptyState
          icon={<FileX size={30} color={c.brandSoftFg} />}
          title="This ad can't be edited"
          body={
            !q.data
              ? "It isn't one of your ads, or it no longer exists."
              : `It was ${q.data.status === "removed" ? "removed" : "taken down by a moderator"}. You can post a new ad instead.`
          }
        >
          <Button title="Post a new ad" onPress={() => router.replace("/post")} />
          <Button title="Go back" variant="ghost" onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }
  return <SellWizard mode="edit" listingId={listingId} userId={userId} initial={q.data.draft} defaults={defaults.data} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center" } });
