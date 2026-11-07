import { router } from "expo-router";
import { MapPinOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/lib/theme";

export default function NotFound() {
  const c = useColors();
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <EmptyState icon={<MapPinOff size={30} color={c.brandSoftFg} />} title="This page doesn't exist" body="The link may be old, or the ad may have been removed.">
        <Button title="Go to home" onPress={() => router.replace("/")} />
      </EmptyState>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: "center" } });
