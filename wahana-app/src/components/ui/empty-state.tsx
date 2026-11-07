import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { radius, useColors } from "@/lib/theme";
import { Text } from "./text";

export function EmptyState({ icon, title, body, children }: { icon: ReactNode; title: string; body?: string; children?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: c.brandSoft }]}>{icon}</View>
      <Text variant="h3" style={styles.center} accessibilityRole="header">
        {title}
      </Text>
      {!!body && (
        <Text variant="body" tone="muted" style={[styles.center, styles.body]}>
          {body}
        </Text>
      )}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 28, paddingVertical: 48, gap: 8 },
  icon: { width: 64, height: 64, borderRadius: radius.xxl, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  center: { textAlign: "center" },
  body: { maxWidth: 340 },
  actions: { marginTop: 16, gap: 10, alignSelf: "stretch", alignItems: "center" },
});
