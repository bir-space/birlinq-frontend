import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { ApiRequestError, LIMITS } from "@birlinq/api";
import { useApi } from "@birlinq/platform";

/**
 * Sign-in. The first screen that proves the whole chain end to end: shared
 * endpoints, the platform provider, Keychain-backed session storage and the
 * shared message bundle.
 *
 * It talks to the API directly for now. When `packages/core` lands in step 5
 * the form state and error mapping move there and this file keeps only markup.
 */
export default function SignInScreen() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const api = useApi();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !pending;

  async function submit() {
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      await api.auth.login({ email: email.trim(), password, device_name: "mobile" });
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : tc("error")
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-semibold text-paper">
          {t("login.title")}
        </Text>
        <Text className="mt-2 text-base text-muted">{t("login.subtitle")}</Text>

        <View className="mt-8 gap-4">
          <View className="gap-2">
            <Text className="text-sm text-muted">{t("fields.email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("fields.emailPlaceholder")}
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              maxLength={LIMITS.email}
              className="rounded-btn border border-card-border bg-card px-4 py-3 text-paper"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm text-muted">{t("fields.password")}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("fields.passwordPlaceholder")}
              placeholderTextColor="#6b7280"
              secureTextEntry
              autoCapitalize="none"
              className="rounded-btn border border-card-border bg-card px-4 py-3 text-paper"
            />
          </View>

          {error !== null && (
            <Text className="text-sm text-danger">{error}</Text>
          )}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            className={`mt-2 items-center rounded-btn px-4 py-4 ${
              canSubmit ? "bg-accent" : "bg-card"
            }`}
          >
            {pending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-paper">
                {t("login.submit")}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
