import { NativeTabs } from "expo-router/native-tabs";
import { useInbox } from "@/providers/inbox";
import { useColors } from "@/lib/theme";

/** System tab bar on iOS (Liquid Glass on iOS 26) and Material on Android. */
export default function AppTabs() {
  const c = useColors();
  const { unread } = useInbox();
  return (
    <NativeTabs
      tintColor={c.brand}
      iconColor={{ default: c.fgSubtle, selected: c.brand }}
      labelStyle={{ default: { color: c.fgSubtle }, selected: { color: c.brandText } }}
      backgroundColor={c.surface}
      indicatorColor={c.brandSoft}
      rippleColor={c.brandSoft}
      badgeBackgroundColor={c.dangerSolid}
      labelVisibilityMode="labeled"
      disableTransparentOnScrollEdge
      tabBarRespectsIMEInsets={false}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md={{ default: "home", selected: "home" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sell">
        <NativeTabs.Trigger.Label>Sell</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} md={{ default: "add_circle", selected: "add_circle" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }}
          md={{ default: "chat", selected: "chat" }}
        />
        {unread > 0 && <NativeTabs.Trigger.Badge>{unread > 9 ? "9+" : String(unread)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md={{ default: "account_circle", selected: "account_circle" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
