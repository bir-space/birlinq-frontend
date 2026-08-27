import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import { useAuth } from "@birlinq/core";
import { Spinner } from "@/components/ui";

/**
 * The signed-in half of the app. `useAuth` is the gate: while it is restoring a
 * session we show a spinner rather than bouncing a signed-in user to sign-in,
 * which is the same rule the web shell follows.
 */
export default function CabinetLayout() {
  const t = useTranslations("dashboard");
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-ink">
        <Spinner />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#06070b" },
        tabBarStyle: { backgroundColor: "#10131c", borderTopColor: "#232838" },
        tabBarActiveTintColor: "#2e63e0",
        tabBarInactiveTintColor: "#8b93a7",
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t("nav.overview") }} />
      <Tabs.Screen name="interactions" options={{ title: t("nav.interactions") }} />
      <Tabs.Screen name="qr" options={{ title: t("nav.qr") }} />
    </Tabs>
  );
}
