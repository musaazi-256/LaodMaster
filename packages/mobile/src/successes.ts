import { money, type Order, type Snapshot } from "../../contracts/src";
import { milestoneFor, ordinal, type Celebration } from "./celebrate";

/**
 * Success messages for completed actions. Milestones count real records in
 * the snapshot taken before the action (+1 for the one just completed).
 */
const mine = (data: Snapshot | null, account: string) =>
  (data?.orders || []).filter(
    (o) => o.customerId === account || o.driverId === account,
  );

export const success = {
  paymentMethodAdded: (
    data: Snapshot | null,
    label: string,
    last4: string,
  ): Celebration => ({
    title: "Payment method added",
    message: `${label || "Your method"} •••• ${last4} is ready for your next order.`,
    icon: "card",
    milestone: data?.profile?.paymentMethods?.length
      ? undefined
      : "First payment method added",
  }),
  walletTopUp: (
    data: Snapshot | null,
    result: { status: string; amount: number },
  ): Celebration | undefined =>
    result.status === "completed"
      ? {
          title: money(result.amount) + " added",
          message: "Your wallet is topped up and ready to pay for deliveries.",
          icon: "wallet",
          milestone: milestoneFor(
            (data?.walletTopups || []).filter((t) => t.status === "completed")
              .length + 1,
            "wallet top-up",
          ),
        }
      : undefined,
  orderPlaced: (
    data: Snapshot | null,
    account: string,
    o?: Order,
  ): Celebration | undefined =>
    o
      ? {
          title: o.stage === "scheduled" ? "Pickup scheduled" : "Order placed",
          message:
            o.stage === "scheduled"
              ? `${o.id} is booked. We’ll start finding a driver before pickup.`
              : `We’re finding a driver for ${o.id} now.`,
          icon: "cube",
          milestone: milestoneFor(
            mine(data, account).filter((x) => x.customerId === account).length +
              1,
            "LoadMaster order",
          ),
          cta: "Track my order",
        }
      : undefined,
  payment: (
    data: Snapshot | null,
    account: string,
    o: Order,
  ): Celebration | undefined =>
    o?.payment?.status === "paid"
      ? {
          title: "Payment confirmed",
          message: `${money(o.quote.total)} paid for ${o.id}. Your receipt is ready.`,
          icon: "shield-checkmark",
          milestone: milestoneFor(
            mine(data, account).filter(
              (x) => x.customerId === account && x.payment.status === "paid",
            ).length + 1,
            "paid delivery",
          ),
          cta: "View receipt",
        }
      : undefined,
  rated: (rating: number): Celebration => ({
    title: "Thanks for your rating",
    message:
      rating >= 4
        ? "Great feedback helps good drivers get more work."
        : "We’ll use your feedback to improve the next delivery.",
    icon: "star",
    tone: rating === 5 ? "gold" : "green",
    milestone: rating === 5 ? "You rated this delivery 5 stars" : undefined,
  }),
  accepted: (o: Order): Celebration => ({
    title: "Delivery accepted",
    message: `Head to ${o.quote.pickup.name} to collect the cargo.`,
    icon: "navigate",
    cta: "Start trip",
  }),
  advanced: (
    data: Snapshot | null,
    account: string,
    requested: string,
    o: Order,
  ): Celebration | undefined => {
    if (o.stage === "delivered") {
      const done =
        mine(data, account).filter(
          (x) =>
            x.driverId === account &&
            ["delivered", "returned"].includes(x.stage),
        ).length + 1;
      return {
        title: "Delivery complete",
        message: o.financial?.earning
          ? `Nice work. ${money(o.financial.earning)} is added to your earnings.`
          : "Nice work. The customer has been notified.",
        icon: "flag",
        tone: "gold",
        milestone:
          milestoneFor(done, "delivery") ||
          ordinal(done) + " delivery completed",
      };
    }
    if (requested === "delivered" && o.cargoPlan) {
      const n = o.cargoPlan.stops.filter(
        (s) => s.status === "delivered",
      ).length;
      return {
        title: `Stop ${n} delivered`,
        message: `${o.cargoPlan.stops.length - n} stop(s) to go.`,
        icon: "checkmark-done",
      };
    }
    return undefined;
  },
  cashRecorded: (amount: number): Celebration => ({
    title: "Cash recorded",
    message: `${money(amount)} noted. The customer will confirm the handover.`,
    icon: "cash",
  }),
  payoutRequested: (result: { amount?: number }): Celebration => ({
    title: "Payout requested",
    message: result?.amount
      ? `${money(result.amount)} is on its way for review.`
      : "Your request is with the finance team.",
    icon: "wallet",
    tone: "gold",
  }),
  documentUploaded: (data: Snapshot | null, name: string): Celebration => {
    const docs = data?.profile?.documents || [];
    const left = 4 - new Set([...docs.map((d) => d.name), name]).size;
    return {
      title: name + " uploaded",
      message:
        left > 0
          ? `${left} more document(s) and you’re ready for review.`
          : "All four documents are in. We’ll review them shortly.",
      icon: "document-text",
      milestone: left <= 0 ? "Verification pack complete" : undefined,
    };
  },
  vehicleSubmitted: (): Celebration => ({
    title: "Vehicle submitted",
    message: "Operations will review it with your documents.",
    icon: "car",
  }),
  placeSaved: (label: string): Celebration => ({
    title: "Place saved",
    message: `“${label}” is now one tap away when you order.`,
    icon: "bookmark",
  }),
  supportSent: (issue: boolean): Celebration => ({
    title: issue ? "Issue reported" : "Request sent",
    message: "Our support team will reply in your Updates.",
    icon: "chatbubbles",
  }),
  profileSaved: (): Celebration => ({
    title: "Profile updated",
    icon: "person",
  }),
  passwordUpdated: (): Celebration => ({
    title: "Password updated",
    message: "You’re signed in on this device. Other sessions were signed out.",
    icon: "lock-closed",
  }),
};
