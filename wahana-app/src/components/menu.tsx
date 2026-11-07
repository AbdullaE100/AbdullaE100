import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { radius, useColors } from "@/lib/theme";

export function MenuGroup({ title, children }: { title?: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.group}>
      {!!title && (
        <Text variant="caption" weight="700" tone="subtle" style={styles.groupTitle}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

export function MenuItem({
  icon,
  label,
  sub,
  value,
  onPress,
  danger,
  first,
}: {
  icon: ReactNode;
  label: string;
  sub?: string;
  value?: string | number;
  onPress: () => void;
  danger?: boolean;
  first?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, sub, value != null && value !== "" ? String(value) : null].filter(Boolean).join(", ")}
      style={({ pressed }) => [styles.item, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }, pressed && { backgroundColor: c.surface2 }]}
    >
      <View style={[styles.icon, { backgroundColor: danger ? c.dangerSoft : c.surface2 }]}>{icon}</View>
      <View style={styles.text}>
        <Text variant="bodyLg" weight="600" tone={danger ? "danger" : "default"}>
          {label}
        </Text>
        {!!sub && (
          <Text variant="small" tone="muted">
            {sub}
          </Text>
        )}
      </View>
      {value != null && value !== "" && (
        <Text variant="body" tone="subtle" numeric>
          {value}
        </Text>
      )}
      {!danger && <ChevronRight size={18} color={c.fgSubtle} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  groupTitle: { paddingHorizontal: 4, letterSpacing: 0.6 },
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 10 },
  icon: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 1 },
});
