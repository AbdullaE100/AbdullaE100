import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useColors } from "@/lib/theme";
import { Text } from "./text";

/** A full-width row that toggles when any part of it is tapped. */
export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text variant="bodyLg" weight="600">
          {label}
        </Text>
        {!!hint && (
          <Text variant="small" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.surface3, true: c.brand }}
        thumbColor="#ffffff"
        ios_backgroundColor={c.surface3}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8 },
  text: { flex: 1, gap: 2 },
});
