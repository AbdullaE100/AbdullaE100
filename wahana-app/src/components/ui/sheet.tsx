import { X } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, useColors } from "@/lib/theme";
import { IconButton } from "./icon-button";
import { Text } from "./text";

/**
 * Bottom sheet built on Modal so it behaves the same on iOS, Android and web.
 * The backdrop fades while the panel slides; Android back and tapping outside close it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  height = "auto",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** "auto" sizes to content (up to 90%); "tall" fills 90% of the screen. */
  height?: "auto" | "tall";
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, mounted, progress]);

  if (!mounted) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [screenH * 0.6, 0] });
  const maxH = screenH * 0.9;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay, opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          role="dialog"
          aria-label={title}
          style={[
            styles.panel,
            {
              backgroundColor: c.surface,
              maxHeight: maxH,
              height: height === "tall" ? maxH : undefined,
              paddingBottom: footer ? 0 : Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.grabber}>
            <View style={[styles.grabberBar, { backgroundColor: c.borderStrong }]} />
          </View>
          {!!title && (
            <View style={[styles.head, { borderBottomColor: c.border }]}>
              <Text variant="title" style={styles.title} accessibilityRole="header" numberOfLines={1}>
                {title}
              </Text>
              <IconButton icon={<X size={22} color={c.fg} />} label="Close" onPress={onClose} />
            </View>
          )}
          <View style={height === "tall" ? styles.bodyTall : styles.body}>{children}</View>
          {footer && (
            <View style={[styles.footer, { borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  panel: { borderTopLeftRadius: radius.xxl + 4, borderTopRightRadius: radius.xxl + 4, overflow: "hidden", width: "100%", maxWidth: 640, alignSelf: "center" },
  grabber: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  grabberBar: { width: 40, height: 5, borderRadius: 3 },
  head: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { flex: 1 },
  body: { flexShrink: 1 },
  bodyTall: { flex: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12 },
});
