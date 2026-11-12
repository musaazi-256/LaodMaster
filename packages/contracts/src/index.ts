export type Role = "customer" | "driver";
export type Method =
  | "mtn"
  | "airtel"
  | "card"
  | "cash"
  | "flexipay"
  | "external_wallet"
  | "wallet";
export const paymentMethods: Method[] = [
  "mtn",
  "airtel",
  "card",
  "wallet",
  "cash",
  "flexipay",
  "external_wallet",
];
export interface PlatformPaymentMethod {
  method: Method;
  enabled: boolean;
  reason: string;
  updatedAt?: string;
  updatedBy?: string;
}
export const availablePaymentMethods = (
  data: { acceptedMethods?: Method[] } | null | undefined,
): Method[] => (data ? (data.acceptedMethods ?? paymentMethods) : []);
export type Stage =
  | "scheduled"
  | "searching"
  | "assigned"
  | "to_pickup"
  | "at_pickup"
  | "loading"
  | "in_transit"
  | "at_destination"
  | "offloading"
  | "delivered"
  | "cancelled"
  | "returning"
  | "returned";
export type PaymentStatus =
  | "not_due"
  | "awaiting_approval"
  | "processing"
  | "paid"
  | "failed"
  | "unknown";
export type Scenario =
  "success" | "declined" | "insufficient" | "timeout" | "delayed";
export interface Place {
  id: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
}
export interface Truck {
  id: string;
  name: string;
  capacity: string;
  body: string;
  maxKg: number;
  base: number;
  perKm: number;
}
export interface Profile {
  id: string;
  pairCode?: string;
  role: Role;
  name: string;
  phone: string;
  email: string;
  online?: boolean;
  verified?: boolean;
  truckId?: string;
  plate?: string;
  vehicle?: string;
  declined?: string[];
  status?: string;
  createdAt?: string;
  vehicleStatus?: string;
  documents?: {
    id: string;
    name: string;
    status: string;
    fileName?: string;
    reason?: string;
    demo?: boolean;
    content?: string;
  }[];
  paymentMethods?: {
    id: string;
    kind: Method;
    label: string;
    last4: string;
    isDefault: boolean;
  }[];
  preferences?: { notifications: boolean; hideAmounts: boolean };
}
export interface CargoItem {
  id: string;
  description: string;
  quantity: number;
  weightKg: number;
  dimensions: string;
  fragile: boolean;
  stopId: string;
}
export interface CargoContact {
  name: string;
  phone: string;
}
export interface CargoStop {
  id: string;
  place: Place;
  helpers: number;
  recipient: CargoContact;
  instructions: string;
  pinRequired: boolean;
  status?: string;
  reason?: string;
  deliveredAt?: string;
}
export interface CargoPlan {
  sender: CargoContact;
  items: CargoItem[];
  stops: CargoStop[];
  pickupInstructions: string;
  payer: "customer" | "recipient";
  pairCode?: string | null;
  externalWalletName?: string;
  termsAccepted?: boolean;
}
export interface Quote {
  id: string;
  pickup: Place;
  destination: Place;
  truckId: string;
  stops?: { id: string; place: Place; helpers: number }[];
  stopFee?: number;
  loading: number;
  offloading: number;
  transport: number;
  loadingFee: number;
  offloadingFee: number;
  total: number;
  distance: number;
  expiresAt: string;
}
export interface Attempt {
  amount?: number;
  source?: string;
  destination?: string;
  driverId?: string;
  id: string;
  method: Method;
  status: PaymentStatus;
  scenario: Scenario;
  createdAt: string;
  resolvedAt?: string;
  message?: string;
}
export interface FinancialEvent {
  id: string;
  kind: "refund" | "payout" | "guarantee";
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  source: string;
  destination: string;
}
export type DispatchStatus =
  "offered" | "accepted" | "declined" | "missed" | "withdrawn" | "released";
export interface DispatchEntry {
  driverId: string;
  status: DispatchStatus;
  offeredAt: string;
  expiresAt: string;
  respondedAt?: string;
  reason?: string;
  by?: string;
}
export interface RequestRecord extends DispatchEntry {
  orderId: string;
  pickup: string;
  destination: string;
  truckId: string;
  earning: number;
  stage: Stage;
}
export const dispatchLabels: Record<DispatchStatus, string> = {
  offered: "Awaiting your answer",
  accepted: "Accepted",
  declined: "Declined",
  missed: "Missed",
  withdrawn: "No longer available",
  released: "Released",
};
export interface Order {
  id: string;
  dispatch?: DispatchEntry[];
  /** Present on driver offers: the response window for this driver. */
  offer?: { offeredAt: string; expiresAt: string };
  customerId: string;
  driverId: string | null;
  quote: Quote;
  stage: Stage;
  rating?: number;
  review?: string;
  method: Method;
  cargo: string;
  cargoPlan?: CargoPlan;
  currentStop?: number;
  preferredDriverId?: string | null;
  demoHandoverCodes?: Record<string, string>;
  messages?: { id: string; from: string; text: string; at: string }[];
  recipientPayment?: { token: string; accepted: boolean; expires: number };
  cashDeclaration?: { amount: number; at: string };
  return?: { status: string; reason: string };
  recipient: string;
  recipientPhone: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: { stage: string; at: string; note: string }[];
  payment: {
    status: PaymentStatus;
    attempts: Attempt[];
    paidAt?: string;
    reference?: string;
    message?: string;
  };
  financial: {
    disbursed?: number;
    cash?: { gross: number; feeDue: number; remitted: number };
    rate?: number;
    fee: number;
    earning: number;
    payoutStatus: "not_earned" | "scheduled" | "paid";
    refunded: number;
    events: FinancialEvent[];
  };
  issues: {
    id: string;
    message: string;
    createdAt: string;
    status: string;
    replies?: { id: string; message: string; at: string }[];
  }[];
}
export interface Snapshot {
  acceptedMethods?: Method[];
  profile: Profile;
  people: Profile[];
  trucks: Truck[];
  places: Place[];
  orders: Order[];
  offers: Order[];
  requestHistory?: RequestRecord[];
  offerSeconds?: number;
  serverTime: string;
  feeRate: number;
  helperRate: number;
  savedPlaces?: { id: string; label: string; placeId: string }[];
  notifications?: {
    id: string;
    title: string;
    message: string;
    read: boolean;
    orderId?: string;
    createdAt: string;
  }[];
  tickets?: {
    id: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
    replies: { id: string; message: string; at: string }[];
  }[];
  payoutBalance?: { unpaid: number; reserved: number; available: number };
  withdrawals?: {
    id: string;
    amount: number;
    fee?: number;
    feePayer?: "driver" | "platform";
    netAmount?: number;
    status: string;
    reason?: string;
    method?: Method;
    destination?: string;
    provider?: string;
    reference?: string;
    approvedAt?: string;
    paidAt?: string;
    attempts?: {
      id: string;
      status: string;
      fee?: number;
      feePayer?: "driver" | "platform";
      netAmount?: number;
      reference?: string;
      message?: string;
      createdAt: string;
    }[];
    createdAt: string;
  }[];
  adjustmentBalance?: number;
  walletTopups?: {
    id: string;
    amount: number;
    method: Method;
    status: "pending" | "failed" | "completed";
    createdAt: string;
  }[];
  transfers?: {
    id: string;
    source: string;
    destination: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
  }[];
  rewards?: {
    id: string;
    kind: string;
    amount: number;
    status: string;
    reason: string;
    createdAt: string;
  }[];
}
export const stageLabels: Record<Stage, string> = {
  scheduled: "Scheduled",
  searching: "Finding a driver",
  assigned: "Driver assigned",
  to_pickup: "On the way to pickup",
  at_pickup: "Arrived at pickup",
  loading: "Loading your cargo",
  in_transit: "On the way to destination",
  at_destination: "Arrived at destination",
  offloading: "Offloading your cargo",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returning: "Returning cargo",
  returned: "Returned to sender",
};
export const methodLabels: Record<Method, string> = {
  mtn: "MTN Mobile Money",
  airtel: "Airtel Money",
  card: "Demo Visa card",
  cash: "Cash collection",
  flexipay: "FlexiPay (demo)",
  external_wallet: "External wallet (demo)",
  wallet: "LoadMaster wallet",
};
export const money = (n: number) =>
  `UGX ${Math.round(n).toLocaleString("en-UG")}`;
export const terminal = (o: Order) =>
  o.stage === "delivered" || o.stage === "cancelled" || o.stage === "returned";
