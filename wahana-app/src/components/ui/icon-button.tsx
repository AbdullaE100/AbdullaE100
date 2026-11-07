import type { ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/lib/theme";

export function IconButton({
  icon,
  label,
  onPress,
  style,
  tone = "plain",
  size = 44,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: "plain" | "overlay" | "outline";
  size?: number;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        tone === "overlay" && { backgroundColor: pressed ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" },
        tone === "outline" && { borderWidth: 1, borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface },
        tone === "plain" && pressed && { backgroundColor: c.surface2 },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { alignItems: "center", justifyContent: "center" } });
