import { CheckCircle2, CircleAlert, Info } from "lucide-react-native";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cardShadow, radius, useColors } from "@/lib/theme";
import { Text } from "./text";

export type ToastInput = {
  title: string;
  body?: string;
  tone?: "default" | "success" | "error";
  action?: { label: string; onPress: () => void };
  /** ms; defaults to 3.5s, or 6s when there's an action. */
  duration?: number;
};

type Ctx = { toast: (t: ToastInput) => void };
const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => use(ToastContext);

type Item = ToastInput & { id: number };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<Item | null>(null);
  const seq = useRef(0);
  const toast = useCallback((t: ToastInput) => {
    seq.current += 1;
    setItem({ ...t, id: seq.current });
    AccessibilityInfo.announceForAccessibility([t.title, t.body].filter(Boolean).join(". "));
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext value={value}>
      {children}
      {item && <ToastView key={item.id} item={item} onDone={() => setItem((cur) => (cur?.id === item.id ? null : cur))} />}
    </ToastContext>
  );
}

function ToastView({ item, onDone }: { item: Item; onDone: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== "web";

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: native }).start(onDone);
  }, [anim, native, onDone]);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: native, damping: 18, stiffness: 220 }).start();
    const t = setTimeout(hide, item.duration ?? (item.action ? 6000 : 3500));
    return () => clearTimeout(t);
  }, [anim, hide, item, native]);

  const Icon = item.tone === "error" ? CircleAlert : item.tone === "success" ? CheckCircle2 : Info;
  const iconColor = item.tone === "error" ? c.danger : item.tone === "success" ? c.good : c.brandText;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        { top: insets.top + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] },
      ]}
    >
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, cardShadow(c)]}
      >
        <Icon size={22} color={iconColor} />
        <View style={styles.text}>
          <Text variant="body" weight="700">
            {item.title}
          </Text>
          {!!item.body && (
            <Text variant="small" tone="muted">
              {item.body}
            </Text>
          )}
        </View>
        {item.action && (
          <Pressable
            onPress={() => {
              item.action!.onPress();
              hide();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.action}
          >
            <Text variant="body" weight="700" tone="brand">
              {item.action.label}
            </Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 12, right: 12, alignItems: "center", zIndex: 1000 },
  card: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
  action: { paddingHorizontal: 6, minHeight: 36, justifyContent: "center" },
});
