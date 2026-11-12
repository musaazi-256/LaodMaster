import { typography } from "./mobileDesign";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { money, stageLabels, type Order } from "../../contracts/src";
import { C, Card, Row, Icon, Label, Badge, s } from "./ui";
export function RouteSummary({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: 0 }}>
      {!compact && (
        <Text
          style={{
            ...typography.section,
            fontWeight: "700",
            color: C.ink,
            marginBottom: 12,
          }}
        >
          My destination
        </Text>
      )}
      {[order.quote.pickup, order.quote.destination].map((p, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <View style={{ width: 20, alignItems: "center", paddingTop: 2 }}>
            <View
              style={{
                width: compact ? 15 : 18,
                height: compact ? 15 : 18,
                borderRadius: 9,
                borderWidth: compact ? 4 : 5,
                borderColor: i ? "#3B66D6" : "#087443",
                backgroundColor: "white",
              }}
            />
            {i === 0 && (
              <View
                style={{
                  width: 1.5,
                  height: compact ? 18 : 26,
                  backgroundColor: "#CBD5E1",
                  marginVertical: 3,
                }}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: 2, paddingBottom: i === 0 ? 8 : 0 }}>
            {!compact && <Label>{i ? "Destination" : "Pickup"}</Label>}
            <Text
              numberOfLines={2}
              style={{
                fontSize: compact ? 13.5 : 15.5,
                fontWeight: "600",
                color: i ? "#3B66D6" : C.ink,
              }}
            >
              {p.name}
            </Text>
            {!compact && <Text style={s.small}>{p.detail}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
export function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={`View order ${order.id}`}
    >
      <Card
        style={{
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.line,
          shadowOpacity: 0,
          elevation: 0,
          gap: 12,
        }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Text
            style={{ ...typography.caption, color: C.muted, fontWeight: "700" }}
          >
            {order.id}
          </Text>
          <Badge
            tone={
              order.stage === "cancelled"
                ? "red"
                : order.stage === "searching"
                  ? "amber"
                  : "green"
            }
          >
            {stageLabels[order.stage]}
          </Badge>
        </Row>
        <RouteSummary order={order} compact />
        <View style={s.divider} />
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "700", ...typography.body, color: C.ink }}>
            {money(order.quote.total)}
          </Text>
          <Icon name="arrow-forward" size={18} color={C.green} />
        </Row>
        {order.scheduledAt && (
          <Text style={s.small}>
            Pickup {new Date(order.scheduledAt).toLocaleString()}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}
export function MenuRow({
  icon,
  title,
  detail,
  onPress,
  compact = false,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  detail?: string;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 64,
        paddingVertical: 14,
        borderBottomWidth: compact ? 0.5 : 0,
        borderBottomColor: C.line,
      }}
    >
      <Row>
        <View
          style={compact ? { width: 28, alignItems: "center" } : s.iconCircle}
        >
          <Icon name={icon} color={C.green} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{ ...typography.subhead, fontWeight: "600", color: C.ink }}
          >
            {title}
          </Text>
          {detail && <Text style={s.small}>{detail}</Text>}
        </View>
        <Icon name="chevron-forward" size={17} color={C.muted} />
      </Row>
    </Pressable>
  );
}
export const paymentTone = (
  status: string,
): "green" | "red" | "amber" | "neutral" =>
  status === "paid"
    ? "green"
    : status === "failed"
      ? "red"
      : ["unknown", "awaiting_approval", "processing"].includes(status)
        ? "amber"
        : "neutral";
export const paymentLabel = (status: string) =>
  ({
    paid: "Paid",
    failed: "Payment failed",
    unknown: "Checking payment",
    awaiting_approval: "Awaiting approval",
    processing: "Processing",
    not_due: "Not due yet",
  })[status] || status;
