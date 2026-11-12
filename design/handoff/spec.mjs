// LoadMaster V2 developer handoff spec.
//
// Source of truth for the "LoadMaster Handoff Generator" Figma plugin. Every
// screen, copy string, API call and cross-app effect here is taken from the
// code in apps/, packages/ and services/demo. `npm run handoff` validates this
// file against the code and rebuilds the plugin bundle, so drift fails loudly.
//
// Block types are rendered by design/handoff/plugin/code.template.ts.

const FARE = "UGX 41,500";
const EARN = "UGX 35,275";
const ROUTE = ["Ntinda Shopping Centre", "Nakawa Market"];
const ORDER = "LM-7F3A21C9";

// ---------- small builders ----------
const eyebrow = (text) => ({ t: "eyebrow", text });
const title = (text) => ({ t: "title", text });
const body = (text, muted = false) => ({ t: "body", text, muted });
const btn = (text, v = "primary") => ({ t: "btn", text, v });
const field = (label, value = "", ph = "") => ({ t: "field", label, value, ph });
const badge = (text, tone = "green") => ({ t: "badge", text, tone });
const card = (o) => ({ t: "card", ...o });
const banner = (text, tone = "amber") => ({ t: "banner", text, tone });
const empty = (t, b) => ({ t: "empty", title: t, body: b });
const map = (o = {}) => ({ t: "map", h: 200, route: true, ...o });
const routeCard = () =>
  card({ label: "ROUTE", lines: [`● ${ROUTE[0]}`, `◎ ${ROUTE[1]}`, "≈ 3 km · Pickup"] });
const steps = (now) => {
  const all = [
    ["Driver assigned", "assigned"],
    ["On the way to pickup", "to_pickup"],
    ["Arrived at pickup", "at_pickup"],
    ["Loading your cargo", "loading"],
    ["On the way to destination", "in_transit"],
    ["Arrived at destination", "at_destination"],
    ["Offloading your cargo", "offloading"],
    ["Delivered", "delivered"],
  ];
  const i = all.findIndex((s) => s[1] === now);
  return {
    t: "steps",
    items: all.map(([l], j) => [l, j < i ? "done" : j === i ? "now" : "todo"]),
  };
};
const sheet = (titleText, bodyText, blocks) => ({
  t: "sheet",
  title: titleText,
  body: bodyText,
  blocks,
});
const act = (does, api, effect, affects = []) => ({ does, api, effect, affects });
const hit = (app, screen, what) => ({ app, screen, what });

// ---------- shared auth (both mobile apps) ----------
const auth = (role) => {
  const p = role === "customer" ? "c" : "d";
  const who = role === "customer" ? "alex@example.test" : "brian@example.test";
  return [
    {
      id: `${p}-signin`,
      name: "Sign in",
      route: "Auth",
      purpose: `Entry point when no secure session token exists for the ${role} role.`,
      blocks: [
        { t: "brand" },
        eyebrow("YOUR NEXT MOVE STARTS HERE"),
        title(role === "customer" ? "Good work.\nGreat journeys." : "Good work.\nGreat journeys."),
        badge(role === "customer" ? "CUSTOMER" : "DRIVER", "neutral"),
        field("Phone or email", who),
        field("Password", "••••••••••••••"),
        btn("Sign in"),
        btn("Explore with a demo account", "secondary"),
        { t: "link", text: "Forgot password?" },
        { t: "link", text: "Create an account" },
        body("Prototype environment. Use synthetic details; no real payments or identity verification take place.", true),
      ],
      actions: [
        act("Sign in", "POST /auth/login", "Returns a session token, stored in SecureStore (web: AsyncStorage). Unverified phones or forced resets return a challenge and open Verify."),
        act("Explore with a demo account", "—", "Signs in with a discoverable demo-<id> token for local testing."),
      ],
      states: ["Credentials invalid · CREDENTIALS_INVALID (401)", "Account restricted · ACCOUNT_RESTRICTED (403)", "Service unreachable banner with service URL field"],
    },
    {
      id: `${p}-register`,
      name: "Create account",
      route: "Auth",
      purpose: "Self-registration. Customers are verified on creation; drivers still need vehicle and document approval.",
      blocks: [
        { t: "brand" },
        title("Make your\nfirst move."),
        field("Full name", role === "customer" ? "Alex Mukasa" : "Brian Kato"),
        field("Phone number", "+256 700 000 111"),
        field("Email (optional)", ""),
        field("Password", "••••••••"),
        btn("Create account"),
        { t: "link", text: "I already have an account" },
      ],
      actions: [act("Create account", "POST /auth/register", "Creates the profile and an OTP challenge; opens Verify with the demo code 246810.", [hit("admin", role === "customer" ? "a-customers" : "a-drivers", "New account appears in the list.")])],
      states: ["Phone already used · ACCOUNT_EXISTS", "Password under 8 characters · PASSWORD_WEAK"],
    },
    {
      id: `${p}-verify`,
      name: "Verify code",
      route: "Auth",
      purpose: "One-time-code step for registration, first login and password reset.",
      blocks: [
        { t: "brand" },
        title("A quick check.\nThen you’re in."),
        banner("DEMO CODE: 246810", "green"),
        { t: "otp", value: "246810" },
        field("New password (reset only)", "••••••••"),
        btn("Verify and continue"),
        btn("Resend demo code", "secondary"),
      ],
      actions: [
        act("Verify", "POST /auth/verify", "Creates a session. Reset/first-login also changes the password and revokes old sessions."),
        act("Resend", "POST /auth/resend", "30 second cooldown · RESEND_COOLDOWN."),
      ],
      states: ["Wrong code · CODE_INCORRECT", "Expired or 5 attempts used · CODE_EXPIRED"],
    },
    {
      id: `${p}-recover`,
      name: "Forgot password",
      route: "Auth",
      purpose: "Starts a reset without revealing whether the account exists.",
      blocks: [{ t: "brand" }, title("Let’s get you\nback in."), field("Phone or email", who), btn("Send reset code"), { t: "link", text: "Back to sign in" }],
      actions: [act("Send reset code", "POST /auth/recover", "Always succeeds; opens Verify. Email matches by email only, phones need ≥ 9 digits.")],
    },
  ];
};

// ---------- current cargo design (CargoUI, CargoOrderWizard, CargoDelivery, CargoPayment) ----------
const CARGO = "cargo"; // screens rendered with customerTheme tokens
const STOPS = ["Nakawa Market", "Acacia Mall"];
const TOTAL = "UGX 53,000";
const EARNING = "UGX 45,050";
const hdr = (title, sub, extra = {}) => ({ t: "nav", title, sub, ...extra });
const ghost = (text) => ({ t: "btn", text, v: "ghost" });
const stopCard = (n, place, extra = {}) =>
  card({ heading: `Stop ${n} · ${place}`, ...extra });

const customer = [
  { section: "Authentication", screens: auth("customer") },
  {
    section: "Home",
    screens: [
      {
        id: "c-home",
        name: "Home",
        route: "Main/Home",
        tab: "Home",
        theme: CARGO,
        purpose: "Customer landing screen (CustomerHome). Starts an order, quick actions, wallet and recent activity.",
        blocks: [
          { t: "greet2", brand: "LoadMaster", hello: "Hello, Alex 👋", title: "What are we moving today?" },
          { t: "carousel", pill: "Everyday cargo", title: "A truck for\nevery load", body: "From pickup to delivery,\nkeep every load in sight." },
          { t: "ctabar", title: "Order a cargo truck", sub: "Set pickup and destination", icon: "pin" },
          { t: "tiles", items: ["Schedule\npickup", "Order again", "Choose\na truck", "Match a\ndriver"] },
          { t: "wallet", label: "Wallet balance", value: "UGX 0", cta: "Add funds" },
          { t: "section", text: "Recent activity", link: "View all →" },
          empty("Your first move starts here", "Your orders and delivery updates will appear here."),
        ],
        actions: [
          act("Order a cargo truck", "—", "Opens the 4-step order wizard (ChooseTruck → CargoOrderWizard)."),
          act("Schedule pickup / Estimate price", "—", "Same wizard with scheduled or estimate-only mode."),
          act("Show / hide wallet balance", "POST /account/profile", "Stores preferences.hideAmounts."),
        ],
      },
      {
        id: "c-home-active",
        name: "Home · delivery in progress",
        route: "Main/Home",
        tab: "Home",
        theme: CARGO,
        purpose: "Home while an order is active. Refreshes every 2 s from GET /snapshot.",
        blocks: [
          { t: "greet2", hello: "Hello, Alex 👋", title: "What are we moving today?" },
          { t: "promo", pill: "Your delivery is in progress", title: "On the way to pickup", body: "Brian Kato · Isuzu Forward · UBB 920 B" },
          { t: "ctabar", title: "Track active delivery →", sub: "LM-1EA1A628 · 2 stops" },
          banner("Payment needs your attention · LM-22B8E004", "amber"),
          { t: "wallet", label: "Wallet balance", value: "UGX ••••••", cta: "Add funds" },
          { t: "section", text: "Recent activity", link: "View all →" },
          { t: "list", items: [{ title: "LM-1EA1A628", sub: `${ROUTE[0]} → ${STOPS[1]}`, badge: "ON THE WAY", tone: "green" }] },
        ],
        notes: ["Driver stage changes made in the Driver app appear here within one poll (≈2 s)."],
      },
      {
        id: "c-wallet",
        name: "Wallet · add funds",
        route: "Main/Home (WalletSheet)",
        tab: "Home",
        theme: CARGO,
        purpose: "Simulated wallet top-up, kept separate from order payments.",
        blocks: [
          { t: "greet2", hello: "Hello, Alex 👋", title: "What are we moving today?" },
          sheet("Add funds", "Demo payments only. No real money is collected. Your wallet balance and order payments are shown separately.", [
            field("Amount (UGX)", "50,000"),
            { t: "radio", items: [["MTN Mobile Money", "Demo MTN account · 0111"], ["Airtel Money", ""], ["Demo Visa card", "•••• 4242"]], sel: 0 },
            { t: "chips", label: "Demo outcome", items: ["Success", "Pending", "Failed"], sel: 0 },
            btn("Add funds"),
          ]),
        ],
        states: ["Pending · “Confirmation is pending. Check its status before trying again.”", "Amount outside 1–1,000,000 UGX"],
      },
    ],
  },
  {
    section: "Order a truck · 4-step wizard",
    screens: [
      {
        id: "c-locations",
        name: "Choose destination",
        route: "Locations",
        theme: CARGO,
        purpose: "Place picker for pickup and each stop: search, map pick, device location or demo places.",
        blocks: [
          hdr("Choose destination", null, { close: true }),
          field("", "", "Search a place or area"),
          ghost("Choose on map"),
          ghost("⌖  Use my current location"),
          { t: "list", plain: true, items: [
            { title: "Ntinda Shopping Centre", sub: "Ntinda · Kampala" },
            { title: "Nakawa Market", sub: "Nakawa · Kampala" },
            { title: "Acacia Mall", sub: "Kisementi · Kololo" },
            { title: "Kampala Road", sub: "City Centre · Kampala" },
            { title: "Najjeera Trading Centre", sub: "Najjeera · Wakiso" },
          ] },
          body("Choose the cargo location. Device search and location access depend on permission and the demo service area.", true),
        ],
        actions: [act("Use my current location", "POST /account/location", "Saves a place private to this account (outside the Kampala demo area → OUTSIDE_SERVICE_AREA).")],
        states: ["Location permission denied", "Same pickup and destination", "No matching place"],
      },
      {
        id: "c-wiz-truck",
        name: "1 · Truck & destinations",
        route: "ChooseTruck (CargoOrderWizard step 1)",
        theme: CARGO,
        tag: "New",
        purpose: "Pick truck, pickup loading helpers and up to five delivery stops with per-stop offloading.",
        blocks: [
          hdr("Truck & destinations", "Step 1 of 4 · Order a truck"),
          card({ heading: "Your route", lines: ["◉  " + ROUTE[0], "◎  " + STOPS[0], "◎  " + STOPS[1]], cta: "Edit" }),
          { t: "h", text: "Choose your truck" },
          { t: "radio", items: [["Pickup", "Up to 1 tonne · Open bed · everyday cargo"], ["Medium truck", "Up to 3 tonnes · Covered · furniture & stock"], ["Large truck", "Up to 7 tonnes · Covered · bulk cargo"]], sel: 0 },
          { t: "counter", label: "At pickup", value: 1 },
          body("Pickup loading is charged once for the agreed load.", true),
          { t: "h", text: "Delivery destinations · 2 of 5" },
          stopCard(1, STOPS[0], { lines: ["0 offloading helpers"] }),
          stopCard(2, STOPS[1], { lines: ["0 offloading helpers"] }),
          ghost("Add destination"),
          ghost("Suggest stop order"),
          card({ heading: "Suggested sequence", lines: [STOPS[0] + " → " + STOPS[1], "Proximity suggestion only. Review access and delivery windows; it does not guarantee the lowest fare."], btns: ["Apply", "Keep current"] }),
          card({ label: "ESTIMATED TOTAL", big: TOTAL, rows: [["Transport & pickup loading", "UGX 51,500"], ["Additional stops · 1", "UGX 1,500"]], cta: "View breakdown" }),
          { t: "footer", cta: "Cargo & contacts" },
        ],
        actions: [
          act("Suggest stop order", "POST /routes", "Proximity suggestion only; it does not guarantee the lowest fare."),
          act("Change truck, helpers or stops", "POST /quotes", "Re-prices transport, pickup loading, per-stop offloading and additional destinations."),
        ],
        states: ["Maximum five destinations", "Same place used twice"],
      },
      {
        id: "c-wiz-cargo",
        name: "2 · Cargo & contacts",
        route: "ChooseTruck (CargoOrderWizard step 2)",
        theme: CARGO,
        tag: "New",
        purpose: "Sender, pickup access, cargo items per stop and a recipient (with optional handover PIN) for every stop.",
        blocks: [
          hdr("Cargo & contacts", "Step 2 of 4 · Order a truck"),
          card({ heading: "Pickup contact", chips: ["Use me as sender", "Someone else"], fields: [["SENDER NAME", "Alex Mukasa"], ["SENDER PHONE", "+256 700 000 111"], ["PICKUP ACCESS INSTRUCTIONS", "", "Loading bay, floor, access restrictions…"]] }),
          ghost("Choose sender from contacts"),
          { t: "list", items: [{ title: "Furniture boxes", sub: "Qty: 1 · Unit weight: 1 kg · Stop 1" }, { title: "Office stock", sub: "Qty: 1 · Unit weight: 1 kg · Fragile · Stop 2" }] },
          ghost("Add cargo item"),
          card({ heading: "Recipient · stop 2", lines: [STOPS[1]], btns: ["Use me as recipient at stop 2"], fields: [["STOP 2 RECIPIENT NAME", "Alex Mukasa"], ["STOP 2 RECIPIENT PHONE", "+256 700 000 111"], ["STOP 2 INSTRUCTIONS", "", "Gate, offloading access or special handling…"]], toggles: [["Recipient handover PIN", false]], note: "The customer receives the demo code. The driver must ask the recipient for it at handover." }),
          { t: "footer", cta: "Payment & pairing" },
        ],
        notes: ["Contacts can be picked from the device address book (Choose stop N contact).", "Tapping a cargo item opens the “Cargo item” sheet: description, quantity, unit weight, dimensions, fragile and the delivery stop. Up to 20 items."],
      },
      {
        id: "c-wiz-pay",
        name: "3 · Payment & pairing",
        route: "ChooseTruck (CargoOrderWizard step 3)",
        theme: CARGO,
        tag: "New",
        purpose: "Choose who pays and how, and optionally pair the order with a known driver.",
        blocks: [
          hdr("Payment & pairing", "Step 3 of 4 · Order a truck"),
          { t: "h", text: "Who pays?" },
          { t: "radio", items: [["Ordering customer", "You approve payment after handover"], ["Recipient at stop 1", "They must accept and approve the charge"]], sel: 0 },
          body("Payment is due after handover. A recipient payer must accept and approve through the demo payment link. Their phone number alone does not authorize payment.", true),
          { t: "radio", label: "PAYMENT METHOD", items: [["MTN Mobile Money", ""], ["Airtel Money", ""], ["Demo Visa card", ""], ["Cash collection", "Driver records cash received; the payer confirms it."], ["FlexiPay (demo)", ""], ["LoadMaster wallet", ""]], sel: 0 },
          card({ heading: "Pair with a driver", lines: ["Optional. The driver must be verified, online, free and able to carry this truck size. They must still accept your order."], fields: [["DRIVER SHORT NUMBER", "2001"]], note: "Brian Kato · Isuzu Forward · UBB 920 B · Awaiting driver consent after ordering." }),
          ghost("Check driver number"),
          ghost("Use automatic matching"),
          { t: "footer", cta: "Review order" },
        ],
        actions: [act("Enter pairing number", "POST /account/pair", "Resolves a driver; the order is offered to that driver first.", [hit("driver", "d-offer", "“Customer used your pairing number.”")])],
        states: ["Unknown pairing number · “Check the pairing number, or clear it to use automatic matching.”", "Wallet not offered when the recipient pays", "Scheduled orders use automatic matching when due", "External wallet provider field (e.g. SafeBoda Wallet) when that method is chosen"],
      },
      {
        id: "c-wiz-review",
        name: "4 · Review your order",
        route: "ChooseTruck (CargoOrderWizard step 4)",
        theme: CARGO,
        tag: "New",
        purpose: "Full price breakdown, payer and method, terms acknowledgement, then place the order.",
        blocks: [
          hdr("Review your order", "Step 4 of 4 · Order a truck"),
          card({ heading: "Pickup · 2 kg", lines: ["Pickup: " + ROUTE[0], "Sender: Alex Mukasa · +256 700 000 111"], note: "No additional pickup instructions" }),
          card({ heading: "Stop 1 · " + STOPS[0], lines: ["Recipient · +256 700 000 113", "1 × Furniture boxes · 1 kg each"], note: "0 offloading helpers · Recipient PIN required" }),
          card({ heading: "Stop 2 · " + STOPS[1], lines: ["Alex Mukasa · +256 700 000 111", "1 × Office stock · 1 kg each · Fragile"], note: "0 offloading helpers · Driver handover confirmation" }),
          card({ rows: [["Transport", "UGX 39,500"], ["Pickup loading", "UGX 12,000"], ["Offloading at all stops", "UGX 0"], ["Additional destinations", "UGX 1,500"], ["Total", TOTAL]], note: "Each helper is UGX 12,000 per location. No duplicated pickup fee per package. Quote expires 3:28:53 AM.", btns: ["Refresh price"] }),
          card({ lines: ["Payer: Ordering customer", "MTN Mobile Money", "Pair with Brian Kato"], toggles: [["I confirm the cargo, contacts, route, fees and selected payment method.", false]], note: "Prototype terms acknowledgement. Failed delivery or returns require support review; no automatic extra return charge or disposal rule is applied." }),
          banner("Did you know? Drivers usually accept quickly. Once matched, you can follow every stop and share handover codes from the order screen.", "green"),
          { t: "footer", value: TOTAL, cta: "Order a truck" },
        ],
        actions: [act("Order a truck", "POST /orders (Idempotency-Key)", "Creates the cargo order (stage searching or scheduled). The request is saved locally and replayed if the connection drops.", [
          hit("driver", "d-home-offer", "Paired or eligible online drivers get the request with a response countdown."),
          hit("admin", "a-trips", "Trip appears with status Searching."),
        ])],
        states: ["Getting your price…", "QUOTE_EXPIRED · Refresh price", "Order button disabled until terms are confirmed"],
      },
    ],
  },
  {
    section: "Delivery tracking",
    screens: [
      {
        id: "c-order-searching",
        name: "Order · searching for a driver",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "While drivers are being offered the request one at a time.",
        blocks: [
          hdr("Finding a driver", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, pulse: true },
          card({ heading: "Searching for Brian Kato", note: "No arrival time is promised before acceptance. You can cancel while cargo has not been collected." }),
          ghost("Check for driver"),
          ghost("Search other eligible drivers"),
          { t: "btn", text: "Cancel order", v: "danger" },
        ],
        actions: [act("Search other eligible drivers", "POST /orders/:id/cargo {action:unpair}", "Removes the pairing so any eligible driver can be offered.")],
        notes: ["A driver declining or missing the request does not change this screen; the next eligible driver is offered."],
      },
      {
        id: "c-order-assigned",
        name: "Order · driver assigned",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "Live progress once a driver accepts, with pickup and per-stop contacts and handover codes.",
        blocks: [
          hdr("Driver assigned", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, trucks: 1 },
          card({ heading: "Delivery progress", lines: ["Verified assigned truck · Isuzu Forward · UBB 920 B", "Brian Kato · +256 700 000 222"], btns: ["Call driver"] }),
          card({ heading: `Pickup · ${ROUTE[0]}`, lines: ["Alex Mukasa · +256 700 000 111"] }),
          stopCard(1, STOPS[0], { lines: ["Demo handover code: 4821", "Share privately with this stop’s recipient. The driver should enter it only after offloading and handover."], btns: ["Share stop 1 handover code"] }),
          ghost("Messages & quick replies"),
          ghost("Share delivery updates"),
          { t: "btn", text: "Cancel order", v: "danger" },
        ],
        actions: [act("Share delivery updates", "POST /orders/:id/cargo {action:share}", "Creates a public tracking link; can be revoked.")],
      },
      {
        id: "c-order-transit",
        name: "Order · in transit (multi-stop)",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "Cargo in custody. Cancellation is no longer offered; issues go to support.",
        blocks: [
          hdr("On the way to destination", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, trucks: 1, progress: 0.6 },
          steps("in_transit"),
          stopCard(1, STOPS[0], { badge: ["DELIVERED", "green"], lines: ["Handed over · PIN confirmed"] }),
          stopCard(2, STOPS[1], { badge: ["NEXT", "amber"], lines: ["Alex Mukasa · +256 700 000 111"] }),
          ghost("Messages & quick replies"),
          ghost("Report an issue"),
        ],
      },
      {
        id: "c-chat",
        name: "Delivery messages",
        route: "OrderChat",
        theme: CARGO,
        tag: "New",
        purpose: "Order chat between customer and driver after acceptance, with quick replies.",
        blocks: [
          hdr("Delivery messages", "LM-1EA1A628"),
          { t: "chat", items: [["them", "At the pickup gate"], ["me", "Use the loading gate"], ["them", "Offloading cargo now"]] },
          { t: "chips", items: ["Please call me", "Cargo is ready at pickup", "Use the loading gate"], sel: -1, wrap: true },
          field("", "", "Write a message"),
          btn("Send message"),
        ],
        actions: [act("Send message", "POST /orders/:id/cargo {action:message}", "Appends to the order thread.", [hit("driver", "d-order-pickup", "Message appears in the driver’s delivery messages.")])],
        states: ["Messages are available after a driver accepts the order."],
      },
      {
        id: "c-order-cancel",
        name: "Cancel order",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "Available until cargo is collected.",
        blocks: [
          hdr("Driver assigned", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, trucks: 1 },
          sheet("Cancel this order?", "We’ll notify the other app. Your order stays active until cancellation is confirmed.", [field("Reason for cancellation", "Plans changed"), btn("Confirm cancellation", "danger"), btn("Keep order", "secondary")]),
        ],
        actions: [act("Confirm cancellation", "POST /orders/:id/cancel", "Stage → cancelled. Any open driver offers are withdrawn.", [hit("driver", "d-request-history", "An offered request shows “No longer available · Customer cancelled the order”."), hit("admin", "a-trip-dispatch", "Dispatch record marked withdrawn.")])],
        states: ["Reason under 3 characters", "CANCEL_UNAVAILABLE once loading has started"],
      },
      {
        id: "c-order-delivered",
        name: "Order · delivered & rate",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "All stops handed over; payment prompt and optional rating.",
        blocks: [
          hdr("Delivered", "LM-1EA1A628 · MTN Mobile Money"),
          steps("delivered"),
          card({ heading: "Payment · MTN Mobile Money", lines: ["Payer: Ordering customer"], cta: "View payment details" }),
          card({ heading: "Rate your delivery", stars: 4, note: "Rating is optional and does not affect payment or support." }),
          btn("Save delivery rating"),
        ],
        actions: [act("Save delivery rating", "POST /account/rating", "Stores 1–5 stars and review.", [hit("admin", "a-reports", "Rating visible on the trip record.")])],
      },
    ],
  },
  {
    section: "Payment",
    screens: [
      {
        id: "c-payment-due",
        name: "Payment · approve",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        purpose: "Payment follows delivery handover. Outcome controls simulate provider adapters.",
        blocks: [
          hdr("Order payment", "LM-1EA1A628"),
          badge("SIMULATED PAYMENT · NO REAL MONEY", "neutral"),
          card({ heading: "Ready to approve?", big: TOTAL, note: "Approve the selected demo payment. Provider names represent simulated adapters." }),
          { t: "radio", label: "DEMO OUTCOME CONTROLS", items: [["Success", "Payment confirmed"], ["Declined", "Retry or change method"], ["Insufficient funds", ""], ["Timeout", "Check status, then safely retry"], ["Debited · confirmation delayed", "Confirms when checked"]], sel: 0 },
          { t: "footer", cta: "Approve demo payment", secondary: "Report payment issue" },
        ],
        actions: [act("Approve demo payment", "POST /orders/:id/payment {action:approve}", "Success → paid; timeout/delayed → unknown; declined/insufficient → failed.", [hit("admin", "a-payments", "Collection status updates; settlement credited when paid.")])],
      },
      {
        id: "c-payment-unknown",
        name: "Payment · checking",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        purpose: "Protects against double charging when the provider result is unknown.",
        blocks: [
          hdr("Checking your payment", "LM-1EA1A628"),
          banner("Don’t pay again yet. We’ll check the existing attempt before allowing another charge.", "amber"),
          { t: "footer", cta: "Check payment status" },
        ],
        actions: [act("Check payment status", "POST /orders/:id/payment {action:resolve}", "Delayed → paid; timeout → failed with “no charge”, so retry is safe.")],
      },
      {
        id: "c-payment-failed",
        name: "Payment · retry",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        purpose: "Retry with the same or a different method.",
        blocks: [
          hdr("Order payment", "LM-1EA1A628"),
          banner("The demo payment was declined. Try again or choose another method.", "red"),
          { t: "radio", label: "CHOOSE A RETRY METHOD", items: [["MTN Mobile Money", ""], ["Airtel Money", ""], ["External wallet provider", "Opens the provider’s demo page"]], sel: 1 },
          { t: "footer", cta: "Retry payment" },
        ],
        actions: [act("Retry payment", "POST /orders/:id/payment {action:retry}", "New attempt awaiting approval.")],
      },
      {
        id: "c-payment-recipient",
        name: "Payment · recipient pays",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        tag: "New",
        purpose: "When the stop-1 recipient is the payer, they accept and approve the charge from a shared link.",
        blocks: [
          hdr("Awaiting recipient payment acceptance", "LM-1EA1A628"),
          card({ heading: TOTAL, note: "The recipient at stop 1 must accept and approve this transport charge. This customer account cannot approve it on their behalf." }),
          ghost("Share recipient payment link"),
          { t: "footer", cta: "Open recipient demo payment" },
        ],
        states: ["Recipient accepted the charge"],
      },
      {
        id: "c-payment-cash",
        name: "Payment · cash",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        tag: "New",
        purpose: "Cash collection: the driver records cash received, then the payer confirms it.",
        blocks: [
          hdr("Confirm cash collection", "LM-1EA1A628"),
          card({ heading: "Driver recorded cash received", big: TOTAL }),
          card({ toggles: [["I handed the agreed cash amount to the driver", true]] }),
          { t: "footer", cta: "Confirm cash payment" },
        ],
        actions: [act("Confirm cash payment", "POST /orders/:id/payment {action:confirm-cash}", "Marks the collection paid.", [hit("admin", "a-trip-payments", "Cash reconciliation shows fee due and remittance.")])],
        states: ["Waiting for driver cash declaration"],
      },
      {
        id: "c-receipt",
        name: "Receipt",
        route: "Payment (CargoPayment)",
        theme: CARGO,
        purpose: "Receipt after a confirmed payment, with refund history.",
        blocks: [
          hdr("Payment confirmed", "LM-1EA1A628"),
          card({ heading: "Receipt", rows: [["Reference", "PAY-91C2D0AA"], ["Method", "MTN Mobile Money"], ["Confirmed", "05/11/2026, 09:58"], ["Refunded", "UGX 0"], ["Total", TOTAL]], note: "Driver payout and customer payment are separate records." }),
          { t: "footer", cta: "Back to order", secondary: "Report payment issue" },
        ],
      },
    ],
  },
  {
    section: "Lists & account",
    screens: [
      { id: "c-orders", name: "Orders", route: "Main/Orders", tab: "Orders", purpose: "All orders with search and status tabs (CustomerOrders).", blocks: [title("Your orders"), { t: "search", ph: "Search by order ID or location" }, { t: "tabsline", items: ["All", "Active", "Scheduled", "Completed", "Cancelled"], sel: 0 }, { t: "ordercards", items: [{ id: "LM-1EA1A628", badge: "On the way", tone: "blue", from: "Nakasero Market", to: "Ntinda Shopping Centre", price: "UGX 148,000" }, { id: "LM-22B8E004", badge: "Delivered", from: "Acacia Mall", to: "Kampala Road", price: "UGX 92,000" }, { id: "LM-0D91F3B2", badge: "Cancelled", tone: "red", from: "Najjeera", to: "Namuwongo", price: "UGX 64,000" }] }] },
      { id: "c-order-details", name: "Order details · delivered", route: "Order (CargoDelivery)", purpose: "A finished order opened from Orders.", blocks: [{ t: "nav", title: "Order details", flat: true }, { t: "titlebadge", text: "Delivered", badge: "Delivered" }, { t: "map", h: 180 }, { t: "eyebrow", text: "Delivery completed · Handover confirmed." }, { t: "progress", value: 1 }, { t: "drivercard", title: "Brian Kato · Isuzu Forward", sub: "24 km route · UBB 920 B" }, { t: "routeline", title: "My destination", stops: [["Pickup", "Nakasero Market", "Kampala Central"], ["Destination", "Ntinda Shopping Centre", "Nakawa"]] }, btn("View payment receipt", "secondary")] },
      { id: "c-payments", name: "Payments", route: "Main/Payments", tab: "Payments", purpose: "Outstanding and historic payments.", blocks: [eyebrow("PAYMENTS, WITHOUT THE GUESSWORK"), title("Your payments"), { t: "hero", eyebrow: "OUTSTANDING", title: "UGX 0", body: "Direct in-app payments. No wallet top-up needed." }, { t: "section", text: "Payment activity" }, { t: "payact", items: [{ amount: "UGX 148,000", sub: "MTN Mobile Money · LM-1EA1A628", badge: "Awaiting approval", tone: "amber" }, { amount: "UGX 92,000", sub: "Cash collection · LM-22B8E004", badge: "Paid" }, { amount: "UGX 92,000", sub: "Cash collection · LM-0D91F3B2", badge: "Paid", note: "Refunded UGX 92,000" }] }, { t: "eyebrow", text: "Demo payments only. No real money moves." }] },
      { id: "c-account", name: "Account", route: "Main/Account", tab: "Account", purpose: "Account hub.", blocks: [title("Account"), { t: "profilehead", initials: "AM", name: "Alex Mukasa", sub: "+256 700 000 101" }, { t: "menu", items: [["user", "Your profile", "Update your name and contact details"], ["headset", "Help & support", "Get help with orders and payments"], ["card", "Payment methods", "Manage your cards and payment options"], ["bookmark", "Saved places", "Manage pickup and drop-off locations"]], more: "More account options", logout: "Log out", foot: "App demo. No real transactions." }] },
      { id: "c-notifications", name: "Updates", route: "Notifications", purpose: "In-app notification records (no push).", blocks: [{ t: "nav", title: "Updates" }, title("Your updates."), { t: "link", text: "Mark all read" }, { t: "list", items: [{ title: "Driver assigned", sub: "Your driver has accepted LM-1EA1A628" }, { title: "Finding a new driver", sub: "Your driver could not continue LM-1EA1A628. We are finding another." }, { title: "Payment confirmed", sub: "Your receipt for LM-22B8E004 is ready." }] }], actions: [act("Mark all read", "POST /account/notification", "Marks read.")] },
      { id: "c-support", name: "Support", route: "Support", purpose: "Raise an order issue or general case.", blocks: [{ t: "nav", title: "Support" }, eyebrow("LET’S SORT IT OUT"), title("Tell us what happened"), field("Describe the issue", "", "Payment, loading, cargo, or something else…"), btn("Save issue report")], actions: [act("Save issue report", "POST /orders/:id/issue · POST /account/ticket", "Creates a case.", [hit("admin", "a-support", "Case appears as Open.")])] },
      { id: "c-saved-places", name: "Saved places", route: "SavedPlaces", purpose: "Up to ten saved places.", blocks: [{ t: "nav", title: "Saved places" }, title("Your familiar places."), { t: "list", items: [{ title: "My shop", sub: "Ntinda Shopping Centre" }] }, btn("Save place")], actions: [act("Save place", "POST /account/place", "Only demo places or this account’s own places can be saved.")] },
      { id: "c-payment-methods", name: "Payment methods", route: "PaymentMethods", purpose: "Synthetic saved methods.", blocks: [{ t: "nav", title: "Payment methods" }, { t: "list", items: [{ title: "Demo MTN account", sub: "MTN · 0111", badge: "DEFAULT" }, { title: "Visa card", sub: "Card · 4242" }] }, btn("Add method", "secondary")], actions: [act("Save / remove / set default", "POST /account/methods", "Updates methods.", [hit("admin", "a-methods", "Masked method visible to finance roles.")])] },
      { id: "c-profile", name: "Profile", route: "Profile", purpose: "Edit name and email.", blocks: [{ t: "nav", title: "Profile" }, field("Your name", "Alex Mukasa"), field("Email", "alex@example.test"), btn("Save profile")], actions: [act("Save profile", "POST /account/profile", "Audit records before/after.")] },
      { id: "c-preferences", name: "Settings & privacy", route: "Preferences", purpose: "Notifications, hide amounts, account deletion.", blocks: [{ t: "nav", title: "Settings & privacy" }, { t: "toggle", label: "Order & payment updates", on: true }, { t: "toggle", label: "Hide amounts on home", on: false }, btn("Delete demo account", "danger")], actions: [act("Delete demo account", "POST /account/delete", "Sets inactive; blocked while orders are active.")] },
    ],
  },
];

const driver = [
  { section: "Authentication", screens: auth("driver").slice(0, 3) },
  {
    section: "Home & onboarding",
    screens: [
      {
        id: "d-home-offline",
        name: "Home · offline",
        route: "Main/Home",
        tab: "Home",
        tag: "Updated",
        purpose: "Driver landing screen with pairing number, demo map and availability toggle.",
        blocks: [
          { t: "greet", name: "Brian", role: "DRIVER" },
          card({ label: "YOUR DRIVER PAIRING NUMBER", big: "2001", bigColor: "green", lines: ["A customer can enter this number. You must still be online, eligible and accept the request."] }),
          { t: "titlebadge", text: "Your next move\nstarts here.", badge: "OFFLINE" },
          { t: "map", h: 230, route: false, pulse: true },
          { t: "toggle", label: "You’re offline · Go online when you’re ready to drive.", on: false },
          { t: "drivercard", icon: "car", title: "Take a moment. Then make a move.", sub: "You won’t receive new requests while offline." },
        ],
        actions: [act("Go online", "POST /availability", "Going offline withdraws any open offer.", [hit("admin", "a-drivers", "Availability shows Online/Offline.")])],
      },
      {
        id: "d-home-online",
        name: "Home · online, listening",
        route: "Main/Home",
        tab: "Home",
        purpose: "Approved driver online with no request.",
        blocks: [
          { t: "greet", name: "Brian", role: "DRIVER" },
          card({ label: "YOUR DRIVER PAIRING NUMBER", big: "2001", bigColor: "green", lines: ["A customer can enter this number. You must still be online, eligible and accept the request."] }),
          { t: "titlebadge", text: "Ready for your\nnext move.", badge: "ONLINE" },
          { t: "map", h: 230, route: false, pulse: true },
          { t: "toggle", label: "You’re online · Available for new orders", on: true },
          card({ lines: ["Listening for orders", "No suitable request right now. Keep this app open while testing."] }),
        ],
      },
      {
        id: "d-home-unverified",
        name: "Home · verification needed",
        route: "Main/Home",
        tab: "Home",
        purpose: "New drivers cannot go online until an admin approves vehicle and all four documents.",
        blocks: [
          { t: "greet", name: "Brian", role: "DRIVER" },
          banner("Finish account verification · Verified documents and vehicle details are required to receive orders.", "amber"),
          btn("View verification", "secondary"),
          { t: "toggle", label: "You’re offline · Go online when you’re ready to drive.", on: false, disabled: true },
        ],
      },
      {
        id: "d-verification",
        name: "Vehicle & verification",
        route: "Verification",
        purpose: "Upload the four required documents with the native photo picker.",
        blocks: [
          { t: "nav", title: "Vehicle & verification" },
          title("Ready for the road."),
          card({ label: "REGISTERED VEHICLE", lines: ["Isuzu Forward · UBB 920 B · Large truck"], cta: "Edit vehicle details" }),
          { t: "list", items: [
            { title: "Driver licence", sub: "licence.jpg", badge: "APPROVED", tone: "green" },
            { title: "Identity document", sub: "id.jpg", badge: "PENDING", tone: "amber" },
            { title: "Vehicle registration", sub: "Review note: photo is blurry", badge: "REJECTED", tone: "red" },
            { title: "Third-party insurance", sub: "Not submitted", badge: "UPLOAD", tone: "neutral" },
          ] },
        ],
        actions: [act("Upload document", "POST /account/document", "JPG/PNG < 2 MB; driver unverified + offline until reviewed.", [hit("admin", "a-driver-detail", "Document appears as Pending for review.")])],
      },
      {
        id: "d-vehicle",
        name: "Vehicle details",
        route: "Vehicle",
        purpose: "Change truck category, model and plate (requires re-review).",
        blocks: [{ t: "nav", title: "Vehicle details" }, field("Vehicle model", "Isuzu Forward"), field("Licence plate", "UBB 920 B"), { t: "radio", label: "Truck category", items: [["Pickup", "Up to 1 tonne"], ["Medium truck", "Up to 3 tonnes"], ["Large truck", "Up to 7 tonnes"]], sel: 2 }, btn("Submit vehicle for review")],
        actions: [act("Submit vehicle", "POST /account/vehicle", "vehicleStatus pending; verified false.", [hit("admin", "a-drivers", "Verification shows Pending.")])],
      },
    ],
  },
  {
    section: "Requests · accept, decline, miss",
    screens: [
      {
        id: "d-home-offer",
        name: "Home · new request",
        route: "Main/Home",
        tab: "Home",
        tag: "New",
        purpose: "One request at a time per eligible driver, with a response window (default 45 s, set in Admin settings).",
        blocks: [
          { t: "greet", name: "Brian", role: "DRIVER" },
          { t: "topbanner", text: `New cargo request · ${ROUTE[0]}` },
          { t: "hero", eyebrow: "NEW CARGO REQUEST", title: "A new move is waiting.", lines: [`● ${ROUTE[0]}`, `◎ ${STOPS[1]} · 2 stops`], badge: ["RESPOND IN 0:38", "amber"], rows: [["Agreed fare", TOTAL]], cta: "Review request" },
        ],
        notes: ["Countdown uses offer.expiresAt corrected by serverTime to avoid device clock skew."],
      },
      {
        id: "d-offer",
        name: "A new cargo request",
        route: "Offer (CargoOffer)",
        theme: CARGO,
        tag: "Updated",
        purpose: "Full multi-stop request with handover requirements and earning. Accept, decline with a reason, or let it expire.",
        blocks: [
          hdr("A new cargo request", "Respond in 45s · LM-1EA1A628"),
          card({ heading: `${ROUTE[0]} → ${STOPS[1]}`, lines: ["2 stop(s) · 2 kg"], note: "Customer used your pairing number. Accept only if the work fits." }),
          stopCard(1, STOPS[0], { lines: ["1 × Furniture boxes"], note: "0 offloading helpers · Recipient PIN required" }),
          stopCard(2, STOPS[1], { lines: ["1 × Office stock"], note: "0 offloading helpers · Handover confirmation" }),
          card({ lines: ["Fare: UGX 53,000", "Platform fee: UGX 7,950"], heading2: `Your earning: ${EARNING}`, note: "Payment: MTN Mobile Money. Collection and payout are separate." }),
          { t: "footer", cta: "Accept this order", secondary: "Decline request" },
        ],
        actions: [
          act("Accept this order", "POST /orders/:id/accept", "Dispatch record → accepted; order → assigned. Other drivers’ open offers → withdrawn.", [
            hit("customer", "c-order-assigned", "Driver card, truck and handover codes appear; notice “Driver assigned”."),
            hit("admin", "a-trip-dispatch", "Record shows Accepted; Trips status Driver assigned."),
            hit("driver", "d-request-history", "Other drivers see “No longer available · Assigned to another driver”."),
          ]),
          act("Decline request", "—", "Reveals the decline reason field."),
        ],
        states: ["OFFER_MISSED if the window ran out", "DRIVER_BUSY", "CAPACITY_MISMATCH"],
      },
      {
        id: "d-decline",
        name: "Decline with reason",
        route: "Offer (CargoOffer)",
        theme: CARGO,
        tag: "New",
        purpose: "Decline reason helps operations understand declines; the record is kept.",
        blocks: [
          hdr("A new cargo request", "Respond in 31s · LM-1EA1A628"),
          card({ heading: `${ROUTE[0]} → ${STOPS[1]}`, lines: ["2 stop(s) · 2 kg"] }),
          card({ fields: [["DECLINE REASON", "Too far from me"]] }),
          { t: "footer", cta: "Confirm decline", secondary: "Accept this order" },
        ],
        actions: [act("Confirm decline", "POST /orders/:id/decline {reason}", "Dispatch record → declined with reason; next eligible driver is offered.", [
          hit("driver", "d-request-history", "Record remains under Declined with the reason."),
          hit("admin", "a-trip-dispatch", "Driver requests tab shows Declined + reason."),
          hit("customer", "c-order-searching", "No visible change; still finding a driver."),
        ])],
      },
      {
        id: "d-offer-missed",
        name: "Request missed",
        route: "Offer",
        tag: "New",
        purpose: "Shown when the countdown reaches zero or the server reports the offer as missed.",
        blocks: [{ t: "nav", title: "Review request" }, empty("You missed this request", "The response time ran out, so it went to other drivers. It stays in your request history."), btn("View request history", "secondary"), btn("Back to requests")],
        actions: [act("(automatic) window expires", "server tick on any snapshot", "Dispatch record → missed; notice “Request missed”; next driver offered.", [hit("driver", "d-notifications", "“Request missed” notification."), hit("admin", "a-trip-dispatch", "Record shows Missed.")])],
      },
      {
        id: "d-request-history",
        name: "Request history",
        route: "RequestHistory",
        tag: "New",
        purpose: "Every request received, including declined and missed ones.",
        blocks: [
          { t: "nav", title: "Request history" },
          title("Request history"),
          { t: "stats", items: [["Accepted", "16"], ["Declined", "1"], ["Missed", "1"]] },
          { t: "chips", items: ["All", "Accepted", "Declined", "Missed", "No longer available"], sel: 0 },
          { t: "list", items: [
            { title: "LM-1EA1A628", sub: `${ROUTE[0]} → ${STOPS[1]} · Earning ${EARNING}`, badge: "ACCEPTED", tone: "green" },
            { title: "LM-5C0E9A17", sub: "Acacia Mall → Kampala Road · Too far from me", badge: "DECLINED", tone: "red" },
            { title: "LM-A4D2B6E1", sub: "Najjeera → Namuwongo · No response before the request expired", badge: "MISSED", tone: "red" },
            { title: "LM-91FF03C2", sub: "Nakawa → Ntinda · Assigned to another driver", badge: "NO LONGER AVAILABLE", tone: "neutral" },
          ] },
        ],
      },
    ],
  },
  {
    section: "Delivery",
    screens: [
      {
        id: "d-order-pickup",
        name: "Delivery · heading to pickup",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        purpose: "Driver advances one stage at a time with the primary footer button.",
        blocks: [
          hdr("Driver assigned", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, trucks: 1 },
          card({ heading: `Pickup · ${ROUTE[0]}`, lines: ["Alex Mukasa · +256 700 000 111", "Loading bay, floor 1"], btns: ["Call pickup contact"] }),
          stopCard(1, STOPS[0], { lines: ["Recipient PIN required"] }),
          stopCard(2, STOPS[1], { lines: ["Handover confirmation"] }),
          ghost("Messages & quick replies"),
          { t: "btn", text: "Release this delivery", v: "danger" },
          { t: "footer", cta: "Start trip to pickup" },
        ],
        actions: [act("Advance stage", "POST /orders/:id/advance {stage}", "assigned → to_pickup → at_pickup → loading → in_transit → at_destination → offloading → delivered (per stop).", [hit("customer", "c-order-assigned", "Stage and stop progress update."), hit("admin", "a-trip-timeline", "Timeline entry added.")])],
      },
      {
        id: "d-release",
        name: "Release delivery",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        tag: "New",
        purpose: "Backing out releases the order to other drivers instead of cancelling it.",
        blocks: [
          hdr("Driver assigned", "LM-1EA1A628 · MTN Mobile Money"),
          { t: "map", h: 190, trucks: 1 },
          sheet("Release this delivery?", "The customer keeps their order and it goes back to other drivers. You won’t see this request again.", [field("Reason for releasing", "Truck broke down"), btn("Confirm cancellation", "danger"), btn("Keep delivery", "secondary")]),
        ],
        actions: [act("Confirm release", "POST /orders/:id/cancel (as driver)", "Order → searching; dispatch record → released.", [hit("customer", "c-order-searching", "Back to finding a driver; notice “Finding a new driver”."), hit("admin", "a-trip-dispatch", "Released record with reason.")])],
      },
      {
        id: "d-order-handover",
        name: "Delivery · stop handover",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        tag: "Updated",
        purpose: "Per-stop handover: ask the recipient for their PIN, confirm handover, or report a failed handover.",
        blocks: [
          hdr("Offloading your cargo", "LM-1EA1A628 · MTN Mobile Money"),
          stopCard(1, STOPS[0], { lines: ["Recipient · +256 700 000 113"], btns: ["Call recipient"], fields: [["RECIPIENT HANDOVER PIN", "", "Ask the recipient for their code"]], toggles: [["Cargo handed over to recipient", true]] }),
          ghost("Recipient unavailable / handover issue"),
          { t: "footer", cta: "Confirm stop 1 delivered" },
        ],
        actions: [
          act("Confirm stop delivered", "POST /orders/:id/advance {stage, pin, confirmed}", "Wrong PIN is rejected; after the last stop the order is delivered and payment starts.", [hit("customer", "c-payment-due", "Payment prompt appears after the final handover."), hit("admin", "a-payouts", "Entitlement listed as Scheduled.")]),
          act("Report failed handover", "POST /orders/:id/cargo {action:failed-stop}", "Stop marked failed; return to pickup contact with supervisor confirmation.", [hit("admin", "a-support", "Return case for supervisor review.")]),
        ],
      },
      {
        id: "d-cash",
        name: "Delivery · record cash",
        route: "Order (CargoDelivery)",
        theme: CARGO,
        tag: "New",
        purpose: "Cash orders: driver records cash received after handover; retained earning is not paid twice.",
        blocks: [
          hdr("Delivered", "LM-1EA1A628 · Cash collection"),
          card({ heading: "Payment · Cash collection", lines: ["Payer: Ordering customer", "Cash earning retained. Cash owed to platform: UGX 7,950"], fields: [["CASH RECEIVED (UGX)", "53,000"]], note: "Record cash after handover. Your retained earning must not be paid a second time." }),
          { t: "footer", cta: "Record cash received" },
        ],
        actions: [act("Record cash received", "POST /orders/:id/cargo {action:cash-received}", "Creates the cash declaration.", [hit("customer", "c-payment-cash", "“Driver recorded cash received” — customer confirms."), hit("admin", "a-trip-payments", "Cash reconciliation: fee due, remittance pending.")])],
      },
    ],
  },
  {
    section: "Lists, earnings & account",
    screens: [
      { id: "d-deliveries", name: "Deliveries", route: "Main/Deliveries", tab: "Deliveries", purpose: "Accepted deliveries plus link to request history.", blocks: [title("Your deliveries"), { t: "search", ph: "Search by order ID or location" }, { t: "tabsline", items: ["All", "Active", "Scheduled", "Completed", "Cancelled"], sel: 0 }, btn("Request history · declined & missed", "secondary"), { t: "ordercards", items: [{ id: "LM-1EA1A628", badge: "On the way", tone: "blue", from: "Nakasero Market", to: "Ntinda Shopping Centre", price: "UGX 148,000" }, { id: "LM-22B8E004", badge: "Delivered", from: "Acacia Mall", to: "Kampala Road", price: "UGX 92,000" }, { id: "LM-0D91F3B2", badge: "Cancelled", tone: "red", from: "Najjeera", to: "Namuwongo", price: "UGX 64,000" }] }] },
      { id: "d-earnings", name: "Earnings", route: "Main/Earnings", tab: "Earnings", purpose: "Scheduled and paid earnings; payout is separate from customer collection.", blocks: [eyebrow("THE WORK YOU DO. THE MONEY YOU EARN."), title("Your earnings"), { t: "hero", eyebrow: "SCHEDULED EARNINGS", title: "UGX 567,800", body: "Earned from completed deliveries. Payout is separate from customer collection." }, card({ label: "PAID OUT", big: "UGX 4,094,450", lines: ["Demo settlement is managed through the demo service. A production payout cycle has not been set."] }), btn("Request or view scheduled payout", "secondary"), { t: "section", text: "Withdrawal transactions" }, { t: "payact", items: [{ icon: "wallet", amount: "UGX 420,000", sub: "MTN Mobile Money · Payout", badge: "Paid" }, { icon: "wallet", amount: "UGX 147,800", sub: "Airtel Money · Payout", badge: "Scheduled", tone: "amber" }] }] },
      { id: "d-payouts", name: "Payout requests", route: "PayoutRequests", purpose: "Request all scheduled earnings for review.", blocks: [{ t: "nav", title: "Payout requests" }, card({ label: "AVAILABLE FOR PAYOUT REVIEW", big: EARNING }), btn("Request scheduled payout"), { t: "list", items: [{ title: "WD-3B71A0C4", sub: "UGX 588,200", badge: "PAID", tone: "green" }] }], actions: [act("Request scheduled payout", "POST /account/withdrawal", "One open request at a time.", [hit("admin", "a-payouts", "Request listed for review.")])] },
      { id: "d-notifications", name: "Updates", route: "Notifications", purpose: "Driver notifications.", blocks: [{ t: "nav", title: "Updates" }, { t: "list", items: [{ title: "Request missed", sub: "You did not respond to LM-A4D2B6E1 in time." }, { title: "Order reassigned", sub: "LM-7F3A21C9 was reassigned by operations." }, { title: "Payout request paid", sub: "Weekly settlement" }] }] },
      { id: "d-account", name: "Account", route: "Main/Account", tab: "Account", purpose: "Driver account hub.", blocks: [title("Account"), { t: "profilehead", initials: "BK", name: "Brian Kato", sub: "+256 700 000 201" }, { t: "menu", items: [["user", "Your profile", "Update your name and contact details"], ["shield-check", "Vehicle & verification", "Registered truck and document status"], ["headset", "Help & support", "Get help with orders and payments"], ["card", "Payment methods", "Manage your cards and payment options"]], more: "More account options", logout: "Log out", foot: "App demo. No real transactions." }] },
    ],
  },
];

// ---------- success confirmations (packages/mobile/src/celebrate.tsx) ----------
const screensOf = (list) => list.flatMap((x) => x.screens);
const celebrateOn = (list, baseId, id, name, c, actions = []) => {
  const base = screensOf(list).find((x) => x.id === baseId);
  return {
    ...base,
    id,
    name,
    tag: "New",
    purpose: "Shown when the action succeeds: animated badge, confetti, success haptic and an optional milestone from real records. Closes after 4 s (5 s with a milestone) or on tap. Reduce-motion skips the animation.",
    blocks: [...base.blocks.filter((b) => b.t !== "sheet"), { t: "celebrate", ...c }],
    actions,
    states: undefined,
  };
};
customer.push({
  section: "Success confirmations",
  screens: [
    celebrateOn(customer, "c-payment-methods", "c-done-method", "Payment method added", { glyph: "▭", title: "Payment method added", message: "Work Airtel •••• 4821 is ready for your next order.", milestone: "First payment method added" }, [act("Save demo method", "POST /account/methods", "Celebrates; milestone only for the first method.")]),
    celebrateOn(customer, "c-wallet", "c-done-wallet", "Wallet topped up", { glyph: "▣", title: "UGX 50,000 added", message: "Your wallet is topped up and ready to pay for deliveries." }, [act("Approve demo top-up", "POST /account/wallet", "Only a completed top-up celebrates; pending or failed shows the inline message.")]),
    celebrateOn(customer, "c-wiz-review", "c-done-order", "Order placed", { glyph: "▤", title: "Order placed", message: "We’re finding a driver for LM-1EA1A628 now.", milestone: "Your 5th LoadMaster order", cta: "Track my order" }, [act("Order a truck", "POST /orders", "Scheduled orders say “Pickup scheduled”.")]),
    celebrateOn(customer, "c-order-delivered", "c-done-paid", "Payment confirmed", { glyph: "✓", title: "Payment confirmed", message: "UGX 53,000 paid for LM-1EA1A628. Your receipt is ready.", cta: "View receipt" }, [act("Approve / confirm cash", "POST /orders/:id/payment", "Celebrates only when the payment status is paid.")]),
  ],
});
driver.push({
  section: "Success confirmations",
  screens: [
    celebrateOn(driver, "d-offer", "d-done-accepted", "Delivery accepted", { glyph: "➤", title: "Delivery accepted", message: "Head to Ntinda Shopping Centre to collect the cargo.", cta: "Start trip" }, [act("Accept this order", "POST /orders/:id/accept", "Then opens the delivery screen.")]),
    celebrateOn(driver, "d-order-handover", "d-done-delivered", "Delivery complete", { glyph: "⚑", tone: "gold", title: "Delivery complete", message: "Nice work. UGX 45,050 is added to your earnings.", milestone: "Your 50th delivery" }, [act("Confirm last stop delivered", "POST /orders/:id/advance", "Intermediate stops show “Stop N delivered · N stop(s) to go”.")]),
    celebrateOn(driver, "d-payouts", "d-done-payout", "Payout requested", { glyph: "▣", tone: "gold", title: "Payout requested", message: "UGX 45,050 is on its way for review." }, [act("Request scheduled payout", "POST /account/withdrawal", "Finance reviews it in Driver payouts.")]),
  ],
});

// ---------- admin ----------
// Mirrors apps/admin: compact shadcn layout, plain page titles, trip and
// person detail pages (not dialogs), fleet map, filter chips and editable roles.
const page = (title, desc, extra = {}) => ({ title, desc, ...extra });
const TRIP = "LM-1EA1A628";
const tripCols = ["Trip", "Created", "Pickup", "Destination", "Customer", "Driver", "Status", "Fare"];
const tripRows = () => [
  [TRIP, "5 Nov, 09:12", ROUTE[0], STOPS[1], "→Alex Mukasa", "Brian Kato\nUBB 920 B", "◉In transit", TOTAL],
  ["LM-5C0E9A17", "5 Nov, 08:40", "Acacia Mall", "Kampala Road", "→Sarah Nakato", "Not assigned", "◉Searching", "UGX 52,000"],
  ["LM-368C6B5C", "5 Nov, 07:55", "Kampala Road", "Kawempe Trading Centre", "→Brenda Kizza", "Not assigned", "◉Scheduled", "UGX 80,000"],
  ["LM-22B8E004", "4 Nov, 16:05", "Acacia Mall", "Kampala Road", "→Alex Mukasa", "Grace Nambasa\nUBG 412 A", "◉Delivered", "UGX 47,000"],
  ["LM-F2D225F4", "4 Nov, 11:20", "Namuwongo Industrial Area", "Najjeera Trading Centre", "→Doreen Mugisha", "Not assigned", "◉Cancelled", "UGX 100,000"],
];
const tripChips = [["All trips", 300], ["In progress", 4], ["Finding a driver", 0], ["Scheduled", 4], ["Completed", 256], ["Returned", 0], ["Cancelled", 36]];
const TRIP_SEARCH = "Trip ID, customer, driver ID, plate, phone or email";
const tripPage = (tab) => ({
  meta: "Trip · created 5 Nov 2026, 09:12",
  title: TRIP,
  desc: `${ROUTE[0]} → ${STOPS[0]} → ${STOPS[1]}`,
  badges: ["In transit", "Not due", TOTAL],
  back: true,
});
const tripTop = (tab) => [
  { t: "routemap", live: true, facts: [["Distance", "7.9 km"], ["Estimated drive", "14 min"], ["Truck", "Pickup"], ["Trip time", "In progress"]], stops: [[ROUTE[0], "Collected 5 Nov, 09:31"], [STOPS[0], "Delivered"], [STOPS[1], "Not reached"]] },
  { t: "party", items: [["Customer", "Alex Mukasa", "+256 700 000 111", "View customer"], ["Driver", "Brian Kato", "Isuzu Forward · UBB 920 B", "View driver"], ["Payment", "MTN Mobile Money", "Ordering customer pays"], ["Rating", "Not rated", "No review yet"]] },
  { t: "tabs", items: ["Trip details", "Timeline", "Driver requests (3)", "Payments & actions", "Issues (0)"], active: tab },
];
const personActions = (driver, menu) => ({
  t: "actions",
  items: ["Edit details", "Message"],
  more: true,
  menu: menu ? [...(driver ? ["Edit vehicle"] : []), "Reset password", ...(driver ? ["Set offline", "Revoke verification"] : []), "—", "Suspend account", "Deactivate account"] : undefined,
});
const admin = [
  {
    section: "Access",
    screens: [
      { id: "a-login", name: "Staff sign in", route: "/operations (login)", purpose: "Each staff member signs in with their own account and session.", layout: "split", blocks: [{ t: "loginart", title: "Operations portal", body: "Trips, drivers, customers and payments for LoadMaster cargo delivery." }, field("Email or phone", "irene@loadmaster.test"), field("Password", "••••••••••••••"), btn("Sign in  →"), { t: "link", text: "Forgot your password?" }, { t: "demo", lines: ["Demo access", "Super Admin: irene@loadmaster.test", "Password: DemoCargo2026!", "Other roles: daniel, rita, peter, joan @loadmaster.test"] }], actions: [act("Sign in", "POST /auth/login {role:staff}", "Per-account session token; invited staff must set a password first.")] },
    ],
  },
  {
    section: "Workspace",
    screens: [
      { id: "a-dashboard", name: "Dashboard", route: "dashboard", tag: "Updated", page: page("Dashboard", "Today’s trips, drivers and collections.", { badges: ["Updated from shared demo service"] }), blocks: [{ t: "metrics", items: [["Total trips", "300", "256 completed deliveries"], ["Moves in progress", "4", "Searching, pickup and delivery"], ["Drivers online", "6", "Availability confirmed by service"], ["Net collections", "UGX 19,976,500", "Confirmed collections, less refunds"]] }, { t: "split", ratio: 0.6, left: [{ t: "chart", title: "Trip activity" }], right: [{ t: "glance", title: "At a glance", items: [["Trips awaiting a driver", 0], ["Scheduled pickups", 4], ["Drivers awaiting verification", 1], ["Open support cases", 9]] }] }, { t: "table", title: "Latest trips", count: "300 records", search: TRIP_SEARCH, cols: tripCols, rows: tripRows(), pages: 30 }], notes: ["Admin polls GET /admin every 4 s; each poll also runs a dispatch round (offers and timeouts)."] },
      { id: "a-trips", name: "Trips", route: "trips", tag: "Updated", page: page("Trips", "All cargo trips and live driver positions."), purpose: "Status filters with counts, a date filter and search across trip, customer and driver details.", blocks: [{ t: "tabs", items: ["Trip records", "Driver tracking"], active: 0 }, { t: "chips", items: tripChips }, { t: "table", search: TRIP_SEARCH, filters: ["Any date"], cols: tripCols, rows: tripRows(), pager: "1–10 of 300 records", pages: 30, title: "" }], actions: [act("Click a row", "—", "Opens the trip page /trips/:id."), act("Click a customer or driver name", "—", "Opens their page without opening the row.")] },
      { id: "a-tracking", name: "Trips · driver tracking", route: "trips (tracking)", tag: "New", page: page("Trips", "All cargo trips and live driver positions."), purpose: "Every driver on one map with online, on-trip, available and offline counts.", blocks: [{ t: "tabs", items: ["Trip records", "Driver tracking"], active: 1 }, { t: "metrics", items: [["Online", "6", "of 11 drivers"], ["On a trip", "4", "Assigned through to handover"], ["Available", "2", "Online and free for requests"], ["Offline", "5", "Not receiving requests"]] }, { t: "fleet", chips: [["Online", 6], ["On trip", 4], ["Available", 2], ["Offline", 5], ["All", 11]], pins: [["PW", "available", 0.42, 0.3], ["MO", "on_trip", 0.3, 0.46], ["JM", "on_trip", 0.7, 0.26], ["MN", "available", 0.38, 0.78], ["AW", "on_trip", 0.56, 0.6], ["HN", "on_trip", 0.62, 0.42], ["GN", "offline", 0.2, 0.7]], list: [["Peter Wasswa · UBF 108 C", "Last drop-off · Acacia Mall", "available"], ["Moses Okello · UBK 771 D", "LM-796AC853 · Offloading · towards Wandegeya Market", "on_trip"], ["Joseph Mugisha · UBJ 545 F", "LM-8823199F · To pickup · Ntinda Shopping Centre", "on_trip"], ["Moses Nakato · UBA 100 A", "Last drop-off · Kampala Road", "available"], ["Agnes Wasswa · UBB 153 D", "LM-62855D5C · Loading · Namuwongo Industrial Area", "on_trip"]] }], actions: [act("Search or click a pin", "—", "Selects the driver; the map zooms to them.")], notes: ["Positions are simulated: stage-based for drivers on a trip, last drop-off or a base otherwise. Routes from POST /routes (OSRM)."] },
      { id: "a-tracking-selected", name: "Trips · driver selected", route: "trips (tracking › driver)", tag: "New", page: page("Trips", "All cargo trips and live driver positions."), purpose: "A selected driver’s details, location and current trip with its route.", blocks: [{ t: "tabs", items: ["Trip records", "Driver tracking"], active: 1 }, { t: "fleet", route: true, chips: [["Online", 6], ["On trip", 4], ["Available", 2], ["Offline", 5], ["All", 11]], pins: [["BK", "on_trip", 0.5, 0.45, true], ["PW", "available", 0.3, 0.3], ["GN", "offline", 0.2, 0.7]], selected: { name: "Brian Kato", sub: "+256 700 000 222", badges: ["On trip"], facts: [["Driver ID", "driver-1"], ["Vehicle", "Isuzu Forward · UBB 920 B"], ["Truck", "Large truck"], ["Location", "In transit · towards Acacia Mall"]], trip: { id: TRIP, stage: "In transit", lines: [`${ROUTE[0]} → ${STOPS[1]}`, "Customer: Alex Mukasa · " + TOTAL] } } }] },
      { id: "a-trip-details", name: "Trip page · details", route: "trips (page /trips/:id)", tag: "Updated", page: tripPage(), purpose: "Full trip page with the road route, the people on the trip and every record.", blocks: [...tripTop(0), { t: "detail", cols: 5, rows: [["Customer", "Alex Mukasa"], ["Driver", "Brian Kato"], ["Truck", "Pickup"], ["Pickup", ROUTE[0]], ["Stops", `${STOPS[0]} · ${STOPS[1]}`], ["Loading", "1 helper"], ["Payer", "Ordering customer"], ["Method", "MTN Mobile Money"], ["Cargo", "Furniture boxes"], ["Created", "5 Nov 2026, 09:12"]] }, { t: "btns", items: [["Manage assignment", "outline"]] }], actions: [act("Load route", "POST /routes {orderId}", "Road route preview for staff with trip access; direct line if routing is unavailable.")] },
      { id: "a-trip-dispatch", name: "Trip page · driver requests", route: "trips (page › Driver requests)", page: tripPage(), purpose: "Every offer of this trip to a driver and its outcome. Declined and missed records are kept.", blocks: [...tripTop(2), { t: "timeline", items: [["Brian Kato · ◉Accepted", "Offered 09:14:02 · answered 09:14:19 · paired"], ["Grace Nambasa · ◉Missed", "Offered 09:13:15 · No response before the request expired"], ["Peter Wasswa · ◉Declined", "Offered 09:12:40 · answered 09:12:51 · Too far from me"]] }] },
      { id: "a-trip-timeline", name: "Trip page · timeline", route: "trips (page › Timeline)", page: tripPage(), blocks: [...tripTop(1), { t: "timeline", items: [["Searching", "09:12:31 · Order placed"], ["Assigned", "09:14:19 · Driver accepted"], ["At pickup", "09:31:47"], ["Stop 1 delivered", "10:02:10 · PIN confirmed"]] }] },
      { id: "a-trip-payments", name: "Trip page · payments & cash", route: "trips (page › Payments)", page: tripPage(), purpose: "Finance roles only. Refunds, payouts and cash reconciliation.", blocks: [...tripTop(3), { t: "detail", rows: [["Agreed fare", TOTAL], ["Platform fee", "UGX 7,950"], ["Driver entitlement", EARNING], ["Collection", "Paid"], ["Payout", "Scheduled"], ["Refunded", "UGX 0"]] }, { t: "h3", text: "Cash reconciliation" }, { t: "detail", rows: [["Cash declared", TOTAL], ["Fee due", "UGX 7,950"], ["Remitted", "UGX 0"]] }, { t: "btns", items: [["Issue refund", "outline"], ["Record cash fee remittance", "default"]] }], actions: [act("Record cash fee remittance", "POST /admin/cash", "Confirms receipt of the platform fee from the driver with a reference.", [hit("driver", "d-earnings", "Cash fee settled.")]), act("Issue refund / pay driver", "POST /orders/:id/admin", "Idempotent by key; success/pending/failed.", [hit("customer", "c-receipt", "Refund history row + “Refund issued”.")])] },
      { id: "a-assign", name: "Assign or reassign driver", route: "trips (form dialog)", page: tripPage(), dialog: true, behind: [tripTop(0)[1]], blocks: [{ t: "dialoghead", title: "Assign or reassign driver", sub: "Only verified online drivers with a suitable truck are listed." }, { t: "form", fields: [["Verified online driver", "Grace Nambasa · UBG 412 A"], ["Reason (required)", "Closest available truck", "area"]], submit: "Save changes" }], actions: [act("Save", "POST /admin/dispatch", "Previous driver record → withdrawn; new driver accepted (Assigned by operations).", [hit("driver", "d-notifications", "Previous driver: “Order reassigned”."), hit("customer", "c-order-assigned", "“Driver updated”.")])] },
    ],
  },
  {
    section: "People & fleet",
    screens: [
      { id: "a-drivers", name: "Drivers", route: "drivers", tag: "Updated", page: page("Drivers", "Accounts, vehicles, verification, availability and performance.", { add: "Add driver" }), blocks: [{ t: "chips", items: [["All drivers", 11], ["On trip", 4], ["Available", 2], ["Offline", 5], ["Awaiting verification", 1], ["Suspended", 1], ["Deactivated", 0]] }, { t: "table", search: "Name, driver ID, plate, phone or email", title: "", cols: ["Driver", "Contact", "Vehicle", "Now", "Verification", "Trips", "Acceptance", "Rating", "Earnings"], rows: [["Brian Kato\ndriver-1", "+256 700 000 222\nbrian@example.test", "UBB 920 B\nIsuzu Forward · Large truck", "◉On trip", "◉Approved", "51 done · 6 cancelled", "100%", "4.0 ★", "UGX 4,662,250"], ["Grace Nambasa\ndriver-2", "+256 700 000 223\ngrace@example.test", "UBG 412 A\nMitsubishi Canter · Medium", "◉Available", "◉Approved", "34 done · 2 cancelled", "88%", "4.2 ★", "UGX 2,374,050"], ["Harriet Ochieng\ndriver-104", "+256 770 400 404\nharriet@example.test", "UBD 259 J\nIsuzu NPR · Medium", "◉Offline", "◉Pending", "0 done · 0 cancelled", "—", "—", "UGX 0"]], pager: "1–3 of 11 records" }], actions: [act("Click a row", "—", "Opens the driver page /drivers/:id.")], notes: ["Trip, rating and earnings columns are not rendered for roles without trip or finance access (Field Agent)."] },
      { id: "a-driver-detail", name: "Driver page", route: "drivers (page /drivers/:id)", tag: "New", page: page("Brian Kato", "+256 700 000 222 · brian@example.test", { meta: "Driver · driver-1", back: true, badges: ["Active", "Online", "Approved"] }), purpose: "Everything about one driver: trips, transactions, requests, documents, support, notes and activity.", blocks: [personActions(true), { t: "metrics", items: [["Trips", "57", "1 active now"], ["Completed", "51", "89% of trips"], ["Cancelled", "6", "2 released by driver"], ["Earnings", "UGX 4,662,250", "Completed trips, after platform fee"]] }, { t: "notice", tone: "amber", text: `Current trip ${TRIP} · In transit · ${ROUTE[0]} → ${STOPS[1]}  →` }, { t: "tabs", items: ["Trips (57)", "Transactions (64)", "Profile", "Requests", "Documents", "Support (0)", "Notes (1)", "Activity"], active: 0 }, { t: "chips", items: [["All", 57], ["Active", 1], ["Completed", 51], ["Cancelled", 6]] }, { t: "table", search: "Search records…", title: "", cols: ["Trip", "Created", "Pickup", "Destination", "Customer", "Status", "Fare"], rows: [[TRIP, "5 Nov, 09:12", ROUTE[0], STOPS[1], "→Alex Mukasa", "◉In transit", TOTAL], ["LM-22B8E004", "4 Nov, 16:05", "Acacia Mall", "Kampala Road", "→Alex Mukasa", "◉Delivered", "UGX 47,000"]], pager: "1–10 of 57 records", pages: 6 }], actions: [act("Edit details", "POST /admin/user {name, phone, email}", "Duplicate phone/email rejected; audited."), act("Message", "POST /admin/message", "Appears in the driver’s Updates.", [hit("driver", "d-notifications", "Message from operations.")])] },
      { id: "a-driver-profile", name: "Driver page · profile & device", route: "drivers (page › Profile)", tag: "New", page: page("Brian Kato", "+256 700 000 222 · brian@example.test", { meta: "Driver · driver-1", back: true, badges: ["Active", "Online", "Approved"] }), purpose: "Edit contact details, number plate and profile photo in place; see the phone and app version the driver uses.", blocks: [personActions(true), { t: "tabs", items: ["Trips (57)", "Transactions (64)", "Profile", "Requests", "Documents", "Support (0)", "Notes (1)", "Activity"], active: 2 }, { t: "profile", meta: "Driver · driver-1", name: "Brian Kato", email: "brian@example.test", badges: ["Active", "Online", "Approved"], initials: "BK", photo: true, dirty: true, fields: [["Phone number", "+256 700 000 222", "Include the country code."], ["Car registration number plate", "UBB 921 C", "As shown on the vehicle registration."]], foot: "Update contact details, vehicle identification and profile photo." }, { t: "device", sub: "Reported by the Driver app each time it connects.", rows: [["Device", "Samsung Galaxy A15"], ["Device type", "Phone"], ["Operating system", "Android 14"], ["Device name", "Galaxy A15"], ["App version", "2.0.0"], ["Last active", "8 min ago"], ["First seen on this device", "11/11/2026, 05:22"]], earlier: [["TECNO Spark 20", "Android 13 · app 1.9.4 · last active 22/09/2026"]] }], actions: [act("Upload photo", "POST /admin/user {photo}", "JPG/PNG up to 5 MB, resized to 256 px in the browser; null removes it. The audit records only whether a photo is set."), act("Save changes", "POST /admin/user {phone, plate, photo, reason}", "Asks for a reason first. Phone and plate are checked for duplicates; plate changes are blocked during a trip.", [hit("driver", "d-notifications", "“Account updated” with the reason.")])], states: ["Save changes is disabled until something changes", "Upload a JPG or PNG image · PHOTO_INVALID", "Choose an image up to 5 MB · PHOTO_TOO_LARGE", "Another driver is registered with this plate · PLATE_EXISTS", "No device reported yet (account has not opened the app since device capture)"], notes: ["Shown only to roles with “Edit, suspend and deactivate accounts”; the App & device section is visible to anyone who can open the page.", "Device: the mobile apps send an X-Device header (URI-encoded JSON: platform, type, brand, model, osVersion, name, appVersion) on every request; the service keeps the current device and up to four earlier ones (recordDevice in services/demo/platform.mjs).", "iOS reports only iPhone or iPad, not the exact model (expo-device would add it, with a native rebuild)."] },
      { id: "a-driver-more", name: "Driver page · More actions", route: "drivers (page › More)", tag: "New", page: page("Brian Kato", "+256 700 000 222 · brian@example.test", { meta: "Driver · driver-1", back: true, badges: ["Active", "Online", "Approved"] }), purpose: "Account management for roles with “Edit, suspend and deactivate accounts”.", blocks: [personActions(true, true)], actions: [act("Edit vehicle", "POST /admin/user {vehicle, plate, truckId}", "Plate checked for duplicates; blocked during a trip."), act("Reset password", "POST /admin/user {resetPassword}", "Signs the driver out; temporary password must be changed at sign-in."), act("Set offline", "POST /admin/user {offline}", "Withdraws any open request.", [hit("driver", "d-home-offline", "Driver is offline; “You were set offline”.")]), act("Revoke verification", "POST /admin/user {verify:false}", "Driver offline and unverified until re-approved.", [hit("driver", "d-home-unverified", "Verification needed.")]), act("Suspend / deactivate", "POST /admin/user {status}", "Signs the account out everywhere; records kept.")] },
      { id: "a-driver-requests", name: "Driver page · requests & documents", route: "drivers (page › Requests)", page: page("Brian Kato", "+256 700 000 222 · brian@example.test", { meta: "Driver · driver-1", back: true, badges: ["Active", "Online", "Approved"] }), blocks: [personActions(true), { t: "tabs", items: ["Trips (57)", "Transactions (64)", "Profile", "Requests", "Documents", "Support (0)", "Notes (1)", "Activity"], active: 3 }, { t: "detail", cols: 5, rows: [["Accepted", "57"], ["Declined", "4"], ["Missed", "3"], ["Released", "2"], ["Acceptance rate", "89%"]] }, { t: "timeline", items: [[`${TRIP} · ◉Accepted`, `${ROUTE[0]} → ${STOPS[1]} · Offered 5 Nov, 09:14 · answered 09:14:19`], ["LM-5C0E9A17 · ◉Declined", "Acacia Mall → Kampala Road · Too far from me"]] }, { t: "h3", text: "Driver documents" }, { t: "table", open: false, cols: ["Document", "File", "Status", "Actions"], rows: [["Driver licence", "licence.jpg", "◉Approved", "Preview · Review"], ["Vehicle registration", "reg.jpg", "◉Pending", "Preview · Review"]] }], actions: [act("Review document", "POST /admin/document", "Approve / reject with reason.", [hit("driver", "d-verification", "Status badge + review note.")]), act("Approve driver", "POST /admin/user {verify:true}", "Requires vehicle + 4 approved documents (Field Agents may do this).", [hit("driver", "d-home-online", "Driver can go online.")])] },
      { id: "a-customers", name: "Customers", route: "customers", tag: "Updated", page: page("Customers", "Accounts, trips, payments and support history.", { add: "Add customer" }), blocks: [{ t: "chips", items: [["All customers", 52], ["Active", 50], ["Trip in progress", 7], ["No trips yet", 2], ["Suspended", 1], ["Deactivated", 1]] }, { t: "table", search: "Name, customer ID, phone or email", title: "", cols: ["Customer", "Contact", "Trips", "Rating", "Spent", "Last trip", "Account", "Joined"], rows: [["Alex Mukasa\ncustomer-1", "+256 700 000 111\nalex@example.test", "2 done · 0 cancelled", "4.0 ★", "UGX 332,000", "28 Oct 2026", "◉Active", "6 Jul 2026"], ["Sarah Nakato\ncustomer-2", "+256 700 000 112\nsarah@example.test", "8 done · 0 cancelled", "3.3 ★", "UGX 723,000", "1 Nov 2026", "◉Active", "9 Jun 2026"], ["Joseph Namubiru\ncustomer-101", "+256 770 800 800\njoseph.namubiru@example.test", "6 done · 2 cancelled", "3.7 ★", "UGX 607,500", "5 Nov 2026", "◉Active", "20 Sep 2026"]], pager: "1–10 of 52 records", pages: 6 }] },
      { id: "a-customer-detail", name: "Customer page · transactions", route: "customers (page /customers/:id)", tag: "New", page: page("Alex Mukasa", "+256 700 000 111 · alex@example.test", { meta: "Customer · customer-1", back: true, badges: ["Active"] }), purpose: "All trips (filter active, completed, cancelled) and every money movement for one customer.", blocks: [personActions(false), { t: "metrics", items: [["Trips", "3", "1 active now"], ["Completed", "2", "67% of trips"], ["Cancelled", "1", "Cancelled before collection"], ["Spent", "UGX 332,000", "Wallet balance UGX 226,000"]] }, { t: "tabs", items: ["Trips (3)", "Transactions (7)", "Profile", "Support (1)", "Notes (1)", "Activity"], active: 1 }, { t: "metrics", items: [["Wallet / account balance", "UGX 226,000", "Ledger account held by the platform"], ["Refunded", "UGX 0", "Across all trips"]] }, { t: "table", search: "Search records…", title: "", cols: ["Date", "Type", "Reference", "Trip", "Method", "Amount", "Status"], rows: [["5 Nov, 10:38", "Wallet top-up", "TOP-7A21", "—", "MTN Mobile Money", "+ UGX 50,000", "◉Completed"], ["28 Oct, 14:02", "Trip payment", "PAY-A9FCD891", "LM-C3904CE2", "MTN Mobile Money", "− UGX 34,500", "◉Paid"]], pager: "1–7 of 7 records" }] },
      { id: "a-customer-profile", name: "Customer page · profile & device", route: "customers (page › Profile)", tag: "New", page: page("Alex Mukasa", "+256 700 000 111 · alex@example.test", { meta: "Customer · customer-1", back: true, badges: ["Active"] }), purpose: "The same profile card as drivers, with email in place of the number plate, and the customer’s phone and app version.", blocks: [personActions(false), { t: "tabs", items: ["Trips (3)", "Transactions (7)", "Profile", "Support (1)", "Notes (1)", "Activity"], active: 2 }, { t: "profile", meta: "Customer · customer-1", name: "Alex Mukasa", email: "alex@example.test", badges: ["Active"], initials: "AM", fields: [["Phone number", "+256 700 000 111", "Include the country code."], ["Email", "alex@example.test", "Optional. Used for receipts and sign-in."]], foot: "Update contact details and profile photo." }, { t: "device", sub: "Reported by the Customer app each time it connects.", rows: [["Device", "Apple iPhone"], ["Device type", "Phone"], ["Operating system", "iOS 18.1"], ["Device name", "Alex’s iPhone"], ["App version", "2.0.0"], ["Last active", "2 h ago"], ["First seen on this device", "15/08/2026, 05:31"]] }], actions: [act("Save changes", "POST /admin/user {phone, email, photo, reason}", "Asks for a reason first; duplicate phone or email is rejected.", [hit("customer", "c-notifications", "“Account updated” with the reason.")])], notes: ["Device: the mobile apps send an X-Device header (URI-encoded JSON: platform, type, brand, model, osVersion, name, appVersion) on every request; the service keeps the current device and up to four earlier ones (recordDevice in services/demo/platform.mjs)."] },
    ],
  },
  {
    section: "Money & control",
    screens: [
      { id: "a-payments", name: "Collections", route: "payments", page: page("Collections", "Trip payments, retries, refunds and exceptions."), blocks: [{ t: "metrics", items: [["Confirmed collections", "UGX 19,517,500", "Gross successful collections"], ["Refunds issued", "UGX 343,650", "Credited to the payer"], ["Payment exceptions", "22", "Failed or awaiting confirmation"], ["Awaiting payment", "UGX 2,584,000", "Outstanding obligations"]] }, { t: "table", search: "Search records…", filters: ["All"], title: "", cols: ["Trip", "Customer", "Fare", "Method", "Collection", "Refunded", "Driver payout"], rows: [[TRIP, "→Alex Mukasa", TOTAL, "MTN Mobile Money", "◉Paid", "UGX 0", "◉Scheduled"], ["LM-22B8E004", "→Alex Mukasa", "UGX 47,000", "Cash collection", "◉Paid", "UGX 0", "◉Retained"], ["LM-5C0E9A17", "→Sarah Nakato", "UGX 52,000", "Airtel Money", "◉Failed", "UGX 0", "◉Not earned"]], pager: "1–10 of 253 records", pages: 26 }] },
      { id: "a-payouts", name: "Driver payouts", route: "payouts", page: page("Driver payouts", "Payout requests and scheduled driver earnings."), blocks: [{ t: "table", title: "Payout requests", count: "24 records", cols: ["Request", "Driver", "Amount", "Status", "Review"], rows: [["WD-0581F29B", "→Henry Nalwoga", "UGX 643,450", "◉Requested", "Review request"], ["WD-B8EB793F", "→Brian Kato", "UGX 605,200", "◉Paid", "Weekly settlement"], ["WD-7CC78950", "→Henry Nalwoga", "UGX 330,650", "◉Rejected", "Bank details need confirming"]] }, { t: "table", title: "Completed delivery earnings", count: "256 records", cols: ["Trip", "Driver", "Entitlement", "Customer collection", "Payout status"], rows: [[TRIP, "→Brian Kato", EARNING, "◉Paid", "◉Scheduled"]] }], actions: [act("Approve and pay", "POST /admin/withdrawal", "Pays each trip (settlement or platform guarantee).", [hit("driver", "d-payouts", "Request → Paid.")])] },
      { id: "a-transfers", name: "Transfers & ledger", route: "transfers", page: page("Transfers & ledger", "Account balances, transfers and double-entry ledger.", { add: "New transfer" }), blocks: [{ t: "metrics", items: [["Platform", "UGX 3,928,150", "Platform funding reserve"], ["Settlement", "UGX 9,988,425", "Collected funds available for settlement"]] }, { t: "table", title: "Balanced ledger", count: "433 records", cols: ["Entry", "Operation", "Reference", "Debit account", "Credit account", "Balanced amount"], rows: [["LED-EBCEEF68", "collection", "LM-6B068611", "external-customer", "settlement", "UGX 108,000"], ["LED-BCBBB2F9", "cash.fee_remittance", "LM-E7209E1B", "driverCash:driver-1", "settlement", "UGX 24,000"]] }] },
      { id: "a-reconciliation", name: "Reconciliation", route: "reconciliation", page: page("Reconciliation", "Match provider settlement reports to payments.", { add: "Import report" }), blocks: [{ t: "table", title: "Latest run", cols: ["Provider reference", "Trip", "Amount", "Match result"], rows: [["PAY-91C2D0AA", TRIP, TOTAL, "◉Matched"], ["PAY-0000FFFF", "—", "UGX 9,000", "◉Unexpected"]] }] },
      { id: "a-methods", name: "Payment methods", route: "methods", page: page("Payment methods", "Saved customer and driver methods (masked)."), blocks: [{ t: "table", title: "Saved methods", cols: ["Account owner", "Role", "Method", "Label", "Account", "Default"], rows: [["→Alex Mukasa", "Customer", "MTN Mobile Money", "Demo MTN account", "•••• 0111", "Yes"], ["→Sarah Nakato", "Customer", "Airtel Money", "Work Airtel", "•••• 4821", "No"]] }] },
      { id: "a-rewards", name: "Referrals & cashbacks", route: "rewards", page: page("Referrals & cashbacks", "Trip-linked rewards awaiting approval or paid.", { add: "New reward" }), blocks: [{ t: "table", title: "Rewards", cols: ["Type", "Recipient", "Trip", "Reward", "Status", "Action"], rows: [["Cashback", "→Alex Mukasa", TRIP, "UGX 2,000", "◉Pending", "Pay reward"]] }] },
    ],
  },
  {
    section: "Management",
    screens: [
      { id: "a-support", name: "Support", route: "support", page: page("Support", "Customer and driver cases, trip issues and replies."), blocks: [{ t: "table", search: "Search records…", filters: ["All"], title: "", cols: ["Case", "Account", "Subject", "Issue", "Status", "Linked trip"], rows: [["CASE-3DABDC08", "→Julius Nalwoga", "Trip LM-99179202", "One carton was damp on arrival.", "◉Open", "LM-99179202"], ["CASE-34D10070", "→Fred Akello", "Trip LM-369C1412", "Delivery took much longer than estimated.", "◉Open", "LM-369C1412"]], pager: "1–10 of 20 records", pages: 2 }], actions: [act("Reply / resolve", "POST /admin/support", "Adds reply + status.", [hit("customer", "c-notifications", "“Support replied” notification.")])] },
      { id: "a-staff", name: "Staff & roles", route: "staff", tag: "Updated", page: page("Staff & roles", "Staff accounts, roles and permissions.", { add: "Invite staff" }), purpose: "Super Admin only. Staff accounts plus roles that can be created, edited and deleted.", blocks: [{ t: "table", title: "Staff", cols: ["Staff member", "Email", "Role", "Status", "Setup", "Actions"], rows: [["Irene Nakiwala", "irene@loadmaster.test", "Super Admin", "◉Active", "Complete", "You · edit from My profile"], ["Daniel Okello", "daniel@loadmaster.test", "Admin", "◉Active", "Complete", "Edit account · Reset"], ["Joan Auma", "joan@loadmaster.test", "Customer Care", "◉Active", "Complete", "Edit account · Reset"]] }, { t: "table", title: "Roles", add: "New role", cols: ["Role", "Permissions", "Staff", ""], rows: [["Super Admin\nFull access, including staff and roles.", "All 19 permissions", "1", "◉Fixed"], ["Team Lead\nBroad operational access, no finance.", "Dashboard · Trips · Tracking · Edit accounts · Approve drivers · Audit · Reports", "1", "Edit · Delete"], ["Field Agent\nDriver documents and verification.", "Drivers · Customers · Approve drivers · Review & upload documents", "1", "Edit · Delete"]] }], actions: [act("Invite staff", "POST /admin/staff {mode:create}", "Temporary password; first sign-in sets a new one.")] },
      { id: "a-role-edit", name: "Edit role", route: "staff (role dialog)", tag: "New", page: page("Staff & roles", "Staff accounts, roles and permissions."), dialog: true, dialogWidth: 640, purpose: "Roles are data: rename, describe and choose permissions. Super Admin is fixed; a role in use cannot be deleted.", blocks: [{ t: "dialoghead", title: "Edit role · Team Lead", sub: "Changes apply to everyone with this role on their next request." }, { t: "form", fields: [["Role name", "Team Lead"], ["Description", "Broad operational access, no finance."], ["Permissions", "✓Dashboard|✓Trips: view and manage|✓Driver tracking map|✓Drivers: view|✓Customers: view|✓Edit, suspend and deactivate accounts|✓Approve drivers|✓Review driver documents|✓Upload driver documents|Delete driver documents|✓Resolve cargo exceptions|Payments, payouts and ledger|✓Support cases and messages|Referrals and cashbacks|✓Reports|✓View admin actions|Platform settings|Staff section|Manage staff and roles", "checks"], ["Reason (required)", "Team leads now handle support escalations", "area"]], submit: "Save changes" }], actions: [act("Save role", "POST /admin/role {mode:update, permissions}", "Holders get the new permissions immediately; audited."), act("Delete role", "POST /admin/role {mode:delete}", "Refused with ROLE_IN_USE while staff hold the role.")] },
      { id: "a-audit", name: "Audit trail", route: "audit", page: page("Audit trail", "Every action, who performed it and why."), blocks: [{ t: "table", search: "Search records…", filters: ["All actors"], title: "", cols: ["Timestamp", "Actor", "Action", "Target", "Reason"], rows: [["5 Nov, 09:14:19", "Brian Kato", "Order accepted", TRIP, "—"], ["5 Nov, 09:14:00", "Grace Nambasa", "Offer missed", TRIP, "—"], ["5 Nov, 09:12:51", "Peter Wasswa", "Order declined", TRIP, "Too far from me"], ["5 Nov, 08:30:02", "Irene Nakiwala", "Role updated", "Team Lead", "Team leads now handle support escalations"]], pager: "1–10 of 3,382 records", pages: 339 }], notes: ["Actor names are shown only to roles with “View admin actions”."] },
      { id: "a-reports", name: "Reports", route: "reports", page: page("Reports", "Delivery, cancellation and driver performance."), blocks: [{ t: "metrics", items: [["Completed deliveries", "256", "Recorded delivery handovers"], ["Cancellations", "36", "Cancelled before cargo handling"], ["Open issues", "11", "Trip-linked support cases"], ["Registered drivers", "11", "Across all verification states"]] }, { t: "table", title: "Driver activity", cols: ["Driver", "Completed", "Cancelled", "Delivery value", "Driver entitlement"], rows: [["→Brian Kato", "51", "6", "UGX 5,485,000", "UGX 4,662,250"], ["→Moses Okello", "54", "2", "UGX 6,232,000", "UGX 5,297,200"]] }] },
      { id: "a-settings", name: "Settings", route: "settings", page: page("Settings", "Pricing and dispatch rules for new trips."), blocks: [{ t: "section", title: "Pricing & service", blocks: [{ t: "detail", rows: [["Platform fee", "15%"], ["Handling per helper, per location", "UGX 12,000"], ["Driver response window", "45 seconds"], ["Service area", "Kampala & Wakiso"], ["Payment environment", "Simulated Mobile Money, card & cash"]] }, { t: "btns", items: [["Edit pricing rules", "default"]] }] }], actions: [act("Edit pricing rules", "POST /admin/settings {feeRate, helperRate, offerSeconds}", "Response window 15–300 s applies to new offers.", [hit("driver", "d-home-offer", "Countdown length changes for new requests.")])] },
    ],
  },
];

// ---------- cross-app flows ----------
const flows = [
  { id: "f-order-dispatch", title: "1 · Customer orders → request reaches drivers", summary: "The 4-step wizard creates the order in stage searching. A paired driver is offered first; otherwise eligible online drivers are offered one at a time, each with a response window.", steps: [
    { lane: "customer", col: 0, screen: "c-wiz-truck", label: "Truck & destinations" },
    { lane: "customer", col: 1, screen: "c-wiz-pay", label: "Payment & pairing", api: "POST /account/pair" },
    { lane: "customer", col: 2, screen: "c-wiz-review", label: "Order a truck", api: "POST /quotes → POST /orders" },
    { lane: "system", col: 3, label: "Order created · stage searching", api: "Idempotency-Key dedupes retries" },
    { lane: "customer", col: 4, screen: "c-order-searching", label: "Searching for a driver" },
    { lane: "driver", col: 4, screen: "d-home-offer", label: "Request offered · countdown" },
    { lane: "admin", col: 4, screen: "a-trip-dispatch", label: "Trip Searching · record Offered" },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4, "2 s poll"], [3, 5, "next poll"], [3, 6, "4 s poll"]] },
  { id: "f-accept", title: "2 · Driver accepts → everyone tracks the delivery", summary: "Accepting assigns the order and withdraws other open offers. All three apps follow the same order record.", steps: [
    { lane: "driver", col: 0, screen: "d-offer", label: "Accept this order", api: "POST /orders/:id/accept" },
    { lane: "system", col: 1, label: "stage → assigned · dispatch accepted · others withdrawn" },
    { lane: "customer", col: 2, screen: "c-order-assigned", label: "Driver assigned + handover codes" },
    { lane: "driver", col: 2, screen: "d-order-pickup", label: "Delivery screen" },
    { lane: "admin", col: 2, screen: "a-trip-dispatch", label: "Record Accepted" },
    { lane: "driver", col: 3, row: 1, screen: "d-request-history", label: "Other drivers: “No longer available”" },
  ], edges: [[0, 1], [1, 2], [1, 3], [1, 4], [1, 5]] },
  { id: "f-decline", title: "3 · Driver declines → record stays, next driver offered", summary: "The declined record and reason remain in the driver’s request history and the admin Driver requests tab. The customer keeps waiting.", steps: [
    { lane: "driver", col: 0, screen: "d-offer", label: "Decline request" },
    { lane: "driver", col: 1, screen: "d-decline", label: "Reason · confirm decline", api: "POST /orders/:id/decline {reason}" },
    { lane: "system", col: 2, label: "dispatch → declined · offer next eligible driver" },
    { lane: "driver", col: 3, screen: "d-request-history", label: "Declined record kept" },
    { lane: "admin", col: 3, screen: "a-trip-dispatch", label: "Declined + reason" },
    { lane: "admin", col: 4, screen: "a-driver-detail", label: "Decline count · acceptance rate" },
    { lane: "customer", col: 3, screen: "c-order-searching", label: "Still searching" },
  ], edges: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [2, 6, "no change"]] },
  { id: "f-missed", title: "4 · Driver misses the request → timeout", summary: "When the window passes without an answer, the next server tick marks the offer missed, notifies the driver and offers the order to the next driver.", steps: [
    { lane: "driver", col: 0, screen: "d-home-offer", label: "Countdown runs out" },
    { lane: "system", col: 1, label: "tick(): expiresAt ≤ now → missed" },
    { lane: "driver", col: 2, screen: "d-offer-missed", label: "“You missed this request”" },
    { lane: "driver", col: 3, screen: "d-notifications", label: "“Request missed” notice" },
    { lane: "admin", col: 2, screen: "a-trip-dispatch", label: "Record Missed" },
    { lane: "customer", col: 2, screen: "c-order-searching", label: "Still searching" },
  ], edges: [[0, 1], [1, 2], [2, 3], [1, 4], [1, 5, "no change"]] },
  { id: "f-tracking", title: "5 · Multi-stop delivery with PIN handover", summary: "Each driver tap advances one stage; each stop is handed over with the recipient’s PIN or a confirmation. Apps converge within one poll (customer 2 s, admin 4 s).", steps: [
    { lane: "driver", col: 0, screen: "d-order-pickup", label: "Start trip / at pickup", api: "POST /orders/:id/advance" },
    { lane: "driver", col: 1, screen: "d-order-handover", label: "Stop handover · PIN", api: "advance {pin, confirmed}" },
    { lane: "customer", col: 0, screen: "c-order-assigned", label: "Codes shared with recipients" },
    { lane: "customer", col: 1, screen: "c-order-transit", label: "Stop 1 delivered · next stop" },
    { lane: "customer", col: 2, screen: "c-order-delivered", label: "All stops delivered" },
    { lane: "admin", col: 1, screen: "a-trip-timeline", label: "Timeline entries per stop" },
  ], edges: [[0, 1], [0, 2], [1, 3], [3, 4], [1, 5]] },
  { id: "f-payment", title: "6 · Payment after handover", summary: "Delivery creates a payment attempt. Uncertain results are checked before retrying. The payer can be the customer or the stop-1 recipient.", steps: [
    { lane: "driver", col: 0, screen: "d-order-handover", label: "Final stop delivered" },
    { lane: "customer", col: 1, screen: "c-payment-due", label: "Approve", api: "POST /orders/:id/payment" },
    { lane: "customer", col: 2, row: 1, screen: "c-payment-unknown", label: "Delayed → check status" },
    { lane: "customer", col: 2, row: 2, screen: "c-payment-recipient", label: "Recipient payer → share link" },
    { lane: "customer", col: 3, screen: "c-receipt", label: "Receipt" },
    { lane: "admin", col: 3, screen: "a-payments", label: "Collection Paid" },
    { lane: "admin", col: 4, screen: "a-payouts", label: "Entitlement Scheduled" },
  ], edges: [[0, 1], [1, 2], [1, 3], [1, 4, "success"], [2, 4, "resolved"], [4, 5], [5, 6]] },
  { id: "f-cash", title: "7 · Cash collection & remittance", summary: "For cash orders the driver records cash received, the payer confirms it, and finance records the platform-fee remittance. The driver’s retained earning is never paid twice.", steps: [
    { lane: "driver", col: 0, screen: "d-cash", label: "Record cash received", api: "POST /orders/:id/cargo {cash-received}" },
    { lane: "customer", col: 1, screen: "c-payment-cash", label: "Confirm cash payment" },
    { lane: "admin", col: 2, screen: "a-trip-payments", label: "Cash reconciliation · remittance", api: "POST /admin/cash" },
    { lane: "driver", col: 3, screen: "d-earnings", label: "Earning retained" },
  ], edges: [[0, 1], [1, 2], [2, 3]] },
  { id: "f-release", title: "8 · Driver releases an accepted delivery", summary: "Before loading, a driver can back out. The order returns to searching instead of being cancelled.", steps: [
    { lane: "driver", col: 0, screen: "d-order-pickup", label: "Release this delivery" },
    { lane: "driver", col: 1, screen: "d-release", label: "Reason · confirm", api: "POST /orders/:id/cancel (driver)" },
    { lane: "system", col: 2, label: "stage → searching · dispatch released" },
    { lane: "customer", col: 3, screen: "c-order-searching", label: "“Finding a new driver”" },
    { lane: "admin", col: 3, screen: "a-trip-dispatch", label: "Released + reason" },
  ], edges: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  { id: "f-cancel", title: "9 · Customer cancels", summary: "Allowed until cargo is collected. Open offers are withdrawn so drivers see why the request disappeared.", steps: [
    { lane: "customer", col: 0, screen: "c-order-cancel", label: "Confirm cancellation", api: "POST /orders/:id/cancel" },
    { lane: "system", col: 1, label: "stage → cancelled · offers withdrawn" },
    { lane: "driver", col: 2, screen: "d-request-history", label: "“Customer cancelled the order”" },
    { lane: "admin", col: 2, screen: "a-trips", label: "Status Cancelled" },
  ], edges: [[0, 1], [1, 2], [1, 3]] },
  { id: "f-chat", title: "10 · Delivery messages", summary: "After acceptance, customer and driver exchange messages and quick replies on the order.", steps: [
    { lane: "customer", col: 0, screen: "c-chat", label: "Send message", api: "POST /orders/:id/cargo {message}" },
    { lane: "driver", col: 1, screen: "d-order-pickup", label: "Messages & quick replies" },
  ], edges: [[0, 1]] },
  { id: "f-onboarding", title: "11 · Driver onboarding & approval", summary: "Drivers submit vehicle and four documents; staff review and approve, then the driver can go online.", steps: [
    { lane: "driver", col: 0, screen: "d-home-unverified", label: "Verification needed" },
    { lane: "driver", col: 1, screen: "d-verification", label: "Upload documents", api: "POST /account/document" },
    { lane: "admin", col: 2, screen: "a-driver-detail", label: "Review · approve", api: "POST /admin/document · /admin/user" },
    { lane: "driver", col: 3, screen: "d-home-online", label: "Go online" },
    { lane: "admin", col: 4, screen: "a-drivers", label: "Availability Online" },
  ], edges: [[0, 1], [1, 2], [2, 3, "approved"], [3, 4]] },
  { id: "f-reassign", title: "12 · Operations reassigns a driver", summary: "Staff with trip access can assign any verified online driver with a suitable truck before cargo is collected.", steps: [
    { lane: "admin", col: 0, screen: "a-trip-details", label: "Manage assignment" },
    { lane: "admin", col: 1, screen: "a-assign", label: "Choose driver + reason", api: "POST /admin/dispatch" },
    { lane: "driver", col: 2, screen: "d-notifications", label: "Old driver: “Order reassigned”" },
    { lane: "driver", col: 2, row: 1, screen: "d-order-pickup", label: "New driver: delivery screen" },
    { lane: "customer", col: 2, screen: "c-order-assigned", label: "“Driver updated”" },
  ], edges: [[0, 1], [1, 2], [1, 3], [1, 4]] },
  { id: "f-payout", title: "13 · Driver payout request", summary: "Drivers request all scheduled earnings; finance approves and pays every included trip, or rejects with a reason.", steps: [
    { lane: "driver", col: 0, screen: "d-earnings", label: "Scheduled earnings" },
    { lane: "driver", col: 1, screen: "d-payouts", label: "Request payout", api: "POST /account/withdrawal" },
    { lane: "admin", col: 2, screen: "a-payouts", label: "Approve & pay", api: "POST /admin/withdrawal" },
    { lane: "driver", col: 3, screen: "d-notifications", label: "“Payout request paid”" },
  ], edges: [[0, 1], [1, 2], [2, 3]] },
  { id: "f-live-tracking", title: "14 · Live tracking across all three apps", summary: "Each driver stage update moves the truck on the customer map, the admin fleet map and the admin trip page within one poll (customer 2 s, admin 4 s). Positions are simulated from the stage.", steps: [
    { lane: "driver", col: 0, screen: "d-order-pickup", label: "Advance stage", api: "POST /orders/:id/advance" },
    { lane: "system", col: 1, label: "Stage saved · timeline entry · audit" },
    { lane: "customer", col: 2, screen: "c-order-transit", label: "Progress + map update" },
    { lane: "admin", col: 2, screen: "a-tracking-selected", label: "Pin moves · trip panel" },
    { lane: "admin", col: 3, screen: "a-trip-details", label: "Route map · stops", api: "POST /routes {orderId}" },
  ], edges: [[0, 1], [1, 2, "2 s poll"], [1, 3, "4 s poll"], [3, 4]] },
  { id: "f-manage-driver", title: "15 · Operations manage a driver account", summary: "From the driver page, staff with “Edit, suspend and deactivate accounts” can set a driver offline, revoke verification, suspend, deactivate or reset a password. Each needs a reason and is audited.", steps: [
    { lane: "admin", col: 0, screen: "a-drivers", label: "Find driver · open row" },
    { lane: "admin", col: 1, screen: "a-driver-detail", label: "Driver page" },
    { lane: "admin", col: 2, screen: "a-driver-more", label: "More → Set offline / Suspend", api: "POST /admin/user" },
    { lane: "system", col: 3, label: "Open offers withdrawn · sessions revoked · audit" },
    { lane: "driver", col: 4, screen: "d-home-offline", label: "Offline · “You were set offline”" },
    { lane: "admin", col: 4, screen: "a-audit", label: "Attributed to the staff member" },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]] },
  { id: "f-roles", title: "16 · Super Admin edits a role", summary: "Roles are records with permissions. Editing one changes what everyone in it can see and do on their next request; sections they lose are not rendered at all.", steps: [
    { lane: "admin", col: 0, screen: "a-staff", label: "Roles table · Edit" },
    { lane: "admin", col: 1, screen: "a-role-edit", label: "Choose permissions", api: "POST /admin/role" },
    { lane: "system", col: 2, label: "Role saved · holders re-scoped · audit" },
    { lane: "admin", col: 3, screen: "a-drivers", label: "Holder sees new columns/actions" },
  ], edges: [[0, 1], [1, 2], [2, 3]] }
];

// ---------- state machines ----------
const machines = [
  {
    id: "m-order",
    title: "Order stages",
    source: "packages/contracts Stage · services/demo/model.mjs advance()",
    states: ["scheduled", "searching", "assigned", "to_pickup", "at_pickup", "loading", "in_transit", "at_destination", "offloading", "delivered", "cancelled"],
    transitions: [
      ["scheduled", "searching", "time due"],
      ["searching", "assigned", "driver accepts / ops assigns"],
      ["assigned", "to_pickup", "driver"],
      ["to_pickup", "at_pickup", "driver"],
      ["at_pickup", "loading", "driver"],
      ["loading", "in_transit", "driver"],
      ["in_transit", "at_destination", "driver"],
      ["at_destination", "offloading", "driver"],
      ["offloading", "delivered", "driver confirms handover"],
      ["assigned", "searching", "driver releases"],
      ["searching", "cancelled", "customer cancels"],
    ],
  },
  {
    id: "m-dispatch",
    title: "Driver request (dispatch) outcomes",
    source: "packages/contracts DispatchStatus · model.mjs currentOffer()/expireOffers()",
    states: ["offered", "accepted", "declined", "missed", "withdrawn", "released"],
    transitions: [
      ["offered", "accepted", "driver accepts"],
      ["offered", "declined", "driver declines (reason optional)"],
      ["offered", "missed", "no answer within offerSeconds"],
      ["offered", "withdrawn", "taken by another / cancelled / driver offline"],
      ["accepted", "released", "driver backs out before loading"],
      ["accepted", "withdrawn", "ops reassigns"],
    ],
  },
];

export const tokens = {
  // packages/mobile/src/ui.tsx (C) — driver home, lists and account screens.
  mobile: { ink: "#142D28", muted: "#6D7C76", green: "#08784D", lime: "#DBF394", mint: "#EAF4ED", paper: "#F6F8F4", line: "#DFE7DF", red: "#A62F37", amber: "#8A5911", white: "#FFFFFF", heroFrom: "#173F30", heroTo: "#08784D" },
  // packages/mobile/src/customerTheme.ts — customer home and every Cargo* screen.
  cargo: { ink: "#111827", muted: "#6B7280", green: "#087443", line: "#E5E7EB", paper: "#FAFBFA", mint: "#F0FCF4", white: "#FFFFFF" },
  // apps/admin/src/index.css
  admin: { background: "#FFFFFF", foreground: "#18181B", primary: "#087443", sidebar: "#FAFAFA", sidebarText: "#3F3F46", border: "#E4E4E7", muted: "#F4F4F5", mutedText: "#71717A", destructive: "#B91C1C", accent: "#F4F4F5" },
};

export const spec = {
  name: "LoadMaster V2 · Developer handoff",
  version: 1,
  tokens,
  apps: [
    { id: "customer", name: "Customer app", platform: "mobile", tabs: ["Home", "Orders", "Payments", "Account"], sections: customer },
    { id: "driver", name: "Driver app", platform: "mobile", tabs: ["Home", "Deliveries", "Earnings", "Account"], sections: driver },
    {
      id: "admin",
      name: "Admin portal",
      platform: "web",
      // nav is read from apps/admin/src/App.tsx by scripts/handoff.mjs.
      sections: admin,
    },
  ],
  flows,
  machines,
  sync: [
    "All three apps read one shared order record from the demo service.",
    "Customer & Driver apps poll GET /snapshot every 2 s and on app foreground; Admin polls GET /admin every 4 s.",
    "Mutations call refresh() immediately; a refresh requested during a poll is queued, not dropped.",
    "Real-time = within one poll interval. Push/websockets are not implemented.",
  ],
};

/** Vector icons drawn by the plugin (Lucide-style 24 px paths; "C" = icon colour). */
export const icons = {
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "help-circle": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  "clipboard-check": '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  "wallet-cards": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="C"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  star: '<path fill="C" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
  "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  "arrow-up-right": '<path d="M7 7h10v10M7 17 17 7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  package: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  navigation: '<path d="M3 11 22 2l-9 19-2-8-8-2z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  transfer: '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
  reconcile: '<path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  support: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
  settings: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 8h8M8 12h8"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5" fill="C"/>',
  signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
  battery: '<rect width="16" height="10" x="2" y="7" rx="2"/><rect width="9" height="4" x="5" y="10" rx="1" fill="C" stroke="none"/><path d="M22 11v2"/>',
  pencil: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  dot: '<circle cx="12" cy="12" r="5" fill="C"/>',
  ring: '<circle cx="12" cy="12" r="6"/>',
};
