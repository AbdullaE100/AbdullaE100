import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useColors } from "@/lib/theme";
import { Text } from "./ui/text";

export function LogoMark({ size = 30 }: { size?: number }) {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <Rect width={32} height={32} rx={9} fill={c.brand} />
      <Path d="M7.5 10.5 11.2 22l4.8-8.6 4.8 8.6 3.7-11.5" fill="none" stroke="#ffffff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={16} cy={8.4} r={1.7} fill={c.accent} />
    </Svg>
  );
}

export function Logo() {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Wahana.lk">
      <LogoMark />
      <Text weight="800" style={styles.word}>
        Wahana
        <Text weight="800" tone="subtle" style={styles.word}>
          .lk
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  word: { fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
});
