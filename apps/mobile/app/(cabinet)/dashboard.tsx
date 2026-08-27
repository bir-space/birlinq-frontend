import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { useAuth, useOverview } from "@birlinq/core";
import {
  Card,
  ErrorCard,
  Screen,
  SecondaryButton,
  Spinner,
  Title,
} from "@/components/ui";

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <View className="flex-1">
      <Card>
        <Text className="text-2xl font-semibold text-paper">{value}</Text>
        <Text className="mt-1 text-xs text-muted-2">{label}</Text>
        {hint !== undefined && (
          <Text className="mt-0.5 text-xs text-muted">{hint}</Text>
        )}
      </Card>
    </View>
  );
}

export default function DashboardScreen() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user, logout } = useAuth();
  const router = useRouter();
  const { stats, loading, error, retry } = useOverview();

  async function signOut() {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <Screen>
        <Title
          title={t("overview.greeting", { name: user?.name ?? "" })}
          subtitle={t("overview.subtitle")}
        />

        {loading ? (
          <Spinner />
        ) : error || stats === null ? (
          <ErrorCard message={tc("error")} retryLabel={tc("retry")} onRetry={retry} />
        ) : (
          <ScrollView contentContainerClassName="gap-3 pb-6">
            <View className="flex-row gap-3">
              <Stat
                label={t("overview.stats.activeQr")}
                value={stats.active_qrs}
                hint={t("overview.stats.ofTotal", { total: stats.total_qrs })}
              />
              <Stat
                label={t("overview.stats.scans7d")}
                value={stats.scans_7d}
                hint={t("overview.stats.scans30d", { count: stats.scans_30d })}
              />
            </View>
            <View className="flex-row gap-3">
              <Stat
                label={t("overview.stats.submissions7d")}
                value={stats.submissions_7d}
              />
              <Stat
                label={t("overview.stats.unresolved")}
                value={stats.unresolved_interactions}
              />
            </View>
            <View className="mt-4">
              <SecondaryButton label={tc("logout")} onPress={signOut} />
            </View>
          </ScrollView>
        )}
      </Screen>
    </SafeAreaView>
  );
}
