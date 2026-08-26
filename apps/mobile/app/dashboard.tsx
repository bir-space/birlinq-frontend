import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import type { User } from "@birlinq/api";
import { useApi } from "@birlinq/platform";
import { nativeTokenStore } from "@/token-store";

/**
 * Placeholder for the cabinet. Step 5 builds the real thing on top of
 * `packages/core`; this exists so sign-in has somewhere to land and so the
 * authenticated half of the chain — bearer header, refresh-on-401 — is
 * exercised on a device.
 */
export default function DashboardScreen() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const api = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(nativeTokenStore.getUser());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { user: fresh } = await api.auth.me();
        if (cancelled) return;
        nativeTokenStore.setUser(fresh);
        setUser(fresh);
      } catch {
        if (!cancelled) setError(tc("error"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, tc]);

  async function signOut() {
    try {
      await api.auth.logout();
    } finally {
      nativeTokenStore.clear();
      router.replace("/");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-semibold text-paper">
          {t("overview.greeting", { name: user?.name ?? tc("loading") })}
        </Text>
        <Text className="mt-2 text-base text-muted">
          {t("overview.subtitle")}
        </Text>
        {error !== null && (
          <Text className="mt-2 text-sm text-danger">{error}</Text>
        )}

        <Pressable
          onPress={signOut}
          className="mt-8 items-center rounded-btn border border-card-border px-4 py-4"
        >
          <Text className="text-base text-paper">{tc("logout")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
