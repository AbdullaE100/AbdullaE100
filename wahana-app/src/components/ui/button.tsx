import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { radius, useColors, type Colors } from "@/lib/theme";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "outline" | "accent";
type Size = "sm" | "md" | "lg";

function palette(c: Colors, v: Variant) {
  switch (v) {
    case "primary":
      return { bg: c.brand, pressed: c.brandPressed, fg: c.brandFg, border: c.brand };
    case "secondary":
      return { bg: c.surface, pressed: c.surface2, fg: c.fg, border: c.border };
    case "outline":
      return { bg: c.surface, pressed: c.brandSoft, fg: c.brandText, border: c.brand };
    case "soft":
      return { bg: c.brandSoft, pressed: c.surface3, fg: c.brandSoftFg, border: c.brandSoft };
    case "ghost":
      return { bg: "transparent", pressed: c.surface2, fg: c.fgMuted, border: "transparent" };
    case "danger":
      return { bg: c.dangerSolid, pressed: c.danger, fg: "#ffffff", border: c.dangerSolid };
    case "accent":
      return { bg: c.accent, pressed: c.accent, fg: "#2a1a00", border: c.accent };
  }
}

const H = { sm: 36, md: 44, lg: 52 };

export function Button({
  title,
  icon,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  full,
  compact,
  haptic = true,
  style,
  onPress,
  ...props
}: Omit<PressableProps, "style"> & {
  title?: string;
  icon?: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  /** Tighter padding for rows of three buttons on small phones. */
  compact?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const p = palette(c, variant);
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={(e) => {
        if (haptic && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: H[size],
          paddingHorizontal: size === "sm" ? 12 : 16,
          backgroundColor: pressed ? p.pressed : p.bg,
          borderColor: p.border,
          borderRadius: size === "sm" ? radius.md : radius.lg,
        },
        full && styles.full,
        compact && styles.compact,
        off && styles.off,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon ? <View>{icon}</View> : null}
      {!!title && (
        <Text variant={size === "lg" ? "bodyLg" : size === "sm" ? "small" : "body"} weight="700" style={{ color: p.fg }} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
  full: { alignSelf: "stretch" },
  compact: { paddingHorizontal: 8, gap: 6 },
  off: { opacity: 0.5 },
});
