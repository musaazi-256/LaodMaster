import { typography } from "./mobileDesign";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  dispatchLabels,
  money,
  methodLabels,
  terminal,
  type DispatchStatus,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useDemo } from "./state";
import {
  Badge,
  Body,
  Button,
  C,
  Card,
  Empty,
  ErrorBox,
  Hero,
  Icon,
  Label,
  Row,
  Screen,
  Section,
  Title,
  s,
} from "./ui";
import { OrderCard, paymentLabel, paymentTone } from "./components";
export function Orders() {
  const { data, role, error, refresh } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const orders = [...(data?.orders || [])]
    .reverse()
    .filter(
      (o) =>
        (filter === "All" ||
          (filter === "Active" && !terminal(o) && o.stage !== "scheduled") ||
          (filter === "Scheduled" && o.stage === "scheduled") ||
          (filter === "Completed" && o.stage === "delivered") ||
          (filter === "Cancelled" && o.stage === "cancelled")) &&
        `${o.id} ${o.quote.pickup.name} ${o.quote.destination.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  return (
    <Screen plain>
      <Text
        accessibilityRole="header"
        style={[typography.title, { color: C.ink, marginBottom: 18 }]}
      >
        {role === "driver" ? "Your deliveries" : "Your orders"}
      </Text>
      <Row
        style={{
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 24,
          paddingHorizontal: 14,
          minHeight: 44,
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Icon name="search-outline" size={18} color={C.muted} />
        <TextInput
          accessibilityLabel="Search orders"
          placeholder="Search by order ID or location"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            ...typography.subhead,
            color: C.ink,
            flex: 1,
            paddingVertical: 10,
          }}
        />
        {!!search && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={() => setSearch("")}
          >
            <Icon name="close-circle" size={20} color={C.muted} />
          </Pressable>
        )}
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 14,
          minWidth: "100%",
          borderBottomWidth: 1,
          borderBottomColor: C.line,
          marginBottom: 18,
        }}
      >
        {["All", "Active", "Scheduled", "Completed", "Cancelled"].map((f) => (
          <Pressable
            key={f}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 4,
              borderBottomWidth: 2,
              borderBottomColor: filter === f ? C.green : "transparent",
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: filter === f ? "600" : "400",
                color: filter === f ? C.green : C.muted,
              }}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {role === "driver" && (
        <Button
          title="Request history · declined & missed"
          secondary
          icon="time-outline"
          onPress={() => nav.navigate("RequestHistory")}
        />
      )}
      <ErrorBox message={error} onRetry={() => void refresh()} />
      {orders.length ? (
        orders.map((o) => (
          <View key={o.id} style={{ marginBottom: 14 }}>
            <OrderCard
              key={o.id}
              order={o}
              onPress={() => nav.navigate("Order", { id: o.id })}
            />
          </View>
        ))
      ) : (
        <Empty
          title="No orders here yet"
          detail="Your orders will appear here as you start moving."
        />
      )}
    </Screen>
  );
}
export function Payments() {
  const { data, error, refresh } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const orders = [...(data?.orders || [])]
    .reverse()
    .filter((o) => o.stage !== "cancelled");
  const due = orders
    .filter((o) => o.stage === "delivered" && o.payment.status !== "paid")
    .reduce((n, o) => n + o.quote.total, 0);
  return (
    <Screen>
      <Label>PAYMENTS, WITHOUT THE GUESSWORK</Label>
      <Title>Your payments</Title>
      <Hero eyebrow="OUTSTANDING" title={money(due)}>
        <Text style={{ ...typography.subhead, color: "#DDEBE2" }}>
          Direct in-app payments. No wallet top-up needed.
        </Text>
      </Hero>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      <Section title="Payment activity" />
      {orders.length ? (
        orders.map((o) => (
          <Pressable
            accessibilityRole="button"
            key={o.id}
            onPress={() => nav.navigate("Payment", { id: o.id })}
          >
            <Card>
              <Row>
                <View style={s.iconCircle}>
                  <Icon
                    name={
                      o.method === "card"
                        ? "card-outline"
                        : "phone-portrait-outline"
                    }
                    color={C.green}
                  />
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{
                      ...typography.body,
                      fontWeight: "700",
                      color: C.ink,
                    }}
                  >
                    {money(o.quote.total)}
                  </Text>
                  <Text style={s.small}>
                    {methodLabels[o.method]} · {o.id}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} />
              </Row>
              <Badge tone={paymentTone(o.payment.status)}>
                {paymentLabel(o.payment.status)}
              </Badge>
              {o.financial.refunded > 0 && (
                <Text style={s.small}>
                  Refunded {money(o.financial.refunded)}
                </Text>
              )}
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="receipt-outline"
          title="No payments yet"
          detail="Your order payments and receipts will appear here."
        />
      )}
      <Body muted>Demo payments only. No real money moves.</Body>
    </Screen>
  );
}
const requestTone: Record<
  DispatchStatus,
  "green" | "amber" | "red" | "neutral"
> = {
  offered: "amber",
  accepted: "green",
  declined: "red",
  missed: "red",
  withdrawn: "neutral",
  released: "neutral",
};
export function RequestHistory() {
  const { data, error, refresh } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [filter, setFilter] = useState<"All" | DispatchStatus>("All");
  const all = data?.requestHistory || [];
  const items = all.filter((h) => filter === "All" || h.status === filter);
  const count = (k: DispatchStatus) => all.filter((h) => h.status === k).length;
  return (
    <Screen>
      <Label>EVERY REQUEST YOU RECEIVED</Label>
      <Title>Request history</Title>
      <Row>
        {(["accepted", "declined", "missed"] as const).map((k) => (
          <Card key={k} style={{ flex: 1 }}>
            <Label>{dispatchLabels[k]}</Label>
            <Text
              style={{
                ...typography.headline,
                fontWeight: "700",
                color: C.ink,
              }}
            >
              {count(k)}
            </Text>
          </Card>
        ))}
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {(["All", "accepted", "declined", "missed", "withdrawn"] as const).map(
          (f) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
              onPress={() => setFilter(f)}
              key={f}
              style={{
                backgroundColor: filter === f ? C.ink : "white",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.line,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: "600",
                  color: filter === f ? "white" : C.ink,
                }}
              >
                {f === "All" ? "All" : dispatchLabels[f]}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      {items.length ? (
        items.map((h) => {
          const open =
            h.status === "offered"
              ? () => nav.navigate("Offer", { id: h.orderId })
              : data?.orders.some((o) => o.id === h.orderId)
                ? () => nav.navigate("Order", { id: h.orderId })
                : undefined;
          return (
            <Pressable
              accessibilityRole={open ? "button" : undefined}
              disabled={!open}
              key={h.orderId + h.offeredAt}
              onPress={open}
            >
              <Card>
                <Row style={{ justifyContent: "space-between" }}>
                  <Label>{h.orderId}</Label>
                  <Badge tone={requestTone[h.status]}>
                    {dispatchLabels[h.status].toUpperCase()}
                  </Badge>
                </Row>
                <Text
                  style={{
                    ...typography.subhead,
                    fontWeight: "600",
                    color: C.ink,
                  }}
                >
                  {h.pickup} → {h.destination}
                </Text>
                <Row style={{ justifyContent: "space-between" }}>
                  <Text style={s.small}>
                    {new Date(h.offeredAt).toLocaleString()}
                  </Text>
                  <Text style={s.small}>Earning {money(h.earning)}</Text>
                </Row>
                {!!h.reason && <Text style={s.small}>{h.reason}</Text>}
              </Card>
            </Pressable>
          );
        })
      ) : (
        <Empty
          title="No requests yet"
          detail="Requests you accept, decline or miss are kept here."
        />
      )}
    </Screen>
  );
}
export function Earnings() {
  const { data, error, refresh } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const orders = (data?.orders || []).filter((o) => o.stage === "delivered");
  const scheduled = orders
    .filter((o) => o.financial.payoutStatus === "scheduled")
    .reduce(
      (n, o) => n + o.financial.earning - (o.financial.disbursed || 0),
      0,
    );
  const paid = orders.reduce(
    (n, o) =>
      n +
      (o.financial.disbursed ??
        (o.financial.payoutStatus === "paid" ? o.financial.earning : 0)),
    0,
  );
  return (
    <Screen>
      <Label>THE WORK YOU DO. THE MONEY YOU EARN.</Label>
      <Title>Your earnings</Title>
      <Hero eyebrow="SCHEDULED EARNINGS" title={money(scheduled)}>
        <Text style={{ color: "#DDEBE2", ...typography.subhead }}>
          Earned from completed deliveries. Payout is separate from customer
          collection.
        </Text>
      </Hero>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Label>Paid out</Label>
          <Title small>{money(paid)}</Title>
        </Row>
        <Text style={s.small}>
          Demo settlement is managed through the demo service. A production
          payout cycle has not been set.
        </Text>
      </Card>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      <Button
        title="Request or view scheduled payout"
        secondary
        onPress={() => nav.navigate("PayoutRequests")}
      />
      {!!data?.withdrawals?.length && (
        <>
          <Section title="Withdrawal transactions" />
          {[...data.withdrawals].reverse().map((w) => (
            <Pressable
              key={w.id}
              accessibilityRole="button"
              onPress={() => nav.navigate("PayoutRequests")}
            >
              <Card>
                <Body>
                  {w.id} · {w.status}
                </Body>
                <Body>Wallet withdrawal · {money(w.amount)}</Body>
                <Body>
                  {w.status === "paid"
                    ? "Payout charge"
                    : "Charge on successful payment"}{" "}
                  ·{" "}
                  {w.fee == null
                    ? "Awaiting finance confirmation"
                    : money(w.fee)}
                </Body>
                {w.feePayer && (
                  <Body muted>
                    Charge covered by{" "}
                    {w.feePayer === "platform" ? "LoadMaster" : "you"}
                  </Body>
                )}
                {w.netAmount != null && (
                  <Body>
                    {w.status === "paid" ? "Received" : "Net on success"} ·{" "}
                    {money(w.netAmount)}
                  </Body>
                )}
                <Text style={s.small}>
                  {new Date(w.createdAt).toLocaleString()} ·{" "}
                  {w.reference || "Awaiting payment reference"}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
      <Section title="Delivery earnings" />
      {orders.length ? (
        [...orders].reverse().map((o) => (
          <Pressable
            accessibilityRole="button"
            key={o.id}
            onPress={() => nav.navigate("Order", { id: o.id })}
          >
            <Card>
              <Row style={{ justifyContent: "space-between" }}>
                <Label>{o.id}</Label>
                <Badge
                  tone={o.financial.payoutStatus === "paid" ? "green" : "amber"}
                >
                  {o.financial.payoutStatus === "paid"
                    ? "Paid out"
                    : "Scheduled"}
                </Badge>
              </Row>
              <Title small>{money(o.financial.earning)}</Title>
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={s.small}>Fare {money(o.quote.total)}</Text>
                <Text style={s.small}>Fee {money(o.financial.fee)}</Text>
              </Row>
              <Text style={s.small}>
                Customer: {paymentLabel(o.payment.status)}
                {o.financial.refunded > 0
                  ? ` · Refunded ${money(o.financial.refunded)}`
                  : ""}
              </Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          title="Your work adds up"
          detail="Complete a delivery to see your earnings and payout status."
        />
      )}
    </Screen>
  );
}
