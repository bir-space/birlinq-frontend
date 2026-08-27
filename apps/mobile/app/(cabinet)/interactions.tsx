import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import type { Interaction } from "@birlinq/api";
import { useInteractions } from "@birlinq/core";
import {
  Badge,
  Card,
  EmptyState,
  ErrorCard,
  Screen,
  SecondaryButton,
  Spinner,
  Title,
} from "@/components/ui";

function Row({
  item,
  busy,
  resolveLabel,
  statusLabel,
  noMessage,
  onResolve,
}: {
  item: Interaction;
  busy: boolean;
  resolveLabel: string;
  statusLabel: string;
  noMessage: string;
  onResolve: () => void;
}) {
  return (
    <Card>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-base text-paper">
          {item.message ?? noMessage}
        </Text>
        <Badge label={statusLabel} tone={item.status === "new" ? "new" : "muted"} />
      </View>
      {item.status === "new" && (
        <View className="mt-3">
          <SecondaryButton label={resolveLabel} onPress={onResolve} busy={busy} />
        </View>
      )}
    </Card>
  );
}

export default function InteractionsScreen() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    resolving,
    actionError,
    retry,
    loadMore,
    resolve,
  } = useInteractions();

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <Screen>
        <Title title={t("interactions.title")} subtitle={t("interactions.subtitle")} />

        {actionError !== null && (
          <Text className="mb-3 text-sm text-danger">
            {actionError === "resolve" ? t("interactions.resolveError") : tc("error")}
          </Text>
        )}

        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorCard message={tc("error")} retryLabel={tc("retry")} onRetry={retry} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("interactions.empty")}
            hint={t("interactions.emptyHint")}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-3 pb-6"
            renderItem={({ item }) => (
              <Row
                item={item}
                busy={resolving.has(item.id)}
                resolveLabel={t("interactions.resolve")}
                statusLabel={t(`interactionStatus.${item.status}`)}
                noMessage={t("interactions.noMessage")}
                onResolve={() => void resolve(item.id)}
              />
            )}
            ListFooterComponent={
              hasMore ? (
                <View className="pt-2">
                  <SecondaryButton
                    label={t("interactions.loadMore")}
                    onPress={() => void loadMore()}
                    busy={loadingMore}
                  />
                </View>
              ) : null
            }
          />
        )}
      </Screen>
    </SafeAreaView>
  );
}
