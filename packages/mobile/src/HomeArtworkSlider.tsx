import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { customerTheme as T } from "./customerTheme";
import { Icon } from "./ui";
import cargo from "../assets/home/everyday-cargo.webp";
import moving from "../assets/home/household-move.webp";
import business from "../assets/home/business-delivery.webp";
const slides = [
  {
    id: "cargo",
    label: "Everyday cargo",
    title: "A truck for\nevery load",
    description: "From pickup to delivery,\nkeep every load in sight.",
    image: cargo,
  },
  {
    id: "moving",
    label: "Household moves",
    title: "Moving home?\nWe’ll carry it.",
    description: "Furniture, boxes and\nyour next fresh start.",
    image: moving,
  },
  {
    id: "business",
    label: "Business deliveries",
    title: "Keep your\nstock moving",
    description: "Cargo transport for\nyour everyday business.",
    image: business,
  },
];
export function HomeArtworkSlider() {
  const { fontScale } = useWindowDimensions();
  const slideHeight = Math.max(260, 240 * fontScale);
  const track = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const target = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (live) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  const show = (index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    target.current = next;
    setCurrent(next);
    track.current?.scrollTo({ x: next * width, animated: !reduceMotion });
  };
  return (
    <View
      style={s.frame}
      accessibilityLabel="LoadMaster cargo services"
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width;
        setWidth(next);
        track.current?.scrollTo({ x: current * next, animated: false });
      }}
    >
      <ScrollView
        ref={track}
        horizontal
        style={{ height: slideHeight, flexGrow: 0 }}
        contentContainerStyle={{ width: width * slides.length }}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
        bounces={false}
        scrollEventThrottle={32}
        onTouchStart={() => {
          target.current = null;
        }}
        onScroll={(e) => {
          if (!width) return;
          const x = e.nativeEvent.contentOffset.x;
          if (
            target.current !== null &&
            Math.abs(x - target.current * width) > 2
          )
            return;
          target.current = null;
          setCurrent(
            Math.max(0, Math.min(slides.length - 1, Math.round(x / width))),
          );
        }}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={{
              width,
              height: slideHeight,
              flexShrink: 0,
              overflow: "hidden",
            }}
            accessibilityElementsHidden={index !== current}
            importantForAccessibility={
              index === current ? "auto" : "no-hide-descendants"
            }
          >
            <Image
              source={slide.image}
              resizeMode="cover"
              style={[
                StyleSheet.absoluteFill,
                { width: "100%", height: "100%" },
              ]}
              accessible={false}
            />
            <LinearGradient
              colors={["#EFF9F0F5", "#EFF9F0CC", "#EFF9F000"]}
              locations={[0, 0.38, 0.8]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.copy}>
              <Text
                accessibilityRole="header"
                accessibilityHint={slide.description.replace("\n", " ")}
                style={s.title}
              >
                {slide.title}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={s.controls} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous artwork"
          accessibilityState={{ disabled: current === 0 }}
          disabled={current === 0}
          onPress={() => show(current - 1)}
          style={s.arrowHit}
        >
          <View style={[s.arrow, current === 0 && { opacity: 0.35 }]}>
            <Icon name="chevron-back" size={12} color={T.green} />
          </View>
        </Pressable>
        <View style={s.dots}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.id}
              accessibilityRole="button"
              accessibilityLabel={`Show artwork ${i + 1}: ${slide.label}`}
              accessibilityState={{ selected: current === i }}
              aria-pressed={current === i}
              onPress={() => show(i)}
              hitSlop={{ top: 7, bottom: 7 }}
              style={s.dotButton}
            >
              <View style={[s.indicator, current === i && s.selected]} />
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next artwork"
          accessibilityState={{ disabled: current === slides.length - 1 }}
          disabled={current === slides.length - 1}
          onPress={() => show(current + 1)}
          style={s.arrowHit}
        >
          <View
            style={[
              s.arrow,
              current === slides.length - 1 && { opacity: 0.35 },
            ]}
          >
            <Icon name="chevron-forward" size={12} color={T.green} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  frame: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: T.pale,
    borderWidth: 1,
    borderColor: "#DCF5E7",
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
    maxWidth: "64%",
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: "#123D30",
  },
  controls: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFFDE",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    backgroundColor: "#F5FCF6E6",
    borderRadius: 22,
  },
  dotButton: {
    width: 41,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#819B8B",
  },
  selected: { width: 19, backgroundColor: T.green },
});
