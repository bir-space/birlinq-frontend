import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

/** The handful of primitives the cabinet screens share. Deliberately small. */

export function Screen({ children }: { children: ReactNode }) {
  return <View className="flex-1 bg-ink px-5 pt-4">{children}</View>;
}

export function Title({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-5">
      <Text className="text-2xl font-semibold text-paper">{title}</Text>
      {subtitle !== undefined && (
        <Text className="mt-1 text-sm text-muted-2">{subtitle}</Text>
      )}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-card border border-card-border bg-card p-4">
      {children}
    </View>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-3">{children}</View>;
}

export function Spinner() {
  return (
    <Centered>
      <ActivityIndicator color="#2e63e0" />
    </Centered>
  );
}

export function ErrorCard({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <Centered>
      <Text className="text-center text-sm text-danger">{message}</Text>
      <SecondaryButton label={retryLabel} onPress={onRetry} />
    </Centered>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Centered>
      <Text className="text-center text-base text-paper">{title}</Text>
      {hint !== undefined && (
        <Text className="text-center text-sm text-muted-2">{hint}</Text>
      )}
    </Centered>
  );
}

export function SecondaryButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      className={`items-center rounded-btn border border-card-border px-4 py-3 ${
        disabled || busy ? "opacity-50" : ""
      }`}
    >
      {busy ? (
        <ActivityIndicator color="#8b93a7" />
      ) : (
        <Text className="text-sm text-paper">{label}</Text>
      )}
    </Pressable>
  );
}

export function Badge({ label, tone }: { label: string; tone: "new" | "muted" }) {
  return (
    <View
      className={`self-start rounded-btn px-2 py-1 ${
        tone === "new" ? "bg-accent" : "border border-card-border"
      }`}
    >
      <Text className="text-xs text-paper">{label}</Text>
    </View>
  );
}
