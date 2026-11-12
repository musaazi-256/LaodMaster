import truckImage from "../assets/figma/order-small-truck-back-side1.png";
import { typography, metrics } from "./mobileDesign";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
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
  const due = orders.find(
    (o) => o.stage === "delivered" && o.payment.status !== "paid",
  );
  const recent = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);
  const shortcuts: { label: string; icon: FigmaIconName; press: () => void }[] =
    [
      {
        label: "Schedule\npickup",
        icon: "home-lucide-icons-calendar-clock",
        press: () => nav.navigate("Locations", { scheduled: true }),
      },
      {
        label: "Order again",
        icon: "home-lucide-icons-history",
        press: () => nav.navigate("OrderStart", { mode: "repeat" }),
      },
      {
        label: "Choose\na truck",
        icon: "home-lucide-icons-truck",
        press: () => nav.navigate("OrderStart", { mode: "truck" }),
      },
      {
        label: "Match a\ndriver",
        icon: "home-lucide-icons-map-pin",
        press: () => nav.navigate("OrderStart", { mode: "driver" }),
      },
    ];
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.page}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              ...typography.label,
              fontWeight: "700",
              letterSpacing: -0.5,
              color: T.brandGreen,
            }}
          >
            LoadMaster
          </Text>
          <Text style={styles.greeting}>
            Hello, {data?.profile.name.split(" ")[0] || "there"} 👋
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 80 : 24 },
        ]}
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
        {active ? (
          <LinearGradient
            colors={["#F0FAF4", "#DCF5E7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroMain}>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.pill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.pillText}>Delivery in progress</Text>
                </View>
                <Text style={styles.heroTitle}>
                  {stageLabels[active.stage]}
                  {active.stage === "searching" ? "…" : ""}
                </Text>
                <View style={styles.locationRow}>
                  <Icon name="ellipse-outline" size={13} color={T.green} />
                  <Text style={styles.locationName}>
                    {active.quote.pickup.name}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Icon name="location" size={14} color={T.danger} />
                  <Text style={styles.locationName}>
                    {active.quote.destination.name}
                  </Text>
                </View>
              </View>
              <Image
                source={truckImage}
                resizeMode="contain"
                style={styles.truckImage}
              />
            </View>
            <View style={styles.tripFooter}>
              <Icon name="time-outline" size={18} color={T.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCaption}>Pickup</Text>
                <Text style={styles.detailValue}>
                  {active.stage === "searching"
                    ? "Awaiting driver"
                    : stageLabels[active.stage]}
                </Text>
              </View>
              <Icon name="cube-outline" size={18} color={T.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCaption}>Cargo</Text>
                <Text numberOfLines={1} style={styles.detailValue}>
                  {active.cargo ||
                    active.cargoPlan?.items[0]?.description ||
                    "General goods"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Track active delivery"
                onPress={() => nav.navigate("Order", { id: active.id })}
                style={styles.trackButton}
              >
                <Text style={styles.trackText}>Track delivery →</Text>
              </Pressable>
            </View>
          </LinearGradient>
        ) : (
          <HomeArtworkSlider />
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
              accessibilityLabel={item.label.replace("\n", " ")}
              onPress={item.press}
              style={({ pressed }) => [
                styles.shortcut,
                pressed && { backgroundColor: T.pale },
              ]}
            >
              {item.label.replace("\n", " ") === "Match a driver" ? (
                <Icon name="person-add-outline" size={23} color={T.green} />
              ) : (
                <FigmaIcon name={item.icon} />
              )}
              <Text style={styles.shortcutText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.wallet}>
          <View style={styles.walletLabel}>
            <FigmaIcon name="home-lucide-icons-wallet" />
            <Text style={styles.walletCaption}>Wallet balance</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                balanceHidden ? "Show wallet balance" : "Hide wallet balance"
              }
              accessibilityState={{ selected: balanceHidden }}
              onPress={togglePrivacy}
              disabled={privacy.busy}
              hitSlop={6}
              style={styles.eye}
            >
              {balanceHidden ? (
                <Icon name="eye-off-outline" size={20} color={T.muted} />
              ) : (
                <FigmaIcon name="home-frame" />
              )}
            </Pressable>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>
              {balanceHidden
                ? "UGX ••••••"
                : money(data?.adjustmentBalance || 0)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setWallet(true)}
              hitSlop={4}
              style={styles.addFunds}
            >
              <Text style={styles.link}>Add funds</Text>
            </Pressable>
          </View>
        </View>
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
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all orders"
            onPress={() => nav.navigate("Main", { screen: "Orders" })}
            hitSlop={6}
            style={styles.viewAll}
          >
            <Text style={styles.link}>View all</Text>
            <FigmaIcon name="home-lucide-icons-arrow-right1" />
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          {recent.length ? (
            recent.map((o) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View order ${o.id}`}
                key={o.id}
                style={styles.activity}
                onPress={() => nav.navigate("Order", { id: o.id })}
              >
                <View style={styles.activityIcon}>
                  <FigmaIcon name="home-lucide-icons-truck1" />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text numberOfLines={1} style={styles.route}>
                    {o.quote.pickup.name} → {o.quote.destination.name}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(o.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.status,
                    o.stage !== "delivered" && { backgroundColor: "#F1F5F9" },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {o.stage === "delivered"
                      ? "Completed"
                      : stageLabels[o.stage]}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.route}>Your first move starts here</Text>
              <Text style={styles.date}>
                Your orders and delivery updates will appear here.
              </Text>
            </View>
          )}
        </View>
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
              Tap to view how rewards apply to your next moves
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
  heroMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  truckImage: { width: 112, height: 100 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  locationName: { ...typography.caption, color: T.ink, flex: 1 },
  tripFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DCECE1",
    paddingTop: 10,
  },
  detailCaption: { fontSize: 10, lineHeight: 14, color: T.muted },
  detailValue: { ...typography.caption, fontWeight: "600", color: T.ink },
  trackButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#D9F2DF",
  },
  trackText: { ...typography.caption, fontWeight: "600", color: T.green },
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
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
  },
  pillText: { ...typography.caption, fontWeight: "600", color: T.green },
  heroTitle: { ...typography.section, fontWeight: "700", color: T.ink },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroDescription: {
    ...typography.subhead,

    color: "#1A5837",
    flex: 1,
  },
  heroTruck: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFFFFF99",
    alignItems: "center",
    justifyContent: "center",
  },
  order: {
    backgroundColor: T.green,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
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
  orderTitle: { ...typography.label, fontWeight: "600", color: "white" },
  orderSubtitle: { ...typography.caption, color: "#D0EFDF" },
  shortcuts: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  shortcut: {
    flex: 1,
    minHeight: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 10,
    gap: 6,
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
    padding: 14,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    borderRadius: 18,
    backgroundColor: "#FAFDFB",
  },
  walletLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  walletCaption: { ...typography.caption, color: T.muted, flex: 1 },
  eye: {
    width: metrics.touch,
    height: metrics.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  balance: { ...typography.headline, fontWeight: "700", color: T.ink },
  addFunds: {
    borderRadius: 30,
    backgroundColor: T.pale,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: metrics.touch,
    justifyContent: "center",
  },
  link: { ...typography.caption, fontWeight: "600", color: "#077537" },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -8,
  },
  activityTitle: { ...typography.body, fontWeight: "600", color: T.ink },
  viewAll: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
    minHeight: metrics.touch,
  },
  activity: {
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  activityIcon: {
    width: metrics.touch,
    height: 36,
    backgroundColor: T.pale,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  route: { ...typography.subhead, fontWeight: "600", color: T.ink },
  date: { ...typography.caption, color: T.muted },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    maxWidth: 100,
  },
  statusText: { ...typography.caption, fontWeight: "600", color: "#077537" },
  empty: {
    paddingVertical: 12,
    gap: 6,
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
