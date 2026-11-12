import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { C, Icon, type IconName } from "./ui";

/**
 * Celebratory confirmation shown after an action completes: an animated
 * badge, a short confetti burst and an optional milestone ("Your 5th
 * delivery"). Milestones are always derived from real records; nothing here
 * awards points or money.
 */
export interface Celebration {
  title: string;
  message?: string;
  icon?: IconName;
  /** e.g. "First payment method added" or "5th delivery completed". */
  milestone?: string;
  /** "gold" for bigger moments such as a completed delivery. */
  tone?: "green" | "gold";
  cta?: string;
}
const Context = createContext<(c: Celebration) => void>(() => {});
export const useCelebrate = () => useContext(Context);

const tones = {
  green: { ring: "#DCF5E7", fill: C.green, pill: "#EEF7F2", pillText: C.green },
  gold: {
    ring: "#FEF3C7",
    fill: "#D97706",
    pill: "#FFFBEB",
    pillText: "#92400E",
  },
};
const confettiColors = [
  "#087443",
  "#34D399",
  "#FBBF24",
  "#3B82F6",
  "#F472B6",
  "#A3E635",
];
const PIECES = 22;

export function CelebrationHost({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Celebration | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub?.remove();
  }, []);
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(null);
  }, []);
  const celebrate = useCallback((c: Celebration) => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(c);
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
    AccessibilityInfo.announceForAccessibility?.(
      c.title + (c.message ? ". " + c.message : ""),
    );
    // Long enough to read; Continue or the backdrop closes it sooner.
    timer.current = setTimeout(
      () => setCurrent(null),
      c.milestone ? 5000 : 4000,
    );
  }, []);
  return (
    <Context.Provider value={celebrate}>
      {children}
      <Modal
        transparent
        visible={!!current}
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        {current && (
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close confirmation"
            />
            <Card c={current} reduceMotion={reduceMotion} onClose={close} />
          </View>
        )}
      </Modal>
    </Context.Provider>
  );
}

function Card({
  c,
  reduceMotion,
  onClose,
}: {
  c: Celebration;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const tone = tones[c.tone || "green"];
  const pop = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const rise = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: (Math.random() - 0.5) * 300,
        y: 120 + Math.random() * 180,
        spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
        size: 6 + Math.random() * 6,
        round: i % 3 === 0,
        color: confettiColors[i % confettiColors.length],
        delay: Math.random() * 0.15,
      })),
    [],
  );
  useEffect(() => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.timing(rise, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 140,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(burst, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, pop, rise, burst]);
  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: rise,
          transform: [
            {
              translateY: rise.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityViewIsModal
    >
      {!reduceMotion && (
        <View pointerEvents="none" style={styles.confetti}>
          {pieces.map((p, i) => {
            const t = burst.interpolate({
              inputRange: [0, p.delay, 1],
              outputRange: [0, 0, 1],
            });
            return (
              <Animated.View
                key={i}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.round ? p.size : p.size * 0.45,
                  borderRadius: p.round ? p.size : 2,
                  backgroundColor: p.color,
                  opacity: burst.interpolate({
                    inputRange: [0, 0.75, 1],
                    outputRange: [1, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: t.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, p.x],
                      }),
                    },
                    {
                      translateY: t.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [0, -p.y * 0.45, p.y * 0.55],
                      }),
                    },
                    {
                      rotate: t.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", p.spin + "deg"],
                      }),
                    },
                  ],
                }}
              />
            );
          })}
        </View>
      )}
      <Animated.View
        style={[
          styles.badgeRing,
          { backgroundColor: tone.ring, transform: [{ scale: pop }] },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: tone.fill }]}>
          <Icon name={c.icon || "checkmark"} size={34} color="white" />
        </View>
      </Animated.View>
      <Text style={styles.title} accessibilityRole="header">
        {c.title}
      </Text>
      {!!c.message && <Text style={styles.message}>{c.message}</Text>}
      {!!c.milestone && (
        <View style={[styles.pill, { backgroundColor: tone.pill }]}>
          <Icon name="trophy" size={14} color={tone.pillText} />
          <Text style={[styles.pillText, { color: tone.pillText }]}>
            {c.milestone}
          </Text>
        </View>
      )}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.ctaText}>{c.cta || "Continue"}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** "1st", "2nd", "3rd", "4th", "11th", "21st"… */
export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
/** Milestone label for a running count, only at memorable numbers. */
export const milestoneFor = (count: number, noun: string) =>
  count === 1
    ? "Your first " + noun
    : [5, 10, 25, 50, 100, 250, 500].includes(count)
      ? "Your " + ordinal(count) + " " + noun
      : undefined;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    paddingTop: 30,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    overflow: "visible",
  },
  confetti: {
    position: "absolute",
    top: 70,
    left: "50%",
    width: 0,
    height: 0,
  },
  badgeRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: C.ink,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: C.muted,
    textAlign: "center",
    marginTop: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  pillText: { fontSize: 13, fontWeight: "700" },
  cta: {
    alignSelf: "stretch",
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
});
