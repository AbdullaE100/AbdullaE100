import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { CirclePlus, CircleUserRound, House, MessagesSquare, Search, type LucideIcon } from "lucide-react-native";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useInbox } from "@/providers/inbox";
import { useColors } from "@/lib/theme";

type TabButtonProps = Omit<TabTriggerSlotProps, "ref"> & { label: string; Icon: LucideIcon; badge?: number };

function TabButton({ label, Icon, badge, isFocused, ref, ...props }: TabButtonProps & { ref?: ComponentProps<typeof Pressable>["ref"] }) {
  const c = useColors();
  const color = isFocused ? c.brandText : c.fgSubtle;
  return (
    <Pressable {...props} ref={ref} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} accessibilityLabel={badge ? `${label}, ${badge} unread` : label} style={styles.tab}>
      <View style={[styles.pill, isFocused && { backgroundColor: c.brandSoft }]}>
        <Icon size={22} color={color} strokeWidth={isFocused ? 2.4 : 2} />
        {!!badge && (
          <View style={[styles.badge, { backgroundColor: c.dangerSolid, borderColor: c.surface }]}>
            <Text variant="caption" weight="700" tone="inverse" style={styles.badgeText}>
              {badge > 9 ? "9+" : badge}
            </Text>
          </View>
        )}
      </View>
      <Text variant="caption" weight={isFocused ? "700" : "500"} style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Web has no system tab bar, so draw one that matches Material/iOS proportions. */
export default function AppTabs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { unread } = useInbox();
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList role="tablist" style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 6) }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Home" Icon={House} />
        </TabTrigger>
        <TabTrigger name="search" href="/search" asChild>
          <TabButton label="Search" Icon={Search} />
        </TabTrigger>
        <TabTrigger name="sell" href="/sell" asChild>
          <TabButton label="Sell" Icon={CirclePlus} />
        </TabTrigger>
        <TabTrigger name="chats" href="/chats" asChild>
          <TabButton label="Chats" Icon={MessagesSquare} badge={unread} />
        </TabTrigger>
        <TabTrigger name="account" href="/account" asChild>
          <TabButton label="Account" Icon={CircleUserRound} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  slot: { flex: 1, minHeight: 0 },
  bar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  tab: { flex: 1, alignItems: "center", gap: 2, minHeight: 52 },
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: 8, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
