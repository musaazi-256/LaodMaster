import { CargoSection } from "./CargoUI";
import { MobileModal } from "./MobileModal";
import { typography } from "./mobileDesign";
import { CargoDelivery, CargoOffer } from "./CargoDelivery";
import {
  CancelOrderModal,
  DidYouKnowBox,
  StatusProgressBanner,
} from "./CargoUI";
import React, { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  methodLabels,
  money,
  stageLabels,
  type Stage,
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
  Field,
  Icon,
  Label,
  Row,
  Screen,
  Section,
  Title,
  s,
} from "./ui";
import { MapCanvas, TruckArt } from "./MapCanvas";
import { paymentLabel, paymentTone, RouteSummary } from "./components";
const declineReasons = [
  "Too far from me",
  "Vehicle not suitable",
  "Taking a break",
  "Fare too low",
];
/** Seconds left on a driver's response window, corrected for clock skew. */
export function useCountdown(expiresAt?: string, serverTime?: string) {
  const [offset] = useState(() =>
    serverTime ? Date.parse(serverTime) - Date.now() : 0,
  );
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now - offset) / 1000));
}
export function Offer({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "Offer">) {
  const { data, client, refresh } = useDemo();
  const action = useAction();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const o = data?.offers.find((o) => o.id === route.params.id);
  const left = useCountdown(o?.offer?.expiresAt, data?.serverTime);
  const record = data?.requestHistory?.find(
    (h) => h.orderId === route.params.id,
  );
  if (!o || left === 0)
    return (
      <Screen>
        <Empty
          title={
            record?.status === "missed" || left === 0
              ? "You missed this request"
              : "Request no longer available"
          }
          detail={
            record?.status === "missed" || left === 0
              ? "The response time ran out, so it went to other drivers. It stays in your request history."
              : "It may have been accepted, cancelled, or your availability changed."
          }
        />
        <Button
          title="View request history"
          secondary
          onPress={() => navigation.replace("RequestHistory")}
        />
        <Button
          title="Back to requests"
          onPress={() => navigation.popToTop()}
        />
      </Screen>
    );
  if (o.cargoPlan)
    return (
      <CargoOffer
        order={o}
        busy={action.busy}
        seconds={left}
        error={action.error}
        onAccept={() =>
          void action.run(async () => {
            await client.request(`/orders/${o.id}/accept`, {});
            await refresh();
            navigation.replace("Order", { id: o.id });
          }, success.accepted(o))
        }
        onDecline={(reason) =>
          void action.run(async () => {
            await client.request(`/orders/${o.id}/decline`, { reason });
            navigation.popToTop();
          })
        }
      />
    );
  const truck = data?.trucks.find((t) => t.id === o.quote.truckId);
  return (
    <Screen
      footer={
        <>
          <ErrorBox message={action.error} />
          <Button
            title="Accept this order"
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                await client.request(`/orders/${o.id}/accept`, {});
                await refresh();
                navigation.replace("Order", { id: o.id });
              }, success.accepted(o))
            }
          />
          <Button
            title="Decline request"
            secondary
            disabled={action.busy}
            onPress={() => setDeclining(true)}
          />
        </>
      }
    >
      <Row style={{ justifyContent: "space-between" }}>
        <Badge>NEW CARGO REQUEST</Badge>
        {left !== null && (
          <Badge tone={left <= 10 ? "red" : "amber"}>
            {`RESPOND IN ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
          </Badge>
        )}
      </Row>
      <MobileModal
        visible={declining}
        transparent
        animationType="fade"
        onRequestClose={() => setDeclining(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#142D28AA",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Card>
            <Title small>Decline this request?</Title>
            <Body>
              It goes to other drivers and stays in your request history. A
              reason helps operations plan, but it is optional.
            </Body>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {declineReasons.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: reason === r }}
                  onPress={() => setReason(reason === r ? "" : r)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: reason === r ? C.green : C.line,
                    backgroundColor: reason === r ? C.mint : "white",
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      fontWeight: "600",
                      color: C.ink,
                    }}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ErrorBox message={action.error} />
            <Button
              title="Decline request"
              danger
              busy={action.busy}
              onPress={() =>
                void action
                  .run(async () => {
                    await client.request(`/orders/${o.id}/decline`, { reason });
                    return true;
                  })
                  .then((done) => {
                    if (done) {
                      setDeclining(false);
                      navigation.goBack();
                    }
                  })
              }
            />
            <Button
              title="Keep reviewing"
              secondary
              disabled={action.busy}
              onPress={() => setDeclining(false)}
            />
          </Card>
        </View>
      </MobileModal>
      <Title>{"A move that fits\nyour truck."}</Title>
      <MapCanvas order={o} height={190} />
      <Card>
        <RouteSummary order={o} />
      </Card>
      <Card>
        <Row>
          <TruckArt size={80} />
          <View style={{ flex: 1, gap: 6 }}>
            <Title small>{truck?.name}</Title>
            <Text style={s.small}>
              {truck?.capacity} · {truck?.body}
            </Text>
          </View>
        </Row>
        <Text style={s.small}>
          Your vehicle: {data?.profile.vehicle} ·{" "}
          {data?.trucks.find((t) => t.id === data.profile.truckId)?.capacity}
        </Text>
        <View style={s.divider} />
        <Body>
          Pickup:{" "}
          {o.quote.loading
            ? `${o.quote.loading} loading helper(s) included`
            : "Customer arranges loading"}
        </Body>
        <Body>
          Destination:{" "}
          {o.quote.offloading
            ? `${o.quote.offloading} offloading helper(s) included`
            : "Customer arranges offloading"}
        </Body>
        {!!o.cargo && <Body>Cargo: {o.cargo}</Body>}
        <Text style={s.small}>
          Only accept if the load and handling fit your vehicle and agreed
          service.
        </Text>
      </Card>
      <Card>
        <Label>UPFRONT EARNING BREAKDOWN</Label>
        {[
          ["Agreed fare", o.quote.total],
          [
            `Platform fee (${Math.round((o.financial.rate ?? 0.15) * 100)}%)`,
            -o.financial.fee,
          ],
          ["Your earning", o.financial.earning],
        ].map(([l, n]) => (
          <Row key={String(l)} style={{ justifyContent: "space-between" }}>
            <Text style={s.body}>{l}</Text>
            <Text style={{ fontWeight: "700", color: C.ink }}>
              {money(Number(n))}
            </Text>
          </Row>
        ))}
        <Text style={s.small}>
          Includes selected handling. Demo earning policy applies 15% to the
          full quote; final handling commission policy is still to be agreed.
        </Text>
      </Card>
    </Screen>
  );
}
const nextActions: Partial<Record<Stage, { next: Stage; label: string }>> = {
  assigned: { next: "to_pickup", label: "Head to pickup" },
  to_pickup: { next: "at_pickup", label: "Arrived at pickup" },
  at_pickup: { next: "loading", label: "Start loading" },
  loading: { next: "in_transit", label: "Loading complete · Start delivery" },
  in_transit: { next: "at_destination", label: "Arrived at destination" },
  at_destination: { next: "offloading", label: "Start offloading" },
  offloading: { next: "delivered", label: "Confirm delivery complete" },
};
export function OrderDetail({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, "Order">) {
  const { data, role, client, error, refresh, account } = useDemo();
  const o = data?.orders.find((o) => o.id === route.params.id);
  const action = useAction();
  const [confirmed, setConfirmed] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  if (!o)
    return (
      <Screen plain>
        <ErrorBox message={error} onRetry={() => void refresh()} />
        <Empty
          title="Getting your order"
          detail="Refresh the demo service to load the latest order state."
        />
        <Button title="Refresh order" onPress={() => void refresh()} />
      </Screen>
    );
  if (o.cargoPlan) return <CargoDelivery order={o} />;
  const driver = data?.people.find((p) => p.id === o.driverId);
  const customer = data?.people.find((p) => p.id === o.customerId);
  const canCancel = [
    "scheduled",
    "searching",
    "assigned",
    "to_pickup",
    "at_pickup",
  ].includes(o.stage);
  const next = role === "driver" ? nextActions[o.stage] : undefined;
  const releasing = role === "driver";
  const person = role === "driver" ? customer : driver;
  return (
    <Screen
      plain
      footer={
        <>
          <ErrorBox message={action.error} />
          {next && (
            <Button
              title={next.label}
              busy={action.busy}
              onPress={() =>
                void action.run(
                  () =>
                    client.request<Order>(`/orders/${o.id}/advance`, {
                      stage: next.next,
                      confirmed: true,
                    }),
                  (r) => success.advanced(data, account, next.next, r),
                )
              }
            />
          )}
          {role === "customer" && o.stage === "delivered" && (
            <Button
              title={
                o.payment.status === "paid"
                  ? "View payment receipt"
                  : "Continue to payment"
              }
              onPress={() => navigation.navigate("Payment", { id: o.id })}
            />
          )}
          {o.stage === "cancelled" && role === "customer" && (
            <Button
              title="Order again"
              onPress={() =>
                navigation.navigate("Locations", { repeatId: o.id })
              }
            />
          )}
        </>
      }
    >
      <Row style={{ justifyContent: "space-between" }}>
        <Label>{o.id}</Label>
        <Badge
          tone={
            o.stage === "cancelled"
              ? "red"
              : o.stage === "searching"
                ? "amber"
                : "green"
          }
        >
          {stageLabels[o.stage]}
        </Badge>
      </Row>
      <Title>{stageLabels[o.stage]}</Title>
      <ErrorBox message={error} onRetry={() => void refresh()} />
      <MapCanvas order={o} height={220} />
      {o.stage === "searching" ? (
        <CargoSection>
          <Title small>Looking for a suitable driver</Title>
          <StatusProgressBanner
            headline="Driver search active! Waiting for confirmation."
            progress={0.28}
            statusTitle="Waiting for eligible driver to accept."
            statusSubtitle={`${o.quote.distance} km route · Searching`}
          />
          <Body muted>
            Your order stays active if you leave this screen. Open the driver
            app and go online to test matching.
          </Body>
          <Text style={s.small}>
            No driver yet? Keep waiting, change plans by cancelling, or contact
            support.
          </Text>
        </CargoSection>
      ) : (
        <CargoSection>
          <StatusProgressBanner
            headline={
              o.stage === "assigned" || o.stage === "to_pickup"
                ? "Driver found! Waiting for pickup arrival."
                : o.stage === "delivered"
                  ? "Delivery completed · Handover confirmed."
                  : stageLabels[o.stage]
            }
            progress={o.stage === "delivered" ? 1 : 0.6}
            statusTitle={
              driver
                ? `${driver.name} · ${driver.vehicle}`
                : stageLabels[o.stage]
            }
            statusSubtitle={`${o.quote.distance} km route · ${
              driver ? driver.plate : o.id
            }`}
          />
        </CargoSection>
      )}
      {o.stage === "scheduled" && (
        <CargoSection>
          <Label>SCHEDULED PICKUP</Label>
          <Title small>{new Date(o.scheduledAt!).toLocaleString()}</Title>
          <Body muted>
            This order enters the request queue when due, after any current
            order finishes. A driver is not reserved ahead of time.
          </Body>
        </CargoSection>
      )}
      <CargoSection>
        <RouteSummary order={o} />
      </CargoSection>
      {person && (
        <CargoSection>
          <Row>
            <View style={[s.iconCircle, { borderRadius: 25 }]}>
              <Text style={{ fontWeight: "700", color: C.green }}>
                {person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Label>{role === "driver" ? "CUSTOMER" : "YOUR DRIVER"}</Label>
              <Title small>{person.name}</Title>
              {driver && role === "customer" && (
                <Text style={s.small}>
                  {driver.vehicle} · {driver.plate}
                </Text>
              )}
            </View>
          </Row>
          <Text style={s.small}>
            Demo contact: {person.phone}. Calling is disabled for these
            synthetic numbers.
          </Text>
        </CargoSection>
      )}
      <CargoSection>
        <Label>THE AGREED SERVICE</Label>
        <Body>
          {data?.trucks.find((t) => t.id === o.quote.truckId)?.name} ·{" "}
          {data?.trucks.find((t) => t.id === o.quote.truckId)?.capacity}
        </Body>
        <Text style={s.body}>
          Pickup:{" "}
          {o.quote.loading
            ? `${o.quote.loading} helper(s)`
            : "Customer arranges loading"}
        </Text>
        <Text style={s.body}>
          Destination:{" "}
          {o.quote.offloading
            ? `${o.quote.offloading} helper(s)`
            : "Customer arranges offloading"}
        </Text>
        {!!o.cargo && <Body>Cargo: {o.cargo}</Body>}
        {!!(o.recipient || o.recipientPhone) && (
          <Body>
            Recipient:{" "}
            {[o.recipient, o.recipientPhone].filter(Boolean).join(" · ")}
          </Body>
        )}
        <View style={s.divider} />
        <Row style={{ justifyContent: "space-between" }}>
          <Label>Agreed fare</Label>
          <Title small>{money(o.quote.total)}</Title>
        </Row>
      </CargoSection>
      {role === "driver" && o.stage === "offloading" && (
        <CargoSection>
          <Title small>Confirm the handover</Title>
          <Row>
            <Text style={[s.body, { flex: 1 }]}>
              The cargo has been handed over to the recipient.
            </Text>
            <Switch
              accessibilityLabel="Cargo handed over to recipient"
              value={confirmed}
              onValueChange={setConfirmed}
              trackColor={{ true: C.green, false: C.line }}
            />
          </Row>
          <Body muted>
            If something is missing, damaged or the recipient is absent, report
            an issue instead.
          </Body>
        </CargoSection>
      )}
      <CargoSection>
        <Row style={{ justifyContent: "space-between" }}>
          <Title small>Payment</Title>
          <Badge tone={paymentTone(o.payment.status)}>
            {paymentLabel(o.payment.status)}
          </Badge>
        </Row>
        <Body>
          {methodLabels[o.method]} · {money(o.quote.total)}
        </Body>
        {role === "driver" && o.stage === "delivered" && (
          <>
            <View style={s.divider} />
            <Row style={{ justifyContent: "space-between" }}>
              <Body>Your earning</Body>
              <Title small>{money(o.financial.earning)}</Title>
            </Row>
            <Text style={s.small}>
              Platform fee {money(o.financial.fee)} · Payout{" "}
              {o.financial.payoutStatus}. Customer collection is tracked
              separately.
            </Text>
          </>
        )}
        {role === "customer" && (
          <Button
            secondary
            title="View payment details"
            onPress={() => navigation.navigate("Payment", { id: o.id })}
          />
        )}
        <DidYouKnowBox
          text={
            canCancel
              ? "Drivers usually accept quickly. Cancelling now will place a new request back at the start of the queue."
              : "Payment is finalized after cargo offloading and recipient handover confirmation."
          }
        />
      </CargoSection>
      {role === "customer" && o.stage === "delivered" && (
        <CargoSection>
          <Title small>
            {o.rating ? "Thanks for your feedback" : "How was your delivery?"}
          </Title>
          <Body muted>
            Rating is optional and does not affect payment or support.
          </Body>
          <Row>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${n} star${n > 1 ? "s" : ""}`}
                onPress={() => setRating(n)}
                style={{ padding: 9 }}
              >
                <Icon
                  name={
                    n <= (rating || o.rating || 0) ? "star" : "star-outline"
                  }
                  size={26}
                  color={C.green}
                />
              </Pressable>
            ))}
          </Row>
          <Field
            label="Review (optional)"
            value={review}
            onChangeText={setReview}
            multiline
          />
          <Button
            secondary
            title="Save delivery rating"
            busy={action.busy}
            onPress={() => {
              const effectiveRating = rating || o.rating || 5;
              void action.run(
                () =>
                  client.request("/account/rating", {
                    orderId: o.id,
                    rating: effectiveRating,
                    review: review || "Great delivery service!",
                  }),
                success.rated(effectiveRating),
              );
            }}
          />
        </CargoSection>
      )}
      <Section title="Order timeline" />
      <CargoSection>
        {o.timeline.map((e, i) => (
          <Row key={e.at + i} style={{ alignItems: "flex-start" }}>
            <View style={{ paddingTop: 3 }}>
              <Icon
                name={
                  i === o.timeline.length - 1
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={17}
                color={C.green}
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  ...typography.subhead,
                  fontWeight: "600",
                  color: C.ink,
                }}
              >
                {stageLabels[e.stage as Stage] || e.stage}
              </Text>
              <Text style={s.small}>{new Date(e.at).toLocaleString()}</Text>
              {!!e.note && <Text style={s.small}>{e.note}</Text>}
            </View>
          </Row>
        ))}
      </CargoSection>
      {!!o.issues.length && (
        <CargoSection>
          <Label>REPORTED ISSUES</Label>
          {o.issues.map((i) => (
            <View key={i.id} style={{ gap: 4 }}>
              <Badge tone="amber">
                {i.status} · {i.id}
              </Badge>
              <Body>{i.message}</Body>
              {i.replies?.map((reply) => (
                <View
                  key={reply.id}
                  style={{
                    backgroundColor: C.mint,
                    padding: 12,
                    borderRadius: 12,
                    gap: 6,
                  }}
                >
                  <Label>OPERATIONS REPLY</Label>
                  <Body>{reply.message}</Body>
                </View>
              ))}
              <Text style={s.small}>
                {new Date(i.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </CargoSection>
      )}
      <Button
        secondary
        title="Report an issue"
        icon="help-buoy-outline"
        onPress={() => navigation.navigate("Support", { orderId: o.id })}
      />
      {canCancel && (
        <Button
          danger
          title={releasing ? "Release this delivery" : "Cancel order"}
          disabled={action.busy}
          onPress={() => setCancelOpen(true)}
        />
      )}
      <CancelOrderModal
        visible={cancelOpen}
        releasing={releasing}
        reason={reason}
        onChangeReason={setReason}
        busy={action.busy}
        error={action.error}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          const effectiveReason =
            reason.trim() ||
            (releasing ? "Assigned another driver" : "Plans changed");
          void action
            .run(async () => {
              await client.request(`/orders/${o.id}/cancel`, {
                reason: effectiveReason,
              });
              setCancelOpen(false);
              return true;
            })
            .then((done) => {
              if (done && releasing) navigation.goBack();
            });
        }}
      />
    </Screen>
  );
}
