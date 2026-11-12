import { typography } from "./mobileDesign";
import React from "react";
import truckImage from "../assets/figma/order-small-truck-back-side1.png";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { FigmaIcon } from "./figmaAssets";
import type { Place } from "../../contracts/src";

export function OrderLocationCanvas({
  pickup,
  destination,
}: {
  pickup?: Place;
  destination?: Place;
  onSelect?: (point: { latitude: number; longitude: number }) => void;
}) {
  return (
    <View
      pointerEvents="none"
      style={styles.canvas}
      accessibilityLabel="Cargo pickup and destination illustration"
    >
      {/* Clean street-map background with radar rings and dark-green route line (Reference Images 2 & 5) */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 300"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Path d="M0 0H390V300H0Z" fill="#EDF1F5" />
        <Path
          d="M0 58H390M0 138H390M0 218H390M88 0V300M212 0V300M304 0V300"
          stroke="#FFFFFF"
          strokeWidth="12"
        />
        <Path
          d="M-10 245Q140 190 400 200M150 -10L185 310"
          stroke="#CBD5E1"
          strokeWidth="16"
          fill="none"
        />
        <Path
          d="M-10 245Q140 190 400 200M150 -10L185 310"
          stroke="#FFFFFF"
          strokeWidth="10"
          fill="none"
        />
        <SvgText x="20" y="46" fill="#64748B" fontSize="10" fontWeight="600">
          Kyaliwagala Rd
        </SvgText>
        <SvgText x="220" y="128" fill="#64748B" fontSize="10" fontWeight="600">
          Mutasa Rd
        </SvgText>
        <SvgText x="312" y="95" fill="#64748B" fontSize="10" fontWeight="600">
          Kyobe Rd
        </SvgText>

        {/* Concentric green radar pulse rings around pickup */}
        <Circle cx="212" cy="218" r="78" fill="#22C55E" fillOpacity="0.18" />
        <Circle
          cx="212"
          cy="218"
          r="48"
          fill="#087443"
          fillOpacity="0.24"
          stroke="#087443"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {/* Crisp dark-green route polyline connecting pickup to destination */}
        <Path
          d="M212 218H304V138H158V88"
          stroke="#FFFFFF"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M212 218H304V138H158V88"
          stroke="#14532D"
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={styles.destination}>
        <MapTag destination name={destination?.name || "Choose destination"} />
      </View>
      <Image source={truckImage} style={styles.truck} resizeMode="cover" />
      <Image
        source={truckImage}
        style={[
          styles.truck,
          { left: "24%", top: "46%", transform: [{ scaleX: -1 }] },
        ]}
        resizeMode="cover"
      />
      <View style={styles.pickup}>
        <MapTag name={pickup?.name || "Tap to edit"} />
      </View>
    </View>
  );
}
function MapTag({
  destination = false,
  name,
}: {
  destination?: boolean;
  name: string;
}) {
  return (
    <View
      style={{
        width: destination ? 156.204 : 150.54,
        height: destination ? 60.5 : 61,
      }}
    >
      <View
        style={[
          styles.tag,
          {
            width: destination ? 136 : 130,
            backgroundColor: destination ? "white" : "#087443",
            borderColor: destination ? "#E2E8F0" : "#155233",
          },
        ]}
      >
        <Text style={[styles.title, !destination && { color: "#FFFFFF" }]}>
          {destination ? "Destination" : "Pickup here"}
        </Text>
        <Text
          style={[styles.name, !destination && { color: "#D1FAE5" }]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <View
        style={{ position: "absolute", left: destination ? 116 : 110, top: 0 }}
      >
        <FigmaIcon name={destination ? "order-group" : "order-group2"} />
        <View
          style={{
            position: "absolute",
            left: destination ? 9.49 : 9.57,
            top: destination ? 8.46 : 8.53,
          }}
        >
          <FigmaIcon name={destination ? "order-group1" : "order-group3"} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  canvas: { flex: 1, minHeight: 240, backgroundColor: "#EDF1F5" },
  destination: { position: "absolute", left: "26.6%", top: "18%" },
  pickup: { position: "absolute", left: "36.8%", top: "64%" },
  truck: {
    position: "absolute",
    width: 61,
    height: 41,
    left: "10%",
    top: "41%",
  },
  tag: {
    position: "absolute",
    left: 0,
    top: 0.5,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 14,
    gap: 2,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: { ...typography.caption, fontWeight: "700", color: "#000000" },
  name: { ...typography.caption, color: "#707070" },
});
