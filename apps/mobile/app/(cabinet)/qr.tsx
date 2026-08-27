import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { entityLabel, type QrCode } from "@birlinq/api";
import { useQrList } from "@birlinq/core";
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

export default function QrScreen() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const {
    items,
    entities,
    loading,
    error,
    hasMore,
    loadingMore,
    busyId,
    actionError,
    retry,
    loadMore,
    togglePause,
  } = useQrList();

  function titleFor(qr: QrCode): string {
    const entity = qr.entity_id === null ? undefined : entities[qr.entity_id];
    return entity === undefined ? qr.code : entityLabel(entity, qr.code);
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <Screen>
        <Title title={t("qrList.title")} subtitle={t("qrList.subtitle")} />

        {actionError !== null && (
          <Text className="mb-3 text-sm text-danger">
            {actionError === "toggle" ? t("qrList.actionError") : tc("error")}
          </Text>
        )}

        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorCard message={tc("error")} retryLabel={tc("retry")} onRetry={retry} />
        ) : items.length === 0 ? (
          <EmptyState title={t("qrList.empty")} hint={t("qrList.emptyHint")} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(qr) => qr.id}
            contentContainerClassName="gap-3 pb-6"
            renderItem={({ item: qr }) => (
              <Card>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-base text-paper">{titleFor(qr)}</Text>
                  <Badge
                    label={t(`qrStatus.${qr.status}`)}
                    tone={qr.status === "activated" ? "new" : "muted"}
                  />
                </View>
                <Text className="mt-1 text-xs text-muted-2">
                  {t("qrList.scans", { count: qr.scan_count })}
                </Text>
                {(qr.status === "activated" || qr.status === "paused") && (
                  <View className="mt-3">
                    <SecondaryButton
                      label={
                        qr.status === "activated"
                          ? t("qrList.pause")
                          : t("qrList.resume")
                      }
                      onPress={() => void togglePause(qr)}
                      busy={busyId === qr.id}
                      disabled={busyId !== null && busyId !== qr.id}
                    />
                  </View>
                )}
              </Card>
            )}
            ListFooterComponent={
              hasMore ? (
                <View className="pt-2">
                  <SecondaryButton
                    label={t("qrList.loadMore")}
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
