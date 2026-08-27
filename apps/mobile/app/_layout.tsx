import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { IntlProvider } from "use-intl";
import { defaultLocale, loadMessages, type Locale } from "@birlinq/i18n";
import { AuthProvider } from "@birlinq/core";
import { NativePlatform } from "@/platform";
import { hydrate, nativeTokenStore } from "@/token-store";
import "../global.css";

/**
 * Two things must finish before any screen renders: the persisted session has
 * to be read out of Keychain/Keystore into memory (the token store's getters
 * are synchronous by design), and the message bundle for the locale has to be
 * loaded. Until both land the app shows its background colour rather than a
 * flash of a signed-out screen for a signed-in user.
 *
 * Locale is fixed to the default for now — reading it from a stored preference
 * is part of the settings screen, which does not exist yet.
 */
export default function RootLayout() {
  const [locale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [loaded] = await Promise.all([loadMessages(locale), hydrate()]);
      if (!cancelled) setMessages(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (messages === null) {
    return <View className="flex-1 bg-ink" />;
  }

  return (
    <IntlProvider locale={locale} messages={messages} timeZone="Asia/Almaty">
      <NativePlatform>
        <AuthProvider store={nativeTokenStore}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#06070b" },
              }}
            />
          </SafeAreaProvider>
        </AuthProvider>
      </NativePlatform>
    </IntlProvider>
  );
}
