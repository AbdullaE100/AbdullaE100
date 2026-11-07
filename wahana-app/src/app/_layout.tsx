import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { queryClient } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { ContactProvider } from "@/providers/contact";
import { FavouritesProvider } from "@/providers/favourites";
import { InboxProvider } from "@/providers/inbox";
import { SessionProvider, useSession } from "@/providers/session";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 250 });

export const unstable_settings = { initialRouteName: "(tabs)" };

function Navigator() {
  const c = useColors();
  const { ready } = useSession();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  useEffect(() => track("app_open"), []);

  const theme = useMemo(() => {
    const base = c.dark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, primary: c.brand, background: c.bg, card: c.surface, text: c.fg, border: c.border, notification: c.dangerSolid } };
  }, [c]);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: c.fg,
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.surface },
          contentStyle: { backgroundColor: c.bg },
          animation: Platform.OS === "android" ? "slide_from_right" : "default",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
        <Stack.Screen name="ad/[id]" options={{ headerShown: false, title: "Ad" }} />
        <Stack.Screen name="filters" options={{ presentation: "modal", title: "Filters" }} />
        <Stack.Screen name="signin" options={{ presentation: "modal", title: "Sign in" }} />
        <Stack.Screen name="post/index" options={{ headerShown: false, gestureEnabled: false, title: "Post an ad" }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false, gestureEnabled: false, title: "Edit ad" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        <Stack.Screen name="saved" options={{ title: "Saved ads" }} />
        <Stack.Screen name="searches" options={{ title: "Saved searches" }} />
        <Stack.Screen name="my-ads" options={{ title: "My ads" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="leasing" options={{ title: "Leasing calculator" }} />
        <Stack.Screen name="value" options={{ title: "Value my vehicle" }} />
        <Stack.Screen name="seller/[id]" options={{ title: "Seller" }} />
        <Stack.Screen name="promote/[id]" options={{ title: "Promote your ad" }} />
        <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionProvider>
            <FavouritesProvider>
              <InboxProvider>
                <ContactProvider>
                  <Navigator />
                </ContactProvider>
              </InboxProvider>
            </FavouritesProvider>
          </SessionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
