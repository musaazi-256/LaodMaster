import React from "react";
import { Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { Order } from "../../contracts/src";
import { C, Icon } from "./ui";

export function TruckArt({
  size = 90,
  color = C.green,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 150 90">
      <Rect x="10" y="20" width="80" height="48" rx="5" fill={color} />
      <Path d="M94 38H121L140 57V70H94Z" fill={color} />
      <Path d="M100 43H117L129 56H100Z" fill="#C6E8D8" />
      <Rect x="5" y="65" width="138" height="8" rx="3" fill="#29443B" />
      <Circle cx="37" cy="73" r="13" fill="#142D28" />
      <Circle cx="37" cy="73" r="6" fill="#D6E3DA" />
      <Circle cx="118" cy="73" r="13" fill="#142D28" />
      <Circle cx="118" cy="73" r="6" fill="#D6E3DA" />
      <Line
        x1="24"
        y1="29"
        x2="77"
        y2="29"
        stroke="white"
        strokeOpacity=".25"
        strokeWidth="3"
      />
    </Svg>
  );
}

/** Front-facing green vehicle illustration inspired by Reference Images 1 & 2 */
export function TruckFrontArt({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.78} viewBox="0 0 88 68">
      {/* Cargo box silhouette behind cab */}
      <Rect x="14" y="6" width="60" height="34" rx="7" fill="#15803D" />
      {/* Side mirrors */}
      <Rect x="6" y="24" width="7" height="10" rx="3" fill={C.green} />
      <Rect x="75" y="24" width="7" height="10" rx="3" fill={C.green} />
      {/* Main cab body */}
      <Path
        d="M14 24C14 16 20 12 28 12H60C68 12 74 16 74 24L78 42C78 48 74 52 68 52H20C14 52 10 48 10 42L14 24Z"
        fill={C.green}
      />
      {/* Windshield */}
      <Path
        d="M20 18H68L71 32H17L20 18Z"
        fill="#D1FAE5"
        stroke="#0F5132"
        strokeWidth="1.5"
      />
      {/* Driver silhouette in windshield */}
      <Circle cx="54" cy="24" r="4.2" fill="#374151" />
      <Path
        d="M47 31C48 27.5 51 26.5 54 26.5C57 26.5 60 27.5 61 31"
        fill="#1F2937"
      />
      {/* Front grille & headlights */}
      <Rect x="30" y="37" width="28" height="8" rx="4" fill="#064E3B" />
      <Line
        x1="35"
        y1="41"
        x2="53"
        y2="41"
        stroke="#A7F3D0"
        strokeWidth="1.5"
      />
      <Rect x="15" y="36" width="11" height="6" rx="3" fill="#FFFFFF" />
      <Rect x="62" y="36" width="11" height="6" rx="3" fill="#FFFFFF" />
      {/* Lower bumper */}
      <Rect x="12" y="47" width="64" height="6" rx="3" fill="#065F46" />
      <Rect x="34" y="48.5" width="20" height="3" rx="1.5" fill="#D1FAE5" />
      {/* Wheels */}
      <Rect x="13" y="51" width="13" height="11" rx="3.5" fill="#111827" />
      <Rect x="62" y="51" width="13" height="11" rx="3.5" fill="#111827" />
    </Svg>
  );
}

/** Circular driver + steering wheel + red X badge from Reference Image 5 ("Are you sure?") */
export function CancelDriverArt({ size = 128 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 128 128">
      {/* Soft pink circle background */}
      <Circle cx="60" cy="62" r="52" fill="#FDE8EC" />
      {/* Driver shoulders / green shirt */}
      <Path d="M24 104C26 84 40 74 60 74C80 74 94 84 96 104" fill={C.green} />
      {/* Seatbelt */}
      <Path
        d="M42 77L72 104"
        stroke="#64748B"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Neck */}
      <Rect x="52" y="62" width="16" height="14" rx="6" fill="#D99B78" />
      {/* Ears */}
      <Circle cx="39" cy="48" r="6" fill="#D99B78" />
      <Circle cx="81" cy="48" r="6" fill="#D99B78" />
      {/* Head */}
      <Rect x="42" y="26" width="36" height="40" rx="17" fill="#E5A985" />
      {/* Hair */}
      <Path
        d="M42 40C42 27 50 22 60 22C70 22 78 27 78 40C74 34 66 32 60 32C52 32 45 35 42 40Z"
        fill="#4A2C2A"
      />
      {/* Eyes */}
      <Circle cx="53" cy="45" r="2.2" fill="#1F2937" />
      <Circle cx="67" cy="45" r="2.2" fill="#1F2937" />
      {/* Beard & smile */}
      <Path
        d="M44 50C44 61 50 66 60 66C70 66 76 61 76 50C72 52 66 53 60 53C54 53 48 52 44 50Z"
        fill="#3B2219"
      />
      <Rect x="55" y="54" width="10" height="4" rx="2" fill="#E5A985" />
      {/* Steering wheel */}
      <Circle
        cx="60"
        cy="96"
        r="21"
        stroke="#1E293B"
        strokeWidth="7"
        fill="none"
      />
      <Circle cx="60" cy="96" r="6" fill="#334155" />
      <Line x1="42" y1="94" x2="78" y2="94" stroke="#1E293B" strokeWidth="5" />
      {/* Hands on wheel */}
      <Circle cx="38" cy="88" r="6.5" fill="#E5A985" />
      <Circle cx="82" cy="88" r="6.5" fill="#E5A985" />
      {/* Red X badge at bottom-right */}
      <Circle
        cx="94"
        cy="90"
        r="24"
        fill="#E5254B"
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      <Path
        d="M85 81L103 99M103 81L85 99"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Green circular brand promo badge from Reference Image 3 */
export function PromoBadgeArt({ size = 92 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Circle cx="48" cy="48" r="46" fill={C.green} />
      <Circle
        cx="48"
        cy="48"
        r="31"
        fill="#FFFFFF"
        stroke={C.green}
        strokeWidth="2"
      />
      <Circle
        cx="48"
        cy="48"
        r="26"
        fill="none"
        stroke={C.green}
        strokeWidth="2"
      />
      {/* Stylized fast cargo emblem inside */}
      <G transform="translate(27, 33)">
        <Rect x="2" y="6" width="24" height="16" rx="3" fill={C.green} />
        <Path d="M27 11H36L41 17V22H27V11Z" fill={C.green} />
        <Circle cx="10" cy="23" r="4" fill="#065F46" />
        <Circle cx="33" cy="23" r="4" fill="#065F46" />
        <Line
          x1="6"
          y1="11"
          x2="19"
          y2="11"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Line
          x1="9"
          y1="15"
          x2="16"
          y2="15"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

export function MapCanvas({
  order,
  height = 240,
}: {
  order?: Order;
  height?: number;
}) {
  const progress = order
    ? [
        "assigned",
        "to_pickup",
        "at_pickup",
        "loading",
        "in_transit",
        "at_destination",
        "offloading",
        "delivered",
      ].indexOf(order.stage)
    : -1;
  const x = progress >= 4 ? 225 : progress >= 0 ? 115 : 175;
  const y = progress >= 4 ? 90 : progress >= 0 ? 165 : 130;
  const radarCenterX = order ? 95 : x;
  const radarCenterY = order ? 178 : y;
  return (
    <View
      accessibilityLabel="Illustrated Kampala demo map. Positions and route are simulated, not live GPS."
      style={{
        height,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#EEF2F6",
        borderWidth: 1,
        borderColor: C.line,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 260"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect width="360" height="260" fill="#EDF1F5" />
        <Path
          d="M255 -30L330 10 280 120 365 180 400 240 315 290 265 220 225 100Z"
          fill="#E2E8F0"
        />
        {Array.from({ length: 7 }, (_, i) => (
          <Line
            key={"h" + i}
            x1="-30"
            y1={i * 52 - 20}
            x2="400"
            y2={i * 52 + 80}
            stroke="#FFFFFF"
            strokeWidth="10"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <Line
            key={"v" + i}
            x1={i * 60 - 30}
            y1="-30"
            x2={i * 60 - 130}
            y2="320"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
        ))}
        <Path
          d="M-30 95Q150 120 220 -20M-30 225Q160 160 400 190"
          stroke="#CBD5E1"
          strokeWidth="18"
          fill="none"
        />
        <Path
          d="M-30 95Q150 120 220 -20M-30 225Q160 160 400 190"
          stroke="#FFFFFF"
          strokeWidth="12"
          fill="none"
        />
        <SvgText
          x="26"
          y="54"
          fill="#64748B"
          fontSize="10"
          fontWeight="600"
          letterSpacing="1.5"
        >
          KAMPALA
        </SvgText>
        <SvgText x="238" y="220" fill="#64748B" fontSize="9" fontWeight="600">
          NAKAWA
        </SvgText>
        <SvgText x="250" y="38" fill="#64748B" fontSize="9" fontWeight="600">
          NTINDA
        </SvgText>
        <SvgText x="30" y="245" fill="#64748B" fontSize="9" fontWeight="600">
          KOLOLO
        </SvgText>

        {/* Concentric green radar rings from Reference Image 2 */}
        <Circle
          cx={radarCenterX}
          cy={radarCenterY}
          r="74"
          fill="#22C55E"
          fillOpacity="0.18"
        />
        <Circle
          cx={radarCenterX}
          cy={radarCenterY}
          r="46"
          fill={C.green}
          fillOpacity="0.24"
          stroke={C.green}
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {order && (
          <>
            {/* Crisp dark-green route polyline from Reference Image 5 */}
            <Path
              d="M95 178L95 132L188 132L240 80"
              stroke="white"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M95 178L95 132L188 132L240 80"
              stroke="#14532D"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pickup green circle marker with white border */}
            <Circle
              cx="95"
              cy="178"
              r="9"
              fill={C.green}
              stroke="white"
              strokeWidth="3.5"
            />
            {/* Floating dark-green pickup callout bubble */}
            <Rect x="48" y="138" width="94" height="26" rx="7" fill="#1E6B45" />
            <Polygon points="90,164 100,164 95,170" fill="#1E6B45" />
            <SvgText
              x="95"
              y="154"
              fill="#FFFFFF"
              fontSize="9.5"
              fontWeight="700"
              textAnchor="middle"
            >
              Pickup point
            </SvgText>
            {/* Destination pin */}
            <Circle
              cx="240"
              cy="80"
              r="9"
              fill="#3B66D6"
              stroke="white"
              strokeWidth="3.5"
            />
          </>
        )}
        <Circle
          cx={x}
          cy={y}
          r="8"
          fill={C.green}
          stroke="white"
          strokeWidth="3.5"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          backgroundColor: "white",
          borderRadius: 999,
          paddingVertical: 6,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <Icon name="navigate-outline" size={12} color={C.green} />
        <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted }}>
          DEMO MAP · SIMULATED ROUTE
        </Text>
      </View>
    </View>
  );
}
