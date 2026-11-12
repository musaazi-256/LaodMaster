import { MobileModal } from "./MobileModal";
import { typography, metrics } from "./mobileDesign";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  money,
  methodLabels,
  availablePaymentMethods,
  type Method,
} from "../../contracts/src";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
import { newKey } from "./api";
import { ErrorBox, Icon } from "./ui";
import { customerTheme as T } from "./customerTheme";
export function WalletSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { data, client, refresh } = useDemo();
  const action = useAction();
  const [amount, setAmount] = useState("50000");
  const [method, setMethod] = useState<Method>("mtn");
  const [outcome, setOutcome] = useState("success");
  const [message, setMessage] = useState<string | null>(null);
  const attempt = useRef(newKey());
  const methods = availablePaymentMethods(data).filter((m) =>
    ["mtn", "airtel", "card"].includes(m),
  );
  const pending = data?.walletTopups?.find((t) => t.status === "pending");
  useEffect(() => {
    if (visible) setMessage(null);
  }, [visible]);
  const submit = async () => {
    await action.run(
      async () => {
        const result = await client.request<{ status: string; amount: number }>(
          "/account/wallet",
          pending
            ? { resolve: true, key: pending.id }
            : { amount: Number(amount), method, outcome, key: attempt.current },
        );
        await refresh();
        setMessage(
          result.status === "completed"
            ? `${money(result.amount)} added to your demo wallet.`
            : result.status === "pending"
              ? "Confirmation is pending. Check its status before trying again."
              : "Payment failed. Your wallet has not been charged or credited. Try another method.",
        );
        if (result.status !== "pending") attempt.current = newKey();
        return result;
      },
      (result) => success.walletTopUp(data, result),
    );
  };
  return (
    <MobileModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add funds</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close wallet"
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="close" size={22} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            <Text style={styles.caption}>Wallet balance</Text>
            <Text style={styles.balance}>
              {money(data?.adjustmentBalance || 0)}
            </Text>
            <Text style={styles.description}>
              Demo payments only. No real money is collected. Your wallet
              balance and order payments are shown separately.
            </Text>
            {!pending && (
              <>
                <Text style={styles.label}>Amount (UGX)</Text>
                <TextInput
                  accessibilityLabel="Top-up amount"
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                  style={styles.input}
                  returnKeyType="done"
                />
                <Text style={styles.label}>Payment method</Text>
                {!methods.includes(method) && (
                  <Text style={styles.description}>
                    Choose an available payment method. If none are available,
                    please try again later.
                  </Text>
                )}
                {methods.map((m) => (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: method === m }}
                    onPress={() => setMethod(m)}
                    style={styles.option}
                  >
                    <Icon
                      name={
                        method === m ? "radio-button-on" : "radio-button-off"
                      }
                      size={20}
                      color={T.green}
                    />
                    <Text style={styles.optionText}>{methodLabels[m]}</Text>
                  </Pressable>
                ))}
                <Text style={styles.label}>Demo outcome</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["success", "pending", "failed"].map((o) => (
                    <Pressable
                      key={o}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: outcome === o }}
                      onPress={() => setOutcome(o)}
                      style={[
                        styles.scenario,
                        outcome === o && {
                          borderColor: T.green,
                          backgroundColor: T.pale,
                        },
                      ]}
                    >
                      <Text style={styles.optionText}>
                        {o[0].toUpperCase() + o.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            {pending && (
              <View style={styles.notice}>
                <Text style={styles.label}>Checking your payment</Text>
                <Text style={styles.description}>
                  {money(pending.amount)} · {methodLabels[pending.method]}
                  {"\n"}Your balance changes once confirmation is received.
                </Text>
              </View>
            )}
            {message && (
              <Text accessibilityRole="alert" style={styles.notice}>
                {message}
              </Text>
            )}
            <ErrorBox message={action.error} />
            <Pressable
              accessibilityRole="button"
              disabled={
                action.busy ||
                (!pending &&
                  (!methods.includes(method) ||
                    !Number.isInteger(Number(amount)) ||
                    Number(amount) < 1 ||
                    Number(amount) > 1000000))
              }
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submit,
                (pressed || action.busy) && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.submitText}>
                {action.busy
                  ? "Checking…"
                  : pending
                    ? "Check top-up status"
                    : "Approve demo top-up"}
              </Text>
            </Pressable>
            <Text style={styles.caption}>
              Enter a whole amount between UGX 1 and UGX 1,000,000.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MobileModal>
  );
}
const styles = StyleSheet.create({
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  title: { ...typography.section, fontWeight: "700", color: T.ink },
  close: {
    width: metrics.touch,
    height: metrics.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 24, gap: 16 },
  caption: { ...typography.caption, color: T.muted },
  balance: { ...typography.title, fontWeight: "700", color: T.ink },
  description: { ...typography.subhead, color: T.muted },
  label: { ...typography.subhead, fontWeight: "600", color: T.ink },
  input: {
    minHeight: 52,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    ...typography.section,
    color: T.ink,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    gap: 12,
    minHeight: metrics.touch,
  },
  optionText: { ...typography.subhead, color: T.ink },
  scenario: {
    minHeight: metrics.touch,
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
  },
  notice: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: T.pale,
    ...typography.subhead,
    color: T.green,
  },
  submit: {
    borderRadius: 12,
    backgroundColor: T.green,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  submitText: { ...typography.body, fontWeight: "600", color: "white" },
});
