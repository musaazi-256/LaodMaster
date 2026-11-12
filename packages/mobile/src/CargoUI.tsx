import { MobileModal } from "./MobileModal";
import { typography, metrics } from "./mobileDesign";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBox, Field, Icon } from "./ui";
import { customerTheme as T } from "./customerTheme";
import {
  CancelDriverArt,
  PromoBadgeArt,
  TruckFrontArt,
} from "./MapIllustration";

export function CargoScreen({
  title,
  subtitle,
  back,
  topHero,
  children,
  footer,
  insetTop = false,
}: {
  title: string;
  subtitle?: string;
  back?: () => void;
  topHero?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  insetTop?: boolean;
}) {
  return (
    <SafeAreaView
      edges={
        insetTop
          ? ["top", "left", "right", "bottom"]
          : ["left", "right", "bottom"]
      }
      style={{ flex: 1, backgroundColor: T.sheetBg }}
    >
      {!topHero && (
        <View style={cs.header}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={back}
              style={cs.back}
            >
              <Icon name="arrow-back" size={20} color={T.ink} />
            </Pressable>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text accessibilityRole="header" style={cs.title}>
              {title}
            </Text>
            {subtitle && <Text style={cs.muted}>{subtitle}</Text>}
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={
            topHero
              ? { paddingBottom: 28, gap: 10 }
              : { padding: 14, gap: 12, paddingBottom: 28 }
          }
        >
          {topHero ? (
            <>
              <View style={{ position: "relative" }}>
                {topHero}
                {back && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    onPress={back}
                    style={cs.floatingBack}
                  >
                    <Icon name="arrow-back" size={20} color={T.ink} />
                  </Pressable>
                )}
              </View>
              <View style={cs.sheetBody}>
                <View style={cs.sheetHandleWrap}>
                  <Text accessibilityRole="header" style={cs.sheetTitle}>
                    {title}
                  </Text>
                  {subtitle && <Text style={cs.muted}>{subtitle}</Text>}
                </View>
                <View style={{ paddingHorizontal: 20, gap: 0 }}>
                  {children}
                </View>
              </View>
            </>
          ) : (
            children
          )}
        </ScrollView>
        {footer && <View style={cs.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function CargoCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[cs.card, style]}>{children}</View>;
}

/** Continuous content section for routes, contacts and trip details. */
export function CargoSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          paddingVertical: 20,
          gap: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: T.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CargoButton({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: secondary ? "#08744322" : "#FFFFFF33" }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        cs.button,
        danger && { backgroundColor: T.danger },
        secondary &&
          !danger && {
            backgroundColor: "#F3F4F6",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          },
        secondary &&
          danger && {
            backgroundColor: T.danger,
          },
        disabled &&
          !secondary &&
          !danger && {
            backgroundColor: "#E5E7EB",
          },
        (pressed || disabled) && { opacity: disabled ? 0.65 : 0.78 },
      ]}
    >
      <Text
        style={{
          ...typography.label,
          fontWeight: "600",
          color: danger
            ? "white"
            : secondary
              ? T.ink
              : disabled
                ? "#6B7280"
                : "white",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/** Progress bar + light-green bordered vehicle box from Reference Images 1 & 2 */
export function StatusProgressBanner({
  headline,
  progress,
  statusTitle,
  statusSubtitle,
}: {
  headline: string;
  progress: number;
  statusTitle: string;
  statusSubtitle: string;
}) {
  const pct =
    `${Math.min(100, Math.max(12, Math.round(progress * 100)))}%` as const;
  return (
    <View style={{ gap: 14 }}>
      <Text style={cs.statusHeadline}>{headline}</Text>
      <View style={cs.progressTrack}>
        <View style={[cs.progressFill, { width: pct }]} />
        <View style={cs.progressEndDot} />
      </View>
      <View style={cs.vehicleStatusBox}>
        <TruckFrontArt size={62} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={cs.vehicleStatusTitle}>{statusTitle}</Text>
          <Text style={cs.vehicleStatusSub}>{statusSubtitle}</Text>
        </View>
      </View>
    </View>
  );
}

/** "Did you know?" contextual tip box from Reference Image 1 */
export function DidYouKnowBox({ text }: { text: string }) {
  return (
    <View style={cs.didYouKnowBox}>
      <View style={[cs.row, { gap: 10 }]}>
        <View style={cs.didYouKnowIcon}>
          <Icon name="chatbox-ellipses-outline" size={18} color={T.ink} />
        </View>
        <Text style={cs.didYouKnowTitle}>Did you know?</Text>
      </View>
      <Text style={cs.didYouKnowText}>{text}</Text>
    </View>
  );
}

const customerCancelReasons = [
  "Driver not getting closer",
  "Found better alternative",
  "Long pickup time",
  "Price dispute with driver",
  "Driver asked to pay outside app",
  "Driver asked to cancel",
];

const driverReleaseReasons = [
  "Pickup location inaccessible",
  "Cargo exceeds truck capacity",
  "Long loading wait time",
  "Vehicle issue / breakdown",
  "Sender unavailable at pickup",
];

/**
 * Two-step Cancellation / Release Modal matching Reference Image 5 ("Are you sure?")
 * and Reference Image 4 ("What went wrong?").
 */
export function CancelOrderModal({
  visible,
  releasing = false,
  reason,
  onChangeReason,
  onConfirm,
  onClose,
  busy = false,
  error,
}: {
  visible: boolean;
  releasing?: boolean;
  reason: string;
  onChangeReason: (r: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [step, setStep] = useState<"confirm" | "reasons">("confirm");
  const [showCustom, setShowCustom] = useState(false);
  const presets = releasing ? driverReleaseReasons : customerCancelReasons;

  const closeAll = () => {
    setStep("confirm");
    setShowCustom(false);
    onClose();
  };

  return (
    <MobileModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeAll}
    >
      <View style={cs.modalBackdrop}>
        {step === "confirm" ? (
          <View style={cs.confirmSheet}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close cancellation dialog"
              onPress={closeAll}
              style={cs.closeCircleRight}
            >
              <Icon name="close" size={18} color="#374151" />
            </Pressable>
            <View style={{ alignItems: "center", marginTop: 4 }}>
              <CancelDriverArt size={126} />
            </View>
            <Text style={cs.confirmTitle}>Are you sure?</Text>
            <Text style={cs.confirmSub}>
              {releasing
                ? "Do you really want to release this delivery? It will return to the queue for other eligible drivers."
                : "Do you really want to cancel the order? Requesting another truck may take more time."}
            </Text>
            <View style={{ width: "100%", gap: 12, marginTop: 6 }}>
              <CargoButton
                title={releasing ? "Release delivery" : "Cancel order"}
                danger
                onPress={() => setStep("reasons")}
              />
              <CargoButton
                title={releasing ? "Keep delivery" : "Wait for driver"}
                secondary
                onPress={closeAll}
              />
            </View>
          </View>
        ) : (
          <View style={cs.reasonsSheet}>
            <View style={cs.reasonsTopBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close reasons list"
                onPress={closeAll}
                style={{ padding: 6, marginLeft: -6 }}
              >
                <Icon name="close" size={26} color={T.ink} />
              </Pressable>
            </View>
            <Text style={cs.reasonsHeading}>What went wrong?</Text>
            <ScrollView
              style={{ maxHeight: 380 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {presets.map((item) => {
                const selected = reason === item && !showCustom;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityLabel={item}
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      setShowCustom(false);
                      onChangeReason(item);
                    }}
                    style={cs.reasonRow}
                  >
                    <Text style={cs.reasonLabel}>{item}</Text>
                    <View
                      style={[
                        cs.radioOuter,
                        selected && { borderColor: T.green },
                      ]}
                    >
                      {selected && <View style={cs.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Other reason"
                onPress={() => {
                  setShowCustom(true);
                  if (presets.includes(reason)) onChangeReason("");
                }}
                style={[cs.reasonRow, { borderBottomWidth: 0 }]}
              >
                <Text style={cs.reasonLabel}>Other</Text>
                <Icon name="chevron-forward" size={20} color="#6B7280" />
              </Pressable>
              {(showCustom ||
                (reason.length > 0 && !presets.includes(reason))) && (
                <View style={{ paddingVertical: 8 }}>
                  <Field
                    label={
                      releasing ? "Reason for releasing" : "Cancellation reason"
                    }
                    value={reason}
                    onChangeText={onChangeReason}
                    placeholder="Tell us what changed…"
                    multiline
                  />
                </View>
              )}
            </ScrollView>
            <ErrorBox message={error} />
            <CargoButton
              title={releasing ? "Confirm release" : "Confirm cancellation"}
              danger
              disabled={busy}
              onPress={() => {
                if (reason.trim().length < 3) {
                  onChangeReason(
                    releasing ? "Assigned another driver" : "Plans changed",
                  );
                }
                onConfirm();
              }}
            />
          </View>
        )}
      </View>
    </MobileModal>
  );
}

/** Loyalty / Promo Modal Card matching Reference Image 3 */
export function PromoModal({
  visible,
  onClose,
  title = "More value with LoadMaster",
  primaryText = "To appreciate you as one of our loyal customers, approved referral and cashback rewards are credited directly to your LoadMaster account.",
  secondaryText = "Approved rewards appear in your wallet. Choose LoadMaster Wallet at payment to use an available balance. Demo rewards do not represent a live discount offer.",
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  primaryText?: string;
  secondaryText?: string;
}) {
  return (
    <MobileModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={cs.promoBackdrop}>
        <View style={cs.promoCard}>
          <PromoBadgeArt size={92} />
          <Text style={cs.promoTitle}>{title}</Text>
          <Text style={cs.promoBody}>{primaryText}</Text>
          <Text style={cs.promoBody}>{secondaryText}</Text>
          <View style={{ width: "100%", marginTop: 6 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Got it"
              onPress={onClose}
              style={({ pressed }) => [
                cs.promoButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={cs.promoButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </MobileModal>
  );
}

export const cs = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: "#EDF0F3",
  },
  title: {
    ...typography.section,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.4,
  },
  back: {
    width: metrics.touch,
    height: metrics.touch,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBack: {
    position: "absolute",
    top: 14,
    left: 16,
    width: metrics.touch,
    height: metrics.touch,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sheetBody: {
    marginTop: -22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "white",
    overflow: "hidden",
    gap: 10,
  },
  sheetHandleWrap: {
    backgroundColor: "white",
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
    alignItems: "flex-start",
    gap: 6,
  },
  sheetHandle: {
    width: metrics.touch,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginBottom: 4,
  },
  sheetTitle: {
    ...typography.section,
    fontWeight: "700",
    color: T.ink,
    textAlign: "left",
    letterSpacing: -0.3,
  },
  muted: { ...typography.subhead, color: T.muted },
  body: { ...typography.body, color: T.ink },
  heading: {
    ...typography.section,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.3,
  },
  card: {
    padding: 18,
    gap: 12,
    backgroundColor: "white",
    borderRadius: 22,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  button: {
    backgroundColor: T.green,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderColor: "#EAECEF",
    backgroundColor: "white",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  link: { ...typography.subhead, fontWeight: "600", color: T.green },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
  },
  statusHeadline: {
    ...typography.section,

    fontWeight: "500",
    color: T.ink,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#F1F3F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    paddingRight: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22A447",
  },
  progressEndDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22A447",
  },
  vehicleStatusBox: {
    backgroundColor: T.statusBoxBg,
    borderWidth: 1,
    borderColor: T.statusBoxBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  vehicleStatusTitle: {
    ...typography.subhead,
    fontWeight: "700",
    color: T.ink,
  },
  vehicleStatusSub: {
    ...typography.subhead,
    color: T.muted,
  },
  didYouKnowBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  didYouKnowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  didYouKnowTitle: {
    ...typography.body,
    fontWeight: "700",
    color: "#22A447",
  },
  didYouKnowText: {
    ...typography.subhead,

    color: "#1F2937",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  confirmSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
    alignItems: "center",
    gap: 12,
  },
  closeCircleRight: {
    alignSelf: "flex-end",
    width: metrics.touch,
    height: metrics.touch,
    borderRadius: 17,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    ...typography.headline,
    fontWeight: "700",
    color: T.ink,
    textAlign: "center",
    marginTop: 4,
  },
  confirmSub: {
    ...typography.subhead,

    color: T.muted,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  reasonsSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    gap: 14,
  },
  reasonsTopBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  reasonsHeading: {
    ...typography.title,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  reasonLabel: {
    ...typography.body,
    color: "#111827",
    flex: 1,
    paddingRight: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.green,
  },
  promoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  promoCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "white",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  promoTitle: {
    ...typography.section,

    fontWeight: "700",
    color: T.ink,
    textAlign: "center",
    marginTop: 4,
  },
  promoBody: {
    ...typography.subhead,

    color: "#374151",
    alignSelf: "stretch",
  },
  promoButton: {
    backgroundColor: "#389B53",
    borderRadius: 999,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  promoButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: "white",
  },
});
