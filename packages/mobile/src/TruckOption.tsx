import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { Truck } from "../../contracts/src";
import pickupImage from "../assets/figma/order-small-truck-back-side1.png";
import boxImage from "../assets/trucks/box-truck.png";
import { typography, metrics } from "./mobileDesign";
import { customerTheme as T } from "./customerTheme";
import { Icon } from "./ui";
/** Illustrative local vehicle images; actual capacity always comes from the quote catalogue. */
export function TruckOption({
  truck,
  selected,
  onPress,
}: {
  truck: Truck;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={truck.name}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      android_ripple={{ color: "#08744314" }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        minHeight: Math.max(84, metrics.touch),
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? T.green : T.border,
        backgroundColor: selected ? "#F3FAF5" : "white",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 82,
          alignItems: "center",
          justifyContent: "center",
          borderRightWidth: 1,
          borderRightColor: T.border,
          paddingRight: 10,
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={truck.id === "small" ? pickupImage : boxImage}
          resizeMode="contain"
          style={{ width: truck.id === "large" ? 78 : 70, height: 52 }}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[typography.label, { color: T.ink }]}>{truck.name}</Text>
        <Text style={[typography.subhead, { color: T.muted }]}>
          {truck.capacity} · {truck.body.split(" · ")[0]}
        </Text>
      </View>
      <Icon
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={selected ? T.green : "#9CA3AF"}
      />
    </Pressable>
  );
}
