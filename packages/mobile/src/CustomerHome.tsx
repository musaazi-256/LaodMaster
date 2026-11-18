import { typography, metrics } from "./mobileDesign";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { money, stageLabels, terminal } from "../../contracts/src";
import type { RootStack } from "./navigation";
import { useAction, useDemo } from "./state";
import { ErrorBox, Icon } from "./ui";
import { FigmaIcon, type FigmaIconName } from "./figmaAssets";
import { customerTheme as T } from "./customerTheme";
import { WalletSheet } from "./WalletSheet";
import { HomeArtworkSlider } from "./HomeArtworkSlider";
import { PromoModal } from "./CargoUI";

export function CustomerHome() {
  const { data, error, refresh, client } = useDemo();
  const privacy = useAction();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const firstName = data?.profile.name.trim().split(/\s+/)[0] || "there";
  let greeting = "Good morning";
  let greetingEmoji = "🌅";
  if (hour >= 18 || hour < 5) {
    greeting = "Good evening";
    greetingEmoji = "🌙";
  } else if (hour >= 12) {
    greeting = "Good afternoon";
    greetingEmoji = "☀️";
  }
  const balanceHidden = hidden ?? !!data?.profile.preferences?.hideAmounts;
  const togglePrivacy = () => {
    const next = !balanceHidden;
    setHidden(next);
    void privacy.run(async () => {
      try {
        await client.request("/account/profile", {
          preferences: { hideAmounts: next },
        });
      } catch (e) {
        setHidden(!next);
        throw e;
      }
    });
  };
  const orders = data?.orders || [];
  const active = orders.find((o) => !terminal(o) && o.stage !== "scheduled");
  const scheduled = orders
    .filter((order) => order.stage === "scheduled" && order.scheduledAt)
    .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!))[0];
  const featured = active ?? scheduled;
  const due = orders.find(
    (o) => o.stage === "delivered" && o.payment.status !== "paid",
  );
  const shortcuts: {
    label: string;
    icon: FigmaIconName | "driver";
    press: () => void;
  }[] = [
    {
      label: "Schedule pickup",
      icon: "home-lucide-icons-calendar-clock",
      press: () => nav.navigate("Locations", { scheduled: true }),
    },
    {
      label: "Order again",
      icon: "home-lucide-icons-history",
      press: () => nav.navigate("OrderStart", { mode: "repeat" }),
    },
    {
      label: "Use a driver ID",
      icon: "driver",
      press: () => nav.navigate("OrderStart", { mode: "driver" }),
    },
  ];
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.page}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.greeting}>
            {greeting}, {firstName} {greetingEmoji}
          </Text>
          <Text accessibilityRole="header" style={styles.heading}>
            What are we moving today?
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View updates"
          onPress={() => nav.navigate("Notifications")}
          style={styles.bell}
        >
          <FigmaIcon name="home-lucide-icons-bell" />
        </Pressable>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void refresh()}
            tintColor={T.green}
          />
        }
      >
        <ErrorBox
          message={error || privacy.error}
          onRetry={() => void refresh()}
        />
        {due && (
          <Pressable
            accessibilityRole="button"
            onPress={() => nav.navigate("Payment", { id: due.id })}
            style={styles.paymentNotice}
          >
            <Text
              style={{
                color: "#805015",
                fontWeight: "600",
                ...typography.subhead,
              }}
            >
              Payment needs your attention · {money(due.quote.total)} →
            </Text>
          </Pressable>
        )}
        {featured && (
          <LinearGradient
            colors={["#F0FAF4", "#DCF5E7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.pill}>
              {active ? "Delivery in progress" : "Upcoming pickup"}
            </Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>
              {active
                ? stageLabels[active.stage]
                : new Date(featured.scheduledAt!).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
            </Text>
            <View style={styles.locationRow}>
              <Icon name="ellipse-outline" size={14} color={T.green} />
              <Text style={styles.detailValue}>
                Pickup: {featured.quote.pickup.name}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Icon name="location" size={14} color={T.danger} />
              <Text style={styles.detailValue}>
                Destination: {featured.quote.destination.name}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Icon name="cube-outline" size={14} color={T.green} />
              <Text style={styles.detailValue}>
                Cargo:{" "}
                {featured.cargo ||
                  featured.cargoPlan?.items[0]?.description ||
                  "General goods"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.navigate("Order", { id: featured.id })}
              style={({ pressed }) => [
                styles.trackButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.trackText}>
                {active ? "Track delivery" : "View scheduled order"}
              </Text>
            </Pressable>
          </LinearGradient>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Order a cargo truck"
          style={({ pressed }) => [styles.order, pressed && { opacity: 0.85 }]}
          onPress={() => nav.navigate("Locations")}
        >
          <View style={styles.orderIcon}>
            <FigmaIcon name="home-lucide-icons-map-pin" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.orderTitle}>Order a cargo truck</Text>
            <Text style={styles.orderSubtitle}>Set pickup and destination</Text>
          </View>
          <FigmaIcon name="home-lucide-icons-arrow-right" />
        </Pressable>
        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={item.press}
              style={({ pressed }) => [
                styles.shortcut,
                pressed && { backgroundColor: T.pale },
              ]}
            >
              {item.icon === "driver" ? (
                <Icon name="person-add-outline" size={23} color={T.green} />
              ) : (
                <FigmaIcon name={item.icon} />
              )}
              <Text style={styles.shortcutText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.wallet}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.walletLabel}>
              <FigmaIcon name="home-lucide-icons-wallet" />
              <Text style={styles.walletCaption}>Wallet balance</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balance}>
                {balanceHidden
                  ? "UGX ••••••"
                  : money(data?.adjustmentBalance || 0)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  balanceHidden ? "Show wallet balance" : "Hide wallet balance"
                }
                accessibilityState={{ selected: balanceHidden }}
                onPress={togglePrivacy}
                disabled={privacy.busy}
                hitSlop={14}
              >
                <Icon
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#475569"
                />
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setWallet(true)}
            hitSlop={12}
            style={styles.addFunds}
          >
            <Text style={styles.addFundsText}>Add funds</Text>
          </Pressable>
        </View>
        {!featured && <HomeArtworkSlider />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View loyalty rewards offer"
          onPress={() => setPromoOpen(true)}
          style={styles.promoBanner}
        >
          <View style={styles.promoIconCircle}>
            <Icon name="gift" size={20} color="white" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.promoBannerTitle}>
              Loyalty & referral rewards
            </Text>
            <Text style={styles.promoBannerSub}>
              See how to earn and use rewards.
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={T.green} />
        </Pressable>
      </ScrollView>
      <WalletSheet visible={wallet} onClose={() => setWallet(false)} />
      <PromoModal visible={promoOpen} onClose={() => setPromoOpen(false)} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailValue: { ...typography.subhead, color: T.ink, flex: 1 },
  trackButton: {
    minHeight: metrics.touch,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: T.green,
  },
  trackText: {
    ...typography.subhead,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  page: { flex: 1, backgroundColor: "white" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFFF2",
  },
  greeting: { ...typography.subhead, fontWeight: "600", color: T.muted },
  heading: {
    ...typography.section,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.5,
  },
  bell: {
    height: metrics.touch,
    width: metrics.touch,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
    backgroundColor: "white",
  },
  hero: {
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  pill: {
    ...typography.caption,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    fontWeight: "600",
    color: T.green,
  },
  heroTitle: { ...typography.section, fontWeight: "700", color: T.ink },
  order: {
    backgroundColor: T.green,
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF1F",
    alignItems: "center",
    justifyContent: "center",
  },
  orderTitle: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "600",
    color: "white",
  },
  orderSubtitle: { ...typography.caption, color: "#D0EFDF" },
  shortcuts: { flexDirection: "row", gap: 12, alignItems: "stretch" },
  shortcut: {
    flex: 1,
    minHeight: 60,
    borderWidth: 0.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 16,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  shortcutText: {
    ...typography.caption,
    color: T.ink,
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
  wallet: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderColor: T.border,
    borderRadius: 12,
    backgroundColor: "#FAFDFB",
  },
  walletLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  walletCaption: { ...typography.caption, color: T.muted },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  balance: { fontSize: 12, lineHeight: 30, fontWeight: "700", color: T.ink },
  addFunds: {
    borderRadius: 8,
    backgroundColor: T.pale,
    padding: 4,
    justifyContent: "center",
  },
  addFundsText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: "#077537",
  },
  paymentNotice: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8D5B1",
    borderRadius: 16,
    backgroundColor: "#FFF6E5",
  },
  promoBanner: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FAF4",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  promoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#087443",
    alignItems: "center",
    justifyContent: "center",
  },
  promoBannerTitle: {
    ...typography.subhead,
    fontWeight: "700",
    color: T.ink,
  },
  promoBannerSub: {
    ...typography.caption,
    color: T.muted,
  },
});
