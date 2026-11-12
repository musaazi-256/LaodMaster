import { typography } from "./mobileDesign";
import { CargoPayment } from "./CargoPayment";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  methodLabels,
  availablePaymentMethods,
  money,
  type Method,
  type Scenario,
  type Order,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
import {
  Badge,
  Body,
  Button,
  C,
  Card,
  Empty,
  ErrorBox,
  Icon,
  Label,
  Row,
  Screen,
  Section,
  Title,
  s,
} from "./ui";
import { paymentLabel, paymentTone, RouteSummary } from "./components";
const scenarios: { id: Scenario; label: string; detail: string }[] = [
  {
    id: "success",
    label: "Successful payment",
    detail: "Approval confirms this payment.",
  },
  {
    id: "declined",
    label: "Payment declined",
    detail: "Provider rejects the demo payment.",
  },
  {
    id: "insufficient",
    label: "Insufficient funds",
    detail: "Customer can retry or change method.",
  },
  {
    id: "timeout",
    label: "Timeout · no charge",
    detail: "Check status, then safely retry.",
  },
  {
    id: "delayed",
    label: "Debited · confirmation delayed",
    detail: "Check status to recover the same payment.",
  },
];
export function Payment({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "Payment">) {
  const { data, client, error, refresh, account } = useDemo();
  const action = useAction();
  const [scenario, setScenario] = useState<Scenario>("success");
  const [method, setMethod] = useState<Method>("mtn");
  const [expanded, setExpanded] = useState(false);
  const o = data?.orders.find((o) => o.id === route.params.id);
  if (!o)
    return (
      <Screen>
        <ErrorBox message={error} />
        <Empty
          title="Payment not loaded"
          detail="Refresh to retrieve the latest order."
        />
        <Button title="Refresh" onPress={() => void refresh()} />
      </Screen>
    );
  if (o.cargoPlan) return <CargoPayment order={o} />;
  const p = o.payment;
  const pending = ["unknown", "processing"].includes(p.status);
  const paid = p.status === "paid";
  const run = (body: unknown) =>
    void action.run(
      () => client.request<Order>(`/orders/${o.id}/payment`, body),
      (r) => success.payment(data, account, r),
    );
  return (
    <Screen
      scrollKey={p.status}
      footer={
        <>
          <ErrorBox message={action.error} />
          {p.status === "awaiting_approval" && (
            <Button
              title={
                o.method === "card"
                  ? "Confirm demo card payment"
                  : "Approve demo payment"
              }
              busy={action.busy}
              onPress={() => run({ action: "approve", scenario })}
            />
          )}
          {pending && (
            <Button
              title="Check payment status"
              busy={action.busy}
              onPress={() => run({ action: "resolve" })}
            />
          )}
          {p.status === "failed" && (
            <Button
              title="Retry payment"
              busy={action.busy}
              disabled={!availablePaymentMethods(data).includes(method)}
              onPress={() => run({ action: "retry", method })}
            />
          )}
          {paid && (
            <Button
              title="Back to order"
              secondary
              onPress={() => navigation.navigate("Order", { id: o.id })}
            />
          )}
        </>
      }
    >
      <Badge tone="neutral">SIMULATED PAYMENT · NO REAL MONEY</Badge>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 20 }}>
        <View
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: paid
              ? C.mint
              : p.status === "failed"
                ? "#FCEBED"
                : "#FFF2D8",
          }}
        >
          <Icon
            name={
              paid
                ? "checkmark"
                : p.status === "failed"
                  ? "close"
                  : "receipt-outline"
            }
            size={36}
            color={paid ? C.green : p.status === "failed" ? C.red : C.amber}
          />
        </View>
        <Title>
          {paid
            ? "Payment confirmed"
            : p.status === "not_due"
              ? "Pay after delivery"
              : p.status === "failed"
                ? "Let’s try that again"
                : pending
                  ? "Checking your payment"
                  : "Ready to approve?"}
        </Title>
        <Text
          style={{
            ...typography.largeTitle,
            fontWeight: "700",
            letterSpacing: -1,
            color: C.ink,
          }}
        >
          {money(o.quote.total)}
        </Text>
        <Badge tone={paymentTone(p.status)}>{paymentLabel(p.status)}</Badge>
      </View>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      <Card>
        <Row>
          <Icon
            name={
              o.method === "card" ? "card-outline" : "phone-portrait-outline"
            }
            color={C.green}
          />
          <View style={{ flex: 1, gap: 5 }}>
            <Title small>{methodLabels[o.method]}</Title>
            <Text style={s.small}>
              {o.method === "card"
                ? "Synthetic card ·•••• 4242"
                : "Synthetic account ·•••• 0111"}
            </Text>
          </View>
        </Row>
        <Text style={s.small}>
          {p.message ||
            "Your method is saved with this order. Payment is requested after the delivery handover."}
        </Text>
        {pending && (
          <Text
            accessibilityRole="alert"
            style={{
              color: C.amber,
              ...typography.subhead,
              fontWeight: "600",
            }}
          >
            Don’t pay again yet. We’ll check the existing attempt before
            allowing another charge.
          </Text>
        )}
        {p.status === "not_due" && (
          <Body muted>
            {o.stage === "cancelled"
              ? "This order was cancelled. Nothing is due."
              : "No payment is due until the driver completes delivery."}
          </Body>
        )}
      </Card>
      {p.status === "awaiting_approval" && (
        <>
          <Card>
            <Title small>
              {o.method === "card"
                ? "Demo card confirmation"
                : "Mobile Money approval"}
            </Title>
            <Body>
              {o.method === "card"
                ? "Confirm the synthetic card payment below. No card number or security code is required."
                : "In the live app, your operator would send an approval prompt. For this demo, use the button below."}
            </Body>
            <Text style={s.small}>
              Never enter a Mobile Money PIN in LoadMaster.
            </Text>
          </Card>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <Label>DEMO OUTCOME CONTROLS</Label>
              <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
            </Row>
          </Pressable>
          {expanded && (
            <Card>
              {scenarios.map((sc) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: scenario === sc.id }}
                  key={sc.id}
                  onPress={() => setScenario(sc.id)}
                  style={{ paddingVertical: 8 }}
                >
                  <Row>
                    <Icon
                      name={
                        scenario === sc.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      color={C.green}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          ...typography.subhead,
                          fontWeight: "600",
                          color: C.ink,
                        }}
                      >
                        {sc.label}
                      </Text>
                      <Text style={s.small}>{sc.detail}</Text>
                    </View>
                  </Row>
                </Pressable>
              ))}
            </Card>
          )}
        </>
      )}
      {p.status === "failed" && (
        <Card>
          <Title small>Try again or change method</Title>
          {availablePaymentMethods(data)
            .filter((m) => ["mtn", "airtel", "card"].includes(m))
            .map((m) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: method === m }}
                key={m}
                onPress={() => setMethod(m)}
                style={{ paddingVertical: 10 }}
              >
                <Row>
                  <Icon
                    name={method === m ? "radio-button-on" : "radio-button-off"}
                    color={C.green}
                  />
                  <Body>{methodLabels[m]}</Body>
                </Row>
              </Pressable>
            ))}
        </Card>
      )}
      {paid && (
        <Card>
          <Label>YOUR DIGITAL RECEIPT</Label>
          <RouteSummary order={o} compact />
          <View style={s.divider} />
          {[
            ["Order", o.id],
            ["Payment reference", p.reference || "—"],
            ["Confirmed", p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"],
            ["Transport", money(o.quote.transport)],
            [
              "Loading & offloading",
              money(o.quote.loadingFee + o.quote.offloadingFee),
            ],
            ["Paid", money(o.quote.total)],
          ].map(([k, v]) => (
            <Row
              key={k}
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text style={s.small}>{k}</Text>
              <Text
                selectable
                style={{
                  ...typography.caption,
                  fontWeight: "600",
                  color: C.ink,
                  maxWidth: "65%",
                  textAlign: "right",
                }}
              >
                {v}
              </Text>
            </Row>
          ))}
          <Text style={s.small}>
            Demo receipt. No real transaction took place. Operator charges are
            not invented or added.
          </Text>
        </Card>
      )}
      {o.financial.events.some((e) => e.kind === "refund") && (
        <Card>
          <Label>REFUND HISTORY</Label>
          {o.financial.events
            .filter((e) => e.kind === "refund")
            .map((e) => (
              <View key={e.id} style={{ gap: 7 }}>
                <Badge>Refund {e.status}</Badge>
                <Title small>{money(e.amount)}</Title>
                <Body>{e.reason}</Body>
                <Text style={s.small}>
                  Returned to the original {methodLabels[o.method]} demo account
                  · {new Date(e.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
        </Card>
      )}
      {!!p.attempts.length && (
        <>
          <Section title="Payment history" />
          <Card>
            {[...p.attempts].reverse().map((a) => (
              <View key={a.id} style={{ gap: 8, paddingVertical: 7 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Text style={s.small}>{a.id}</Text>
                  <Badge tone={paymentTone(a.status)}>
                    {paymentLabel(a.status)}
                  </Badge>
                </Row>
                <Text style={s.small}>
                  {methodLabels[a.method]} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </Text>
                {a.message && <Body muted>{a.message}</Body>}
              </View>
            ))}
          </Card>
        </>
      )}
      <Button
        title="Report a payment issue"
        secondary
        icon="help-buoy-outline"
        onPress={() => navigation.navigate("Support", { orderId: o.id })}
      />
    </Screen>
  );
}
