import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Platform, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { radius, useColors } from "@/lib/theme";

/** Shimmer-free pulse; respects Reduce Motion. */
export function Skeleton({ w = "100%", h = 16, r = radius.md, style }: { w?: DimensionValue; h?: DimensionValue; r?: number; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const [pulse] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce || cancelled) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
            Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: Platform.OS !== "web" }),
          ]),
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);
  return <Animated.View aria-hidden style={[{ width: w, height: h, borderRadius: r, backgroundColor: c.surface3, opacity: pulse }, style]} />;
}
