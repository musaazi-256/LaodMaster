import type { Quote } from "../../contracts/src";
export type RootStack = {
  Main: { screen: "Home" | "Orders" | "Payments" | "Account" } | undefined;
  OrderStart: { mode: "repeat" | "truck" | "driver" };
  Vehicle: undefined;
  PaymentMethods: undefined;
  SavedPlaces: undefined;
  Notifications: undefined;
  Preferences: undefined;
  Password: undefined;
  PayoutRequests: undefined;
  Rewards: undefined;
  SupportCases: undefined;
  RequestHistory: undefined;
  Locations:
    | {
        repeatId?: string;
        scheduled?: boolean;
        estimateOnly?: boolean;
        truckId?: string;
        pairCode?: string;
      }
    | undefined;
  ChooseTruck: {
    truckId?: string;
    pairCode?: string;
    pickupId: string;
    destinationId: string;
    scheduledAt?: string;
    repeatId?: string;
  };
  Order: { id: string };
  OrderChat: { id: string };
  Offer: { id: string };
  Payment: { id: string };
  Handling: { loading: number; offloading: number };
  Settings: undefined;
  Profile: undefined;
  Support: { orderId?: string } | undefined;
  Verification: undefined;
  Help: undefined;
};
export type Draft = {
  quote: Quote;
  cargo: string;
  recipient: string;
  recipientPhone: string;
};
