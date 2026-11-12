import { typography } from "./mobileDesign";
import React, { useState } from "react";
import { Linking, Pressable, Share, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  methodLabels,
  money,
  availablePaymentMethods,
  type Method,
  type Order,
  type Scenario,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
import { CargoScreen, CargoCard, CargoButton, cs } from "./CargoUI";
import { ErrorBox, Field, Icon } from "./ui";
import { customerTheme as T } from "./customerTheme";
import { WalletSheet } from "./WalletSheet";
export function CargoPayment({ order: o }: { order: Order }) {
  const { client, data, account } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const action = useAction();
  const [scenario, setScenario] = useState<Scenario>("success");
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<Method>(o.method);
  const [provider, setProvider] = useState(
    o.cargoPlan?.externalWalletName || "",
  );
  const [cash, setCash] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const paid = o.payment.status === "paid";
  const pending = ["unknown", "processing"].includes(o.payment.status);
  const recipient = o.cargoPlan?.payer === "recipient";
  const run = (body: Record<string, unknown>) =>
    void action.run(
      () => client.request<Order>(`/orders/${o.id}/payment`, body),
      (r) => success.payment(data, account, r),
    );
  const url = client.url + "/pay/" + o.recipientPayment?.token;
  return (
    <CargoScreen
      title={
        paid
          ? "Payment confirmed"
          : pending
            ? "Checking your payment"
            : o.method === "cash"
              ? "Confirm cash collection"
              : "Order payment"
      }
      subtitle={o.id}
      back={() => nav.goBack()}
      footer={
        <>
          <ErrorBox message={action.error} />
          {paid ? (
            <CargoButton
              title="Back to order"
              secondary
              onPress={() => nav.goBack()}
            />
          ) : recipient ? (
            <CargoButton
              title="Open recipient demo payment"
              onPress={() => void action.run(() => Linking.openURL(url))}
            />
          ) : o.method === "cash" ? (
            <CargoButton
              title="Confirm cash payment"
              disabled={!cash || !o.cashDeclaration || action.busy}
              onPress={() => run({ action: "confirm-cash" })}
            />
          ) : pending ? (
            <CargoButton
              title="Check payment status"
              disabled={action.busy}
              onPress={() => run({ action: "resolve" })}
            />
          ) : o.payment.status === "failed" ? (
            <CargoButton
              title="Retry payment"
              disabled={
                action.busy || !availablePaymentMethods(data).includes(method)
              }
              onPress={() => run({ action: "retry", method, provider })}
            />
          ) : (
            <CargoButton
              title={
                o.method === "card"
                  ? "Confirm demo card payment"
                  : "Approve demo payment"
              }
              disabled={
                action.busy ||
                o.payment.status !== "awaiting_approval" ||
                !availablePaymentMethods(data).includes(o.method)
              }
              onPress={() => run({ action: "approve", scenario })}
            />
          )}
        </>
      }
    >
      <CargoCard>
        <Text style={cs.muted}>SIMULATED PAYMENT · NO REAL MONEY</Text>
        <Text style={[cs.title, { ...typography.title }]}>
          {money(o.quote.total)}
        </Text>
        <Text style={cs.heading}>
          {methodLabels[o.method]}
          {o.method === "external_wallet"
            ? " · " + o.cargoPlan?.externalWalletName
            : ""}
        </Text>
        <Text style={cs.body}>{o.payment.status}</Text>
        <Text style={cs.muted}>
          {o.payment.message || "Payment follows delivery handover."}
        </Text>
        {pending && (
          <Text style={cs.muted}>
            Check the existing payment before retrying. Finance can also confirm
            it from the provider report.
          </Text>
        )}
      </CargoCard>
      <WalletSheet visible={walletOpen} onClose={() => setWalletOpen(false)} />
      {recipient && !paid && (
        <CargoCard>
          <Text style={cs.heading}>
            {o.recipientPayment?.accepted
              ? "Recipient accepted the charge"
              : "Awaiting recipient payment acceptance"}
          </Text>
          <Text style={cs.body}>
            The recipient at stop 1 must accept and approve this transport
            charge. This customer account cannot approve it on their behalf.
          </Text>
          <CargoButton
            title="Share recipient payment link"
            secondary
            onPress={() =>
              void Share.share({
                message: `LoadMaster ${o.id}: accept and pay the demo transport charge here: ${url}\nPrototype only; no real money is collected.`,
              })
            }
          />
        </CargoCard>
      )}
      {!recipient && o.method === "cash" && !paid && (
        <CargoCard>
          <Text style={cs.heading}>
            {o.cashDeclaration
              ? "Driver recorded cash received"
              : "Waiting for driver cash declaration"}
          </Text>
          <Text style={cs.body}>
            Confirm only when you have handed {money(o.quote.total)} to the
            assigned driver. A mismatch must be reported rather than silently
            marked paid.
          </Text>
          <View style={cs.row}>
            <Switch
              accessibilityLabel="I handed the agreed cash amount to the driver"
              value={cash}
              onValueChange={setCash}
              trackColor={{ true: T.green }}
            />
            <Text style={[cs.body, { flex: 1 }]}>
              I handed over the agreed cash amount.
            </Text>
          </View>
        </CargoCard>
      )}
      {paid && (
        <CargoCard>
          <Text style={cs.heading}>Receipt</Text>
          <Text selectable style={cs.body}>
            Reference: {o.payment.reference}
          </Text>
          <Text style={cs.body}>Method: {methodLabels[o.method]}</Text>
          <Text style={cs.body}>
            {o.quote.pickup.name} → {o.quote.destination.name}
          </Text>
          <Text style={cs.body}>Trip total: {money(o.quote.total)}</Text>
          <Text style={cs.body}>
            LoadMaster wallet debit:{" "}
            {money(o.method === "wallet" ? o.quote.total : 0)}
          </Text>
          <Text style={cs.body}>
            Confirmed:{" "}
            {o.payment.paidAt
              ? new Date(o.payment.paidAt).toLocaleString()
              : ""}
          </Text>
          <Text style={cs.body}>Refunded: {money(o.financial.refunded)}</Text>
          <Text style={cs.muted}>
            Driver payout and customer payment are separate records.
          </Text>
        </CargoCard>
      )}
      {!recipient &&
        !paid &&
        o.method !== "cash" &&
        o.payment.status === "awaiting_approval" && (
          <CargoCard>
            <Text style={cs.heading}>Ready to approve?</Text>
            <Text style={cs.body}>
              {o.method === "wallet"
                ? "Confirm deduction from your LoadMaster wallet."
                : "A provider payment request is ready. Enter your mobile money PIN only in your provider’s secure prompt. Use the button here to simulate approval."}
            </Text>
            <CargoButton
              title="DEMO OUTCOME CONTROLS"
              secondary
              onPress={() => setExpanded(!expanded)}
            />
            {expanded &&
              (
                [
                  "success",
                  "declined",
                  "insufficient",
                  "timeout",
                  "delayed",
                ] as Scenario[]
              ).map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityLabel={
                    s === "delayed" ? "Debited · confirmation delayed" : s
                  }
                  accessibilityState={{ checked: scenario === s }}
                  onPress={() => setScenario(s)}
                  style={[cs.row, { paddingVertical: 12 }]}
                >
                  <Icon
                    name={
                      scenario === s ? "radio-button-on" : "radio-button-off"
                    }
                    color={T.green}
                  />
                  <Text style={cs.body}>
                    {s === "delayed" ? "Debited · confirmation delayed" : s}
                  </Text>
                </Pressable>
              ))}
          </CargoCard>
        )}
      {!recipient && o.payment.status === "failed" && (
        <CargoCard>
          <Text style={cs.heading}>Choose a retry method</Text>
          {!availablePaymentMethods(data).includes(method) && (
            <Text style={cs.muted}>
              {availablePaymentMethods(data).length
                ? "Your previous method is unavailable. Choose an available method below."
                : "Payment methods are temporarily unavailable. Please try again later."}
            </Text>
          )}
          {availablePaymentMethods(data)
            .filter((m) => !recipient || m !== "wallet")
            .map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityLabel={methodLabels[m]}
                accessibilityState={{ checked: method === m }}
                onPress={() => setMethod(m)}
                style={[cs.row, { paddingVertical: 12 }]}
              >
                <Icon
                  name={method === m ? "radio-button-on" : "radio-button-off"}
                  color={T.green}
                />
                <Text style={cs.body}>{methodLabels[m]}</Text>
              </Pressable>
            ))}
          {method === "external_wallet" && (
            <Field
              label="External wallet provider"
              value={provider}
              onChangeText={setProvider}
            />
          )}
          {method === "wallet" && (
            <>
              <Text style={cs.muted}>
                Add funds to your LoadMaster wallet, then retry this trip
                payment.
              </Text>
              <CargoButton
                title="Open wallet and add funds"
                secondary
                onPress={() => setWalletOpen(true)}
              />
            </>
          )}
        </CargoCard>
      )}
      {o.financial.events.some((event) => event.kind === "refund") && (
        <CargoCard>
          <Text style={cs.heading}>Refund history</Text>
          {o.financial.events
            .filter((event) => event.kind === "refund")
            .map((event) => (
              <View key={event.id} style={{ gap: 4, marginTop: 12 }}>
                <Text style={cs.body}>
                  {money(event.amount)} · {methodLabels[o.method]}
                </Text>
                <Text selectable style={cs.muted}>
                  {event.id} · {new Date(event.createdAt).toLocaleString()}
                </Text>
                <Text style={cs.body}>{event.reason}</Text>
              </View>
            ))}
        </CargoCard>
      )}
      {o.payment.attempts.length > 0 && (
        <CargoCard>
          <Text style={cs.heading}>Payment history</Text>
          {o.payment.attempts.map((a) => (
            <View key={a.id} style={{ gap: 4, marginTop: 12 }}>
              <Text style={cs.body}>
                {methodLabels[a.method]} · {money(a.amount ?? o.quote.total)} ·{" "}
                {a.status}
              </Text>
              <Text selectable style={cs.muted}>
                {a.id}
              </Text>
              <Text style={cs.muted}>
                {new Date(a.createdAt).toLocaleString()}
              </Text>
              {a.message && <Text style={cs.body}>{a.message}</Text>}
            </View>
          ))}
        </CargoCard>
      )}
      <CargoButton
        title="Report payment issue"
        secondary
        onPress={() => nav.navigate("Support", { orderId: o.id })}
      />
    </CargoScreen>
  );
}
