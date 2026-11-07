import { Check } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { useColors } from "@/lib/theme";
import { Text } from "./text";

export function Chip({ label, selected, count, onPress, check }: { label: string; selected?: boolean; count?: number; onPress?: () => void; check?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: selected ? c.brand : c.border, backgroundColor: selected ? c.brandSoft : pressed ? c.surface2 : c.surface },
      ]}
    >
      {selected && check && <Check size={14} color={c.brandSoftFg} strokeWidth={3} />}
      <Text variant="small" weight="700" style={{ color: selected ? c.brandSoftFg : c.fg }}>
        {label}
      </Text>
      {count != null && (
        <Text variant="caption" tone={selected ? "default" : "subtle"} style={selected ? { color: c.brandSoftFg } : undefined}>
          {count}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
});
