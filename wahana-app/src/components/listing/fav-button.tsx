import * as Haptics from "expo-haptics";
import { Heart } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useFavourites } from "@/providers/favourites";
import { cardShadow, useColors } from "@/lib/theme";

export function FavButton({ id, source, style, variant = "float", size = 40 }: { id: number; source: string; style?: StyleProp<ViewStyle>; variant?: "float" | "plain"; size?: number }) {
  const c = useColors();
  const { has, toggle } = useFavourites();
  const on = has(id);
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(on ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        toggle(id, source);
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={on ? "Remove from saved" : "Save this ad"}
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === "float" && [{ backgroundColor: c.surface }, cardShadow(c)],
        variant === "plain" && { borderWidth: 1, borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface },
        pressed && { transform: [{ scale: 0.92 }] },
        style,
      ]}
    >
      <Heart size={size * 0.5} color={on ? c.dangerSolid : c.fg} fill={on ? c.dangerSolid : "transparent"} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { alignItems: "center", justifyContent: "center" } });
