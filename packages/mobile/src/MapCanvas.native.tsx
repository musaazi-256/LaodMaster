import React from "react";
import { View } from "react-native";
import type { Order } from "../../contracts/src";
import { RouteMap } from "./RouteMap";
import { customerTheme as T } from "./customerTheme";
export {
  TruckArt,
  TruckFrontArt,
  CancelDriverArt,
  PromoBadgeArt,
} from "./MapIllustration";
/** One map implementation for both roles, including legacy prototype orders. */
export function MapCanvas({
  order,
  height = 240,
}: {
  order?: Order;
  height?: number;
}) {
  const points = order
    ? [
        order.quote.pickup,
        ...(order.cargoPlan?.stops.map((s) => s.place) || [
          order.quote.destination,
        ]),
      ]
    : [];
  return (
    <View
      style={{
        height,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: T.border,
      }}
    >
      <RouteMap
        points={points}
        orderId={order?.id}
        stage={order?.stage}
        currentStop={order?.currentStop || 0}
        radar={order?.stage === "searching"}
      />
    </View>
  );
}
