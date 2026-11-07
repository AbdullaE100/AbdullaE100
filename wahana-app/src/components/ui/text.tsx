import { Text as RNText, type TextProps } from "react-native";
import { type, useColors, tabular, type Colors } from "@/lib/theme";

type Variant = keyof typeof type;
type Tone = "default" | "muted" | "subtle" | "brand" | "good" | "high" | "danger" | "inverse" | "accent";

const toneColor = (c: Colors, tone: Tone) =>
  ({ default: c.fg, muted: c.fgMuted, subtle: c.fgSubtle, brand: c.brandText, good: c.good, high: c.high, danger: c.danger, inverse: "#ffffff", accent: c.accentFg })[tone];

export function Text({
  variant = "body",
  tone = "default",
  weight,
  numeric,
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone; weight?: "400" | "500" | "600" | "700" | "800"; numeric?: boolean }) {
  const c = useColors();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...props}
      style={[type[variant], { color: toneColor(c, tone) }, weight && { fontWeight: weight }, numeric && tabular, style]}
    />
  );
}
