import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useColors, type Colors } from "@/lib/theme";
import { Text } from "./text";

type Tone = "neutral" | "brand" | "good" | "high" | "accent" | "danger" | "solidAccent" | "solidDanger" | "glass";

const tones = (c: Colors): Record<Tone, { bg: string; fg: string }> => ({
  neutral: { bg: c.surface2, fg: c.fgMuted },
  brand: { bg: c.brandSoft, fg: c.brandSoftFg },
  good: { bg: c.goodSoft, fg: c.good },
  high: { bg: c.highSoft, fg: c.high },
  accent: { bg: c.accentSoft, fg: c.accentFg },
  danger: { bg: c.dangerSoft, fg: c.danger },
  solidAccent: { bg: c.accent, fg: "#2a1a00" },
  solidDanger: { bg: c.dangerSolid, fg: "#ffffff" },
  glass: { bg: "rgba(0,0,0,0.6)", fg: "#ffffff" },
});

export function Badge({ children, tone = "neutral", icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  const c = useColors();
  const t = tones(c)[tone];
  return (
    <View style={[styles.base, { backgroundColor: t.bg }]}>
      {icon}
      <Text variant="caption" weight="700" style={{ color: t.fg }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
});
