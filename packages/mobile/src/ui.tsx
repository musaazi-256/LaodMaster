import { typography, metrics } from "./mobileDesign";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
export const C = {
  ink: "#111827",
  muted: "#6B7280",
  green: "#087443",
  lime: "#DCF5E7",
  mint: "#EEF7F2",
  paper: "#F3F4F6",
  line: "#E5E7EB",
  red: "#E5254B",
  amber: "#8A5911",
  white: "#FFFFFF",
};
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const Icon = ({
  name,
  size = 22,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => <Ionicons name={name} size={size} color={color} />;
export function Label({
  children,
  color = C.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <Text style={[s.label, { color }]}>{children}</Text>;
}
export function Title({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return <Text style={small ? s.h2 : s.h1}>{children}</Text>;
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={[s.body, muted && { color: C.muted }]}>{children}</Text>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.row, style]}>{children}</View>;
}
export function Badge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "neutral";
}) {
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor:
            tone === "red"
              ? "#FCEBED"
              : tone === "amber"
                ? "#FFF0D5"
                : tone === "neutral"
                  ? "#EDF0EB"
                  : C.mint,
        },
      ]}
    >
      <Text
        style={{
          ...typography.caption,
          fontWeight: "700",
          color: tone === "red" ? C.red : tone === "amber" ? C.amber : C.green,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
  danger = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: IconName;
}) {
  const color = secondary ? (danger ? C.red : C.ink) : C.white;
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: secondary ? "#08784D22" : "#FFFFFF33" }}
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && !secondary && { backgroundColor: C.red },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Icon name={icon} color={color} />
      ) : null}
      <Text style={[s.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B9791"
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={
          secureTextEntry || keyboardType === "url" ? "none" : "sentences"
        }
        autoCorrect={!secureTextEntry && keyboardType !== "url"}
        style={[
          s.input,
          multiline && { minHeight: 95, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function ErrorBox({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={s.error}
    >
      <Row>
        <Icon name="alert-circle-outline" color={C.red} />
        <Text style={[s.body, { color: C.red, flex: 1 }]}>{message}</Text>
      </Row>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={{ paddingVertical: 10 }}
        >
          <Text style={{ color: C.red, fontWeight: "700" }}>Try again →</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Screen({
  children,
  footer,
  scroll = true,
  scrollKey,
  plain = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  scrollKey?: string;
  plain?: boolean;
}) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollKey]);
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: plain ? "white" : C.paper }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[s.content, plain && { gap: 0 }]}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
        {footer && <View style={s.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  icon = "cube-outline",
  title,
  detail,
}: {
  icon?: IconName;
  title: string;
  detail: string;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 30, gap: 12 }}>
      <View style={s.iconCircle}>
        <Icon name={icon} size={28} color={C.green} />
      </View>
      <Title small>{title}</Title>
      <Text style={[s.body, { textAlign: "center", color: C.muted }]}>
        {detail}
      </Text>
    </Card>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
      <Text style={s.h2}>{title}</Text>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ padding: 10 }}
        >
          <Text
            style={{ fontWeight: "700", color: C.green, ...typography.caption }}
          >
            {action} →
          </Text>
        </Pressable>
      )}
    </Row>
  );
}
export function Hero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={["#113E30", "#086A46"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 24, gap: 16 }}
    >
      <Label color={C.lime}>{eyebrow}</Label>
      <Text
        style={{
          ...typography.title,

          fontWeight: "700",
          color: "white",
          letterSpacing: -0.9,
        }}
      >
        {title}
      </Text>
      {children}
    </LinearGradient>
  );
}
export const s = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  h1: {
    ...typography.title,

    fontWeight: "700",
    letterSpacing: -0.8,
    color: C.ink,
  },
  h2: {
    ...typography.section,

    fontWeight: "700",
    letterSpacing: -0.3,
    color: C.ink,
  },
  body: { ...typography.body, color: C.ink },
  label: {
    ...typography.subhead,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  button: {
    minHeight: Math.max(52, metrics.touch),
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  secondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: C.line,
  },
  buttonText: { ...typography.label, fontWeight: "600", textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 15,
    ...typography.body,
    color: C.ink,
    backgroundColor: "white",
    minHeight: 52,
  },
  error: {
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 14,
    borderRadius: 16,
    gap: 4,
  },
  footer: {
    backgroundColor: "white",
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.mint,
  },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  link: { color: C.green, fontWeight: "700", ...typography.subhead },
  small: { ...typography.caption, color: C.muted },
});
