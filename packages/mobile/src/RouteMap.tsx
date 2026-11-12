import { typography } from "./mobileDesign";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { Place, Stage } from "../../contracts/src";
import { customerTheme as T } from "./customerTheme";
import { Icon } from "./ui";

export function RouteMap({
  points,
  onSelect,
  radar = false,
}: {
  points: Place[];
  orderId?: string;
  onSelect?: (p: { latitude: number; longitude: number }) => void;
  radar?: boolean;
  stage?: Stage;
  currentStop?: number;
}) {
  const pickup = points[0];
  return (
    <View style={styles.container} accessibilityLabel="Route map preview">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 380 260"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Rect width="380" height="260" fill="#EDF1F5" />
        {/* Map blocks & roads */}
        <Path
          d="M0 44H380M0 112H380M0 188H380M74 0V260M188 0V260M284 0V260"
          stroke="#FFFFFF"
          strokeWidth="12"
        />
        <Path
          d="M-20 210Q120 155 395 165M135 -10L165 270"
          stroke="#CBD5E1"
          strokeWidth="16"
          fill="none"
        />
        <Path
          d="M-20 210Q120 155 395 165M135 -10L165 270"
          stroke="#FFFFFF"
          strokeWidth="10"
          fill="none"
        />
        <SvgText x="20" y="34" fill="#64748B" fontSize="9.5" fontWeight="600">
          Kyaliwagala Rd
        </SvgText>
        <SvgText x="200" y="102" fill="#64748B" fontSize="9.5" fontWeight="600">
          Mutasa Rd
        </SvgText>
        <SvgText x="292" y="75" fill="#64748B" fontSize="9.5" fontWeight="600">
          Kyobe Rd
        </SvgText>

        {/* Concentric green radar pulse circles around pickup (Reference Image 2) */}
        {radar && (
          <>
            <Circle
              cx="188"
              cy="132"
              r="86"
              fill="#22C55E"
              fillOpacity="0.22"
            />
            <Circle
              cx="188"
              cy="132"
              r="54"
              fill="#087443"
              fillOpacity="0.28"
              stroke="#087443"
              strokeOpacity="0.4"
              strokeWidth="1.2"
            />
          </>
        )}

        {/* Crisp dark-green route line (Reference Image 5) */}
        {points.length >= 2 && (
          <>
            <Path
              d="M188 132H284V188H135V235"
              stroke="#FFFFFF"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M188 132H284V188H135V235"
              stroke="#14532D"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Pickup green circle marker with white border */}
        <Circle
          cx="188"
          cy="132"
          r="10"
          fill="#087443"
          stroke="#FFFFFF"
          strokeWidth="4"
        />

        {/* Destination pin */}
        {points.length >= 2 && (
          <Circle
            cx="135"
            cy="228"
            r="8.5"
            fill="#3B66D6"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
        )}

        {/* Floating dark-green callout bubble above pickup (Reference Image 5) */}
        <Rect x="130" y="74" width="116" height="38" rx="8" fill="#087443" />
        <Polygon points="182,112 194,112 188,120" fill="#087443" />
        <SvgText
          x="188"
          y="91"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
        >
          Pickup here
        </SvgText>
        <SvgText
          x="188"
          y="104"
          fill="#D1FAE5"
          fontSize="8.5"
          fontWeight="500"
          textAnchor="middle"
        >
          {(pickup?.name || "Selected pickup").slice(0, 20)}
        </SvgText>
      </Svg>

      {/* Bottom overlay pill with route summary */}
      <View style={styles.overlayBar}>
        <View style={styles.routeChips}>
          {points.map((p, i) => (
            <View key={p.id + i} style={styles.chip}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === 0 ? T.green : T.blue },
                ]}
              />
              <Text numberOfLines={1} style={styles.chipText}>
                {i === 0 ? "Pickup" : `Stop ${i}`}: {p.name}
              </Text>
            </View>
          ))}
        </View>
        {onSelect && (
          <Text style={styles.caption}>
            Use location search in this preview.
          </Text>
        )}
      </View>

      {/* Floating circular target/re-center button at bottom-right (Reference Image 2) */}
      <View pointerEvents="none" style={styles.locateFab}>
        <Icon name="locate" size={20} color="#111827" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    justifyContent: "flex-end",
    backgroundColor: "#EDF1F5",
    overflow: "hidden",
  },
  overlayBar: {
    margin: 12,
    marginRight: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  routeChips: {
    gap: 3,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    ...typography.caption,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  caption: {
    ...typography.caption,
    color: "#6B7280",
  },
  locateFab: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
