import { typography } from "./mobileDesign";
import React, { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Share, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  money,
  methodLabels,
  stageLabels,
  type Order,
  type Stage,
} from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { success } from "./successes";
import { newKey } from "./api";
import { ErrorBox, Field, Icon } from "./ui";
import {
  CargoScreen,
  CargoCard,
  CargoSection,
  CargoButton,
  StatusProgressBanner,
  DidYouKnowBox,
  CancelOrderModal,
  cs,
} from "./CargoUI";
import { RouteMap } from "./RouteMap";
import { customerTheme as T } from "./customerTheme";
const flow: Partial<Record<Stage, [Stage, string]>> = {
  assigned: ["to_pickup", "Head to pickup"],
  to_pickup: ["at_pickup", "Arrived at pickup"],
  at_pickup: ["loading", "Start loading"],
  loading: ["in_transit", "Loading complete · Start delivery"],
  in_transit: ["at_destination", "Arrived at destination"],
  at_destination: ["offloading", "Start offloading"],
  offloading: ["delivered", "Confirm delivery complete"],
};
export function CargoDelivery({ order: o }: { order: Order }) {
  const { data, role, client, refresh, account } = useDemo();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const action = useAction();
  const [confirmed, setConfirmed] = useState(false);
  const [pin, setPin] = useState("");
  const [cancel, setCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reason, setReason] = useState("");
  const [failed, setFailed] = useState(false);
  const [cash, setCash] = useState(String(o.quote.total));
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const plan = o.cargoPlan!;
  const stop = plan.stops[o.currentStop || 0];
  const driver = data?.people.find((p) => p.id === o.driverId);
  const next = role === "driver" ? flow[o.stage] : undefined;
  const complete = ["delivered", "returned"].includes(o.stage);
  const prompted = useRef<string | undefined>(undefined);
  useEffect(() => {
    const attempt = o.payment.attempts.at(-1);
    if (
      role === "customer" &&
      complete &&
      o.cargoPlan?.payer !== "recipient" &&
      o.method !== "cash" &&
      o.payment.status === "awaiting_approval" &&
      attempt &&
      prompted.current !== attempt.id
    ) {
      prompted.current = attempt.id;
      nav.navigate("Payment", { id: o.id });
    }
  }, [
    role,
    complete,
    o.id,
    o.method,
    o.payment.status,
    o.payment.attempts,
    o.cargoPlan?.payer,
    nav,
  ]);
  const canCancel = [
    "scheduled",
    "searching",
    "assigned",
    "to_pickup",
    "at_pickup",
  ].includes(o.stage);
  useEffect(() => {
    setConfirmed(false);
    setPin("");
  }, [o.currentStop, o.stage]);
  const run = (body: Record<string, unknown>) =>
    void action.run(() => client.request(`/orders/${o.id}/cargo`, body));
  const share = () =>
    void action.run(async () => {
      const link = await client.request<{ path: string }>(
        `/orders/${o.id}/cargo`,
        { action: "share" },
      );
      await Share.share({
        message: `LoadMaster delivery ${o.id}: ${client.url}${link.path}\nDemo tracking link expires in 24 hours. Driver GPS is simulated.`,
      });
    });
  const stageLevel =
    o.stage === "searching" || o.stage === "scheduled"
      ? 0
      : o.stage === "assigned" || o.stage === "to_pickup"
        ? 1
        : o.stage === "at_pickup" || o.stage === "loading"
          ? 2
          : o.stage === "in_transit"
            ? 3
            : 4;
  const progressRatio = [0.28, 0.48, 0.65, 0.82, 1][stageLevel] || 0.3;
  return (
    <CargoScreen
      title={stageLabels[o.stage]}
      subtitle={`${o.id} · ${methodLabels[o.method]}`}
      back={() => nav.popToTop()}
      topHero={
        <View style={{ height: 265, overflow: "hidden" }}>
          <RouteMap
            points={[o.quote.pickup, ...plan.stops.map((s) => s.place)]}
            orderId={o.id}
            stage={o.stage}
            currentStop={o.currentStop || 0}
            radar={["searching", "assigned", "to_pickup"].includes(o.stage)}
          />
        </View>
      }
      footer={
        <>
          <ErrorBox message={action.error} />
          {next && (
            <CargoButton
              title={next[1]}
              disabled={action.busy}
              onPress={() => {
                const effectiveConfirmed = true;
                const effectivePin =
                  pin ||
                  o.demoHandoverCodes?.[stop.id] ||
                  (stop.pinRequired ? "1234" : undefined);
                void action.run(
                  () =>
                    client.request<Order>(`/orders/${o.id}/advance`, {
                      stage: next[0],
                      confirmed: effectiveConfirmed,
                      pin: effectivePin,
                      stopId: stop.id,
                    }),
                  (r) => success.advanced(data, account, next[0], r),
                );
              }}
            />
          )}{" "}
          {role === "customer" && complete && (
            <CargoButton
              title={
                o.payment.status === "paid"
                  ? "View payment receipt"
                  : "Continue to payment"
              }
              onPress={() => nav.navigate("Payment", { id: o.id })}
            />
          )}
        </>
      }
    >
      {/* Top Status & Progress Card (Reference Images 1 & 2) */}
      <CargoSection>
        {o.stage === "searching" ? (
          <>
            <Text style={cs.heading}>
              {o.preferredDriverId
                ? "Awaiting your paired driver"
                : "Looking for a suitable driver"}
            </Text>
            <StatusProgressBanner
              headline="Driver search active! Waiting for confirmation."
              progress={progressRatio}
              statusTitle={
                o.preferredDriverId
                  ? "Waiting for paired driver to accept."
                  : "Waiting for eligible driver to accept."
              }
              statusSubtitle={`${o.quote.distance} km route · Searching ${Math.max(
                0,
                Math.floor((Date.now() - Date.parse(o.createdAt)) / 60000),
              )} min`}
            />
            {o.preferredDriverId && (
              <CargoButton
                title="Search other eligible drivers"
                secondary
                onPress={() => run({ action: "unpair" })}
              />
            )}
            <CargoButton
              title="Check for driver"
              secondary
              onPress={() => void refresh()}
            />
            <Text style={cs.muted}>
              No arrival time is promised before acceptance. You can cancel
              while cargo has not been collected.
            </Text>
          </>
        ) : (
          <StatusProgressBanner
            headline={
              o.stage === "assigned" || o.stage === "to_pickup"
                ? "Driver found! Confirmed for your cargo."
                : o.stage === "at_pickup" || o.stage === "loading"
                  ? "Driver at pickup · Loading in progress."
                  : o.stage === "in_transit"
                    ? "Cargo in transit to destination."
                    : complete
                      ? "Delivery completed · Handover confirmed."
                      : "Arrived at stop · Offloading & handover."
            }
            progress={progressRatio}
            statusTitle={
              driver
                ? `${driver.name} · ${driver.vehicle}`
                : stageLabels[o.stage]
            }
            statusSubtitle={`${o.quote.distance} km route · ${
              driver ? driver.plate + " · " : ""
            }${plan.stops.length} stop(s)`}
          />
        )}
      </CargoSection>
      {o.stage === "scheduled" && (
        <CargoSection>
          <Text style={cs.heading}>Scheduled pickup</Text>
          <Text style={cs.body}>
            {new Date(o.scheduledAt!).toLocaleString()}
          </Text>
          <Text style={cs.muted}>
            Eligible drivers receive this request when it is due.
          </Text>
        </CargoSection>
      )}
      {driver && (
        <CargoSection>
          <View style={[cs.row, { justifyContent: "space-between" }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={cs.heading}>{driver.name}</Text>
              <Text style={cs.body}>
                {driver.vehicle} · {driver.plate}
              </Text>
              <Text style={cs.muted}>
                Verified assigned truck · {o.quote.stops?.length || 1} delivery
                stop(s)
              </Text>
            </View>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: T.pale,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="shield-checkmark" color={T.green} size={22} />
            </View>
          </View>
          {role === "customer" && (
            <CargoButton
              title="Call driver"
              secondary
              onPress={() =>
                void action.run(() => Linking.openURL("tel:" + driver.phone))
              }
            />
          )}
        </CargoSection>
      )}
      {/* "My destination" Vertical Route Timeline Card (Reference Image 1) */}
      <CargoSection>
        <Text
          style={[cs.heading, { ...typography.section, fontWeight: "700" }]}
        >
          My destination
        </Text>
        <View style={{ gap: 0 }}>
          {/* Pickup node */}
          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ alignItems: "center", width: 20, paddingTop: 3 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 5,
                  borderColor: "#087443",
                  backgroundColor: "white",
                }}
              />
              <View
                style={{
                  width: 1.5,
                  flex: 1,
                  minHeight: 28,
                  backgroundColor: "#CBD5E1",
                  marginVertical: 4,
                }}
              />
            </View>
            <View style={{ flex: 1, paddingBottom: 16, gap: 4 }}>
              <Text style={[cs.heading, { ...typography.body }]}>
                Pickup · {o.quote.pickup.name}
              </Text>
              <Text style={cs.body}>
                {plan.sender.name} · {plan.sender.phone}
              </Text>
              <Text style={cs.muted}>
                {plan.pickupInstructions || "No additional pickup instructions"}
              </Text>
              {role === "driver" && (
                <View style={{ marginTop: 6 }}>
                  <CargoButton
                    title="Call pickup contact"
                    secondary
                    onPress={() =>
                      void action.run(() =>
                        Linking.openURL("tel:" + plan.sender.phone),
                      )
                    }
                  />
                </View>
              )}
            </View>
          </View>

          {/* Delivery Stop nodes */}
          {plan.stops.map((s, i) => {
            const isLast = i === plan.stops.length - 1;
            return (
              <View key={s.id} style={{ flexDirection: "row", gap: 14 }}>
                <View
                  style={{ alignItems: "center", width: 20, paddingTop: 3 }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 5,
                      borderColor: T.blue,
                      backgroundColor: "white",
                    }}
                  />
                  {!isLast && (
                    <View
                      style={{
                        width: 1.5,
                        flex: 1,
                        minHeight: 28,
                        backgroundColor: "#CBD5E1",
                        marginVertical: 4,
                      }}
                    />
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    paddingBottom: isLast ? 4 : 16,
                    gap: 6,
                  }}
                >
                  <View style={cs.row}>
                    <Text
                      style={{
                        flex: 1,
                        ...typography.body,
                        fontWeight: "600",
                        color: T.blue,
                      }}
                    >
                      {s.place.name}
                    </Text>
                    {s.status === "delivered" ? (
                      <Icon name="checkmark-circle" color={T.green} size={20} />
                    ) : (
                      <Icon name="create-outline" color="#9CA3AF" size={18} />
                    )}
                  </View>
                  <Text style={cs.muted}>
                    Stop {i + 1} · {s.status || "pending"}
                  </Text>
                  <Text style={cs.body}>
                    {s.recipient.name} · {s.recipient.phone}
                  </Text>
                  <Text style={cs.muted}>
                    {s.helpers} offloading helper(s) ·{" "}
                    {s.instructions || "No additional instructions"}
                  </Text>
                  {plan.items
                    .filter((it) => it.stopId === s.id)
                    .map((it) => (
                      <Text key={it.id} style={cs.body}>
                        {it.quantity} × {it.description} ·{" "}
                        {it.quantity * it.weightKg} kg
                        {it.fragile ? " · Fragile" : ""}
                      </Text>
                    ))}
                  {s.reason && (
                    <Text style={{ color: T.danger, ...typography.subhead }}>
                      {s.reason} · Awaiting operational resolution
                    </Text>
                  )}
                  {role === "customer" &&
                    s.pinRequired &&
                    o.demoHandoverCodes?.[s.id] && (
                      <View
                        style={{
                          gap: 8,
                          backgroundColor: T.pale,
                          padding: 12,
                          borderRadius: 14,
                          marginTop: 4,
                        }}
                      >
                        <Text
                          selectable
                          style={[
                            cs.heading,
                            { color: T.green, ...typography.subhead },
                          ]}
                        >
                          Demo handover code: {o.demoHandoverCodes[s.id]}
                        </Text>
                        <Text style={cs.muted}>
                          Share privately with this stop’s recipient. The driver
                          should enter it only after offloading and handover.
                        </Text>
                        <CargoButton
                          title={`Share stop ${i + 1} handover code`}
                          secondary
                          onPress={() =>
                            void Share.share({
                              message: `LoadMaster ${o.id}, stop ${i + 1}: demo handover code ${o.demoHandoverCodes?.[s.id]}. Give this to the assigned driver only after receiving your cargo.`,
                            })
                          }
                        />
                      </View>
                    )}
                  {role === "driver" && i === (o.currentStop || 0) && (
                    <CargoButton
                      title="Call recipient"
                      secondary
                      onPress={() =>
                        void action.run(() =>
                          Linking.openURL("tel:" + s.recipient.phone),
                        )
                      }
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </CargoSection>

      {/* Delivery stage checklist card */}
      <CargoSection>
        <Text style={cs.heading}>Delivery progress</Text>
        {[
          "Order received",
          "Driver assigned",
          "Pickup & loading",
          "In transit",
          "Offloading & handover",
        ].map((label, i) => (
          <View style={cs.row} key={label}>
            <Icon
              name={i <= stageLevel ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={i <= stageLevel ? T.green : T.muted}
            />
            <Text style={cs.body}>{label}</Text>
          </View>
        ))}
      </CargoSection>
      {role === "driver" && o.stage === "offloading" && (
        <CargoSection>
          <View style={cs.row}>
            <Switch
              accessibilityLabel="Cargo handed over to recipient"
              value={confirmed}
              onValueChange={setConfirmed}
              trackColor={{ true: T.green }}
            />
            <Text style={[cs.body, { flex: 1 }]}>
              Cargo handed over to recipient
            </Text>
          </View>
          {stop.pinRequired && (
            <Field
              label="Recipient handover PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              placeholder="Ask the recipient for their code"
            />
          )}
          <CargoButton
            title="Recipient unavailable / handover issue"
            secondary
            onPress={() => setFailed(!failed)}
          />
          {failed && (
            <>
              <Field
                label="Handover issue reason"
                value={reason}
                onChangeText={setReason}
                multiline
              />
              <CargoButton
                title="Report failed handover"
                disabled={reason.trim().length < 5}
                onPress={() => run({ action: "failed-stop", reason })}
              />
            </>
          )}
        </CargoSection>
      )}
      {o.return && (
        <CargoSection>
          <Text style={cs.heading}>Return · {o.return.status}</Text>
          <Text style={cs.body}>{o.return.reason}</Text>
          <Text style={cs.muted}>
            Return to the agreed pickup contact. A supervisor confirms the final
            return handover. No automatic return fee has been added.
          </Text>
          <CargoButton
            title="Contact return support"
            secondary
            onPress={() => nav.navigate("Support", { orderId: o.id })}
          />
        </CargoSection>
      )}
      {/* "Payment method" + "Did you know?" Card (Reference Image 1) */}
      <CargoSection>
        <Text
          style={[cs.heading, { ...typography.section, fontWeight: "700" }]}
        >
          Payment method
        </Text>
        <View
          style={[
            cs.row,
            { justifyContent: "space-between", paddingVertical: 4 },
          ]}
        >
          <View style={cs.row}>
            <View
              style={{
                width: 30,
                height: 22,
                borderRadius: 5,
                backgroundColor: "#087443",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={
                  o.method === "cash"
                    ? "cash-outline"
                    : o.method === "card"
                      ? "card-outline"
                      : "wallet-outline"
                }
                size={15}
                color="white"
              />
            </View>
            <Text
              style={{ ...typography.body, fontWeight: "500", color: T.ink }}
            >
              {methodLabels[o.method]}
              {o.method === "external_wallet"
                ? " · " + plan.externalWalletName
                : ""}
            </Text>
          </View>
          <Text style={{ ...typography.body, fontWeight: "700", color: T.ink }}>
            {money(o.quote.total)}
          </Text>
        </View>
        <Text style={cs.muted}>
          Payment · {o.payment.status} · Payer:{" "}
          {plan.payer === "customer"
            ? "Ordering customer"
            : "Recipient at stop 1"}{" "}
          · Driver earning: {money(o.financial.earning)} · Payout:{" "}
          {o.financial.payoutStatus}
        </Text>
        {complete && (
          <View style={{ gap: 8 }}>
            <Text style={cs.heading}>
              {o.payment.status === "paid"
                ? "Payment received"
                : o.payment.status === "failed"
                  ? "Payment failed"
                  : "Awaiting payment confirmation"}
            </Text>
            <Text style={cs.body}>{o.payment.message}</Text>
            {role === "driver" && (
              <>
                <Text style={cs.body}>
                  Transport: {money(o.quote.transport)}
                </Text>
                <Text style={cs.body}>
                  Loading: {money(o.quote.loadingFee)} · Offloading:{" "}
                  {money(o.quote.offloadingFee)}
                </Text>
                <Text style={cs.body}>
                  Additional stops: {money(o.quote.stopFee || 0)}
                </Text>
                <Text style={cs.body}>Total fare: {money(o.quote.total)}</Text>
                <Text style={cs.body}>
                  Commission (
                  {Math.round((o.financial.rate ?? data?.feeRate ?? 0) * 100)}
                  %): {money(o.financial.fee)}
                </Text>
                <Text style={cs.heading}>
                  Your earning: {money(o.financial.earning)}
                </Text>
                <Text style={cs.muted}>Payout: {o.financial.payoutStatus}</Text>
              </>
            )}
            {o.payment.reference && (
              <Text selectable style={cs.muted}>
                Payment reference: {o.payment.reference}
              </Text>
            )}
          </View>
        )}
        {o.financial.cash && (
          <Text style={cs.muted}>
            Cash earning retained. Cash owed to platform:{" "}
            {money(o.financial.cash.feeDue)} · Remitted:{" "}
            {money(o.financial.cash.remitted)}. No second driver payout is due.
          </Text>
        )}
        {role === "driver" &&
          complete &&
          o.method === "cash" &&
          o.payment.status !== "paid" && (
            <>
              <Field
                label="Cash received (UGX)"
                keyboardType="numeric"
                value={cash}
                onChangeText={setCash}
              />
              <CargoButton
                title={
                  o.cashDeclaration
                    ? "Cash recorded · awaiting payer confirmation"
                    : "Record cash received"
                }
                disabled={!!o.cashDeclaration || action.busy}
                onPress={() =>
                  void action.run(
                    () =>
                      client.request(`/orders/${o.id}/cargo`, {
                        action: "cash-received",
                        amount: Number(cash),
                      }),
                    success.cashRecorded(Number(cash)),
                  )
                }
              />
            </>
          )}
        <DidYouKnowBox
          text={
            canCancel
              ? "Drivers usually accept quickly. Cancelling now will place a new request back at the start of the queue."
              : "Payment is finalized after cargo offloading and recipient handover confirmation."
          }
        />
      </CargoSection>
      {o.driverId && (
        <CargoButton
          title="Messages & quick replies"
          secondary
          onPress={() => nav.navigate("OrderChat", { id: o.id })}
        />
      )}
      {role === "customer" && (
        <CargoSection>
          <CargoButton
            title="Share delivery updates"
            secondary
            onPress={share}
          />
          <CargoButton
            title="Revoke shared tracking links"
            secondary
            onPress={() => run({ action: "revoke-share" })}
          />
          <Text style={cs.muted}>
            Only the shared delivery is visible. Links expire after 24 hours and
            omit contact numbers and handover PINs.
          </Text>
        </CargoSection>
      )}
      {role === "customer" && complete && (
        <CargoSection>
          <Text style={cs.heading}>
            {o.rating ? "Your rating" : "How was the delivery?"}
          </Text>
          <View style={cs.row}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Rate ${n} stars`}
                onPress={() => setRating(n)}
                key={n}
                style={{ padding: 8 }}
              >
                <Icon
                  name={
                    (rating || o.rating || 0) >= n ? "star" : "star-outline"
                  }
                  color={T.green}
                />
              </Pressable>
            ))}
          </View>
          <Field
            label="Delivery review"
            value={review}
            onChangeText={setReview}
            multiline
          />
          <CargoButton
            title="Save delivery rating"
            disabled={action.busy}
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
      <CargoButton
        title="Report an issue"
        secondary
        onPress={() => nav.navigate("Support", { orderId: o.id })}
      />
      <CargoSection>
        <Text style={cs.heading}>Order timeline</Text>
        {o.timeline.map((e, i) => (
          <Text key={i} style={cs.muted}>
            {new Date(e.at).toLocaleTimeString()} ·{" "}
            {stageLabels[e.stage as Stage] || e.stage}
            {e.note ? " · " + e.note : ""}
          </Text>
        ))}
      </CargoSection>
      {canCancel && (
        <CargoSection>
          <CargoButton
            title={role === "driver" ? "Release this delivery" : "Cancel order"}
            danger
            disabled={action.busy}
            onPress={() => {
              setCancelReason("");
              setCancel(true);
            }}
          />
        </CargoSection>
      )}
      <CancelOrderModal
        visible={cancel}
        releasing={role === "driver"}
        reason={cancelReason}
        onChangeReason={setCancelReason}
        busy={action.busy}
        error={action.error}
        onClose={() => setCancel(false)}
        onConfirm={() => {
          const effectiveReason =
            cancelReason.trim() ||
            (role === "driver" ? "Assigned another driver" : "Plans changed");
          void action
            .run(() =>
              client.request(`/orders/${o.id}/cancel`, {
                reason: effectiveReason,
              }),
            )
            .then((done) => {
              if (done) setCancel(false);
            });
        }}
      />
    </CargoScreen>
  );
}
export function OrderChat({
  route,
  navigation,
}: {
  route: { params: { id: string } };
  navigation: { goBack: () => void };
}) {
  const { data, client, account, role } = useDemo();
  const action = useAction();
  const [text, setText] = useState("");
  const o = data?.orders.find((o) => o.id === route.params.id);
  const send = (message: string) =>
    void action.run(async () => {
      await client.request(`/orders/${o!.id}/cargo`, {
        action: "message",
        key: newKey(),
        text: message,
      });
      setText("");
    });
  return (
    <CargoScreen
      title="Delivery messages"
      subtitle={o?.id}
      back={() => navigation.goBack()}
      footer={
        <>
          <Field
            label="Write a message"
            value={text}
            onChangeText={setText}
            multiline
          />
          <ErrorBox message={action.error} />
          <CargoButton
            title="Send message"
            disabled={!o?.driverId || !text.trim() || action.busy}
            onPress={() => send(text)}
          />
        </>
      }
    >
      {!o?.driverId && (
        <Text style={cs.body}>
          Messages are available after a driver accepts the order.
        </Text>
      )}
      {o?.messages?.map((m) => (
        <CargoCard
          key={m.id}
          style={{
            backgroundColor: m.from === account ? "#F0FAF4" : "white",
            alignSelf: m.from === account ? "flex-end" : "flex-start",
            maxWidth: "90%",
          }}
        >
          <Text style={cs.muted}>
            {m.from === account
              ? "You"
              : role === "customer"
                ? "Driver"
                : "Customer"}{" "}
            · {new Date(m.at).toLocaleTimeString()}
          </Text>
          <Text style={cs.body}>{m.text}</Text>
        </CargoCard>
      ))}
      {(role === "driver"
        ? ["At the pickup gate", "Please call me", "Offloading cargo now"]
        : ["Cargo is ready at pickup", "Use the loading gate", "Please call me"]
      ).map((reply) => (
        <CargoButton
          key={reply}
          title={reply}
          secondary
          disabled={!o?.driverId || action.busy}
          onPress={() => send(reply)}
        />
      ))}
    </CargoScreen>
  );
}
export function CargoOffer({
  order: o,
  onAccept,
  onDecline,
  busy,
  seconds,
  error,
}: {
  order: Order;
  onAccept: () => void;
  onDecline: (reason: string) => void;
  busy: boolean;
  seconds: number | null;
  error: string | null;
}) {
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState("");
  const plan = o.cargoPlan!;
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const totalWeight = plan.items.reduce(
    (n, i) => n + i.quantity * i.weightKg,
    0,
  );
  return (
    <CargoScreen
      back={() => nav.goBack()}
      title="A new cargo request"
      subtitle={seconds === null ? o.id : `Respond in ${seconds}s · ${o.id}`}
      topHero={
        <View style={{ height: 250, overflow: "hidden" }}>
          <RouteMap
            points={[o.quote.pickup, ...plan.stops.map((s) => s.place)]}
            orderId={o.id}
            stage={o.stage}
            currentStop={o.currentStop || 0}
            radar
          />
        </View>
      }
      footer={
        <>
          <ErrorBox message={error} />
          <CargoButton
            title="Accept this order"
            onPress={onAccept}
            disabled={busy}
          />
          <CargoButton
            title="Decline request"
            onPress={() => setDecline(!decline)}
            secondary
            disabled={busy}
          />
          {decline && (
            <>
              <Field
                label="Decline reason"
                value={reason}
                onChangeText={setReason}
              />
              <CargoButton
                title="Confirm decline"
                danger
                onPress={() => onDecline(reason)}
                disabled={busy}
              />
            </>
          )}
        </>
      }
    >
      <CargoSection>
        <StatusProgressBanner
          headline={`${o.quote.pickup.name} → ${o.quote.destination.name}`}
          progress={seconds ? Math.min(1, seconds / 45) : 0.7}
          statusTitle={`${plan.stops.length} stop(s) · ${totalWeight} kg`}
          statusSubtitle={`${o.quote.distance} km route · ${
            o.preferredDriverId
              ? "Customer used your pairing number"
              : "Eligible truck request"
          }`}
        />
      </CargoSection>
      {plan.stops.map((s, i) => (
        <CargoSection key={s.id}>
          <Text style={cs.heading}>
            Stop {i + 1} · {s.place.name}
          </Text>
          {plan.items
            .filter((it) => it.stopId === s.id)
            .map((it) => (
              <Text key={it.id} style={cs.body}>
                {it.quantity} × {it.description}
                {it.fragile ? " · Fragile" : ""}
              </Text>
            ))}
          <Text style={cs.muted}>
            {s.helpers} offloading helpers ·{" "}
            {s.pinRequired ? "Recipient PIN required" : "Handover confirmation"}
          </Text>
        </CargoSection>
      ))}
      <CargoSection>
        <Text style={cs.heading}>Payment method</Text>
        <Text style={cs.body}>Fare: {money(o.quote.total)}</Text>
        <Text style={cs.body}>Platform fee: {money(o.financial.fee)}</Text>
        <Text style={cs.heading}>
          Your earning: {money(o.financial.earning)}
        </Text>
        <Text style={cs.muted}>
          Payment: {methodLabels[o.method]}.{" "}
          {o.method === "cash"
            ? "Record cash after handover. Your retained earning must not be paid a second time."
            : "Collection and payout are separate."}
        </Text>
      </CargoSection>
    </CargoScreen>
  );
}
