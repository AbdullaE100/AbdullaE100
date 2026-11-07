import { useMemo } from "react";
import { Platform, useColorScheme } from "react-native";

// Same tokens as the web app (wahana/app/globals.css) so both feel like one product.
const light = {
  dark: false,
  bg: "#ffffff",
  surface: "#ffffff",
  surface2: "#f5f6f7",
  surface3: "#e9ecef",
  border: "#e3e6ea",
  borderStrong: "#cdd2d8",
  fg: "#1f2328",
  fgMuted: "#50575f",
  fgSubtle: "#646c76",
  brand: "#168650",
  brandPressed: "#0f7346",
  brandFg: "#ffffff",
  brandText: "#127f4a",
  brandSoft: "#e7f5ee",
  brandSoftFg: "#0b6338",
  accent: "#f5a623",
  accentSoft: "#fff3dc",
  accentFg: "#6b4100",
  good: "#077042",
  goodSoft: "#e1f5ea",
  high: "#b03a0a",
  highSoft: "#fdede4",
  danger: "#c0261a",
  dangerSoft: "#fdecea",
  dangerSolid: "#c0261a",
  overlay: "rgba(10,14,12,0.55)",
  shadow: "#101814",
};

const dark: typeof light = {
  dark: true,
  bg: "#0a0c10",
  surface: "#12151b",
  surface2: "#191d25",
  surface3: "#232833",
  border: "#252a34",
  borderStrong: "#363d4a",
  fg: "#eceff4",
  fgMuted: "#a3acba",
  fgSubtle: "#8b94a3",
  brand: "#168650",
  brandPressed: "#127f4a",
  brandFg: "#ffffff",
  brandText: "#4fd394",
  brandSoft: "#12301f",
  brandSoftFg: "#a6ebc6",
  accent: "#f5b13d",
  accentSoft: "#33280f",
  accentFg: "#ffd58a",
  good: "#3ccf83",
  goodSoft: "#0f2a1d",
  high: "#ff8a57",
  highSoft: "#34190e",
  danger: "#ff6b5e",
  dangerSoft: "#3a1512",
  dangerSolid: "#c0261a",
  overlay: "rgba(0,0,0,0.65)",
  shadow: "#000000",
};

export type Colors = typeof light;

export const space = (n: number) => n * 4;
export const radius = { sm: 6, md: 8, lg: 10, xl: 12, xxl: 16, full: 999 };

export const type = {
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 21 },
  bodyLg: { fontSize: 16, lineHeight: 22 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "700" as const },
  h3: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
};

export const tabular = Platform.select({ ios: { fontVariant: ["tabular-nums" as const] }, default: {} });

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

/** Build a StyleSheet from the current palette, rebuilt only when the scheme flips. */
export function useStyles<T>(factory: (c: Colors) => T): T {
  const c = useColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(c), [c]);
}

export function cardShadow(c: Colors) {
  return Platform.select({
    ios: { shadowColor: c.shadow, shadowOpacity: c.dark ? 0.4 : 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: { boxShadow: c.dark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 16px rgba(16,24,20,0.08)" },
  });
}
