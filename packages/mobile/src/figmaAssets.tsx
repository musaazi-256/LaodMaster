import asset0 from "../assets/figma/order-ios-signal.svg";
import asset1 from "../assets/figma/order-ios-wifi-signal.svg";
import asset2 from "../assets/figma/order-ios-battery-full.svg";
import asset3 from "../assets/figma/order-lucide-icons-arrow-left.svg";
import asset4 from "../assets/figma/order-lucide-icons-navigation.svg";
import asset5 from "../assets/figma/order-group.svg";
import asset6 from "../assets/figma/order-group1.svg";
import asset7 from "../assets/figma/order-group2.svg";
import asset8 from "../assets/figma/order-group3.svg";
import asset9 from "../assets/figma/order-radio-base.svg";
import asset10 from "../assets/figma/order-line.svg";
import asset11 from "../assets/figma/order-lucide-icons-circle-check-big.svg";
import asset12 from "../assets/figma/order-icon-leading.svg";
import asset13 from "../assets/figma/order-lucide-icons-locate-fixed.svg";
import asset14 from "../assets/figma/home-frame.svg";
import asset15 from "../assets/figma/home-lucide-icons-bell.svg";
import asset16 from "../assets/figma/home-ellipse.svg";
import asset17 from "../assets/figma/home-lucide-icons-truck.svg";
import asset18 from "../assets/figma/home-lucide-icons-map-pin.svg";
import asset19 from "../assets/figma/home-lucide-icons-arrow-right.svg";
import asset20 from "../assets/figma/home-lucide-icons-calendar-clock.svg";
import asset21 from "../assets/figma/home-lucide-icons-history.svg";
import asset22 from "../assets/figma/home-lucide-icons-calculator.svg";
import asset23 from "../assets/figma/home-lucide-icons-headphones.svg";
import asset24 from "../assets/figma/home-lucide-icons-wallet.svg";
import asset25 from "../assets/figma/home-lucide-icons-arrow-right1.svg";
import asset26 from "../assets/figma/home-lucide-icons-truck1.svg";
import asset27 from "../assets/figma/home-lucide-icons-house.svg";
import asset28 from "../assets/figma/home-lucide-icons-truck2.svg";
import asset29 from "../assets/figma/home-lucide-icons-receipt.svg";
import asset30 from "../assets/figma/home-lucide-icons-user.svg";
import React from "react";
import { View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
export const figmaAssets = {
  "order-ios-signal": {
    source: asset0,
    width: 20,
    height: 20,
  },
  "order-ios-wifi-signal": {
    source: asset1,
    width: 20,
    height: 20,
  },
  "order-ios-battery-full": {
    source: asset2,
    width: 28,
    height: 20,
  },
  "order-lucide-icons-arrow-left": {
    source: asset3,
    width: 24,
    height: 24,
  },
  "order-lucide-icons-navigation": {
    source: asset4,
    width: 24,
    height: 24,
  },
  "order-group": {
    source: asset5,
    width: 40.2043,
    height: 60.5,
  },
  "order-group1": {
    source: asset6,
    width: 21.2259,
    height: 20.6671,
  },
  "order-group2": {
    source: asset7,
    width: 40.54,
    height: 61,
  },
  "order-group3": {
    source: asset8,
    width: 21.4,
    height: 20.84,
  },
  "order-radio-base": {
    source: asset9,
    width: 16,
    height: 16,
  },
  "order-line": {
    source: asset10,
    width: 46,
    height: 1,
  },
  "order-lucide-icons-circle-check-big": {
    source: asset11,
    width: 16,
    height: 16,
  },
  "order-icon-leading": {
    source: asset12,
    width: 16,
    height: 16,
  },
  "order-lucide-icons-locate-fixed": {
    source: asset13,
    width: 16,
    height: 16,
  },
  "home-frame": {
    source: asset14,
    width: 20,
    height: 20,
  },
  "home-lucide-icons-bell": {
    source: asset15,
    width: 22,
    height: 22,
  },
  "home-ellipse": {
    source: asset16,
    width: 6,
    height: 6,
  },
  "home-lucide-icons-truck": {
    source: asset17,
    width: 30,
    height: 30,
  },
  "home-lucide-icons-map-pin": {
    source: asset18,
    width: 22,
    height: 22,
  },
  "home-lucide-icons-arrow-right": {
    source: asset19,
    width: 22,
    height: 22,
  },
  "home-lucide-icons-calendar-clock": {
    source: asset20,
    width: 24,
    height: 24,
  },
  "home-lucide-icons-history": {
    source: asset21,
    width: 24,
    height: 24,
  },
  "home-lucide-icons-calculator": {
    source: asset22,
    width: 24,
    height: 24,
  },
  "home-lucide-icons-headphones": {
    source: asset23,
    width: 24,
    height: 24,
  },
  "home-lucide-icons-wallet": {
    source: asset24,
    width: 16,
    height: 16,
  },
  "home-lucide-icons-arrow-right1": {
    source: asset25,
    width: 14,
    height: 14,
  },
  "home-lucide-icons-truck1": {
    source: asset26,
    width: 20,
    height: 20,
  },
  "home-lucide-icons-house": {
    source: asset27,
    width: 22,
    height: 22,
  },
  "home-lucide-icons-truck2": {
    source: asset28,
    width: 22,
    height: 22,
  },
  "home-lucide-icons-receipt": {
    source: asset29,
    width: 22,
    height: 22,
  },
  "home-lucide-icons-user": {
    source: asset30,
    width: 22,
    height: 22,
  },
} as const;
export type FigmaIconName = keyof typeof figmaAssets;
// Preserve each exported SVG's intrinsic dimensions and downloaded artwork.
export function FigmaIcon({ name }: { name: FigmaIconName }) {
  const item = figmaAssets[name];
  return (
    <View
      pointerEvents="none"
      style={{ width: item.width, height: item.height }}
    >
      <SvgUri uri={Asset.fromModule(item.source).uri} />
    </View>
  );
}
