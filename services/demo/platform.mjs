import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Store, DomainError, trucks, places, seed } from "./model.mjs";
const uid = (p) => `${p}-${randomUUID().slice(0, 8).toUpperCase()}`;
const now = () => new Date().toISOString();
const check = (ok, code, message, status = 422) => {
  if (!ok) throw new DomainError(code, message, status);
};
const hash = (password) => {
  const salt = randomUUID();
  return salt + ":" + scryptSync(password, salt, 32).toString("hex");
};
const verify = (password, stored) => {
  if (typeof password !== "string" || !stored) return false;
  const [salt, value] = stored.split(":");
  const digest = scryptSync(password, salt, 32);
  return (
    value?.length === 64 && timingSafeEqual(digest, Buffer.from(value, "hex"))
  );
};
const safe = (p) => {
  const { passwordHash, ...v } = p;
  if (v.documents) v.documents = v.documents.map(({ content, ...d }) => d);
  return v;
};
export const roles = [
  "Super Admin",
  "Admin",
  "Team Lead",
  "Field Agent",
  "Customer Care",
];
/** Every permission a role can hold, with the label shown in the role editor. */
export const permissionCatalog = [
  ["overview", "Dashboard"],
  ["orders", "Trips: view and manage"],
  ["tracking", "Driver tracking map"],
  ["drivers", "Drivers: view"],
  ["customers", "Customers: view"],
  ["accounts.edit", "Edit, suspend and deactivate accounts"],
  ["drivers.verify", "Approve drivers"],
  ["documents.review", "Review driver documents"],
  ["documents.upload", "Upload driver documents"],
  ["documents.delete", "Delete driver documents"],
  ["cargo.supervise", "Resolve cargo exceptions (PIN, returns)"],
  ["finance", "Payments, payouts and ledger"],
  ["support", "Support cases and messages"],
  ["rewards", "Referrals and cashbacks"],
  ["reports", "Reports"],
  ["audit", "View admin actions"],
  ["settings", "Platform settings"],
  ["staff", "Staff section"],
  ["staff.write", "Manage staff and roles"],
];
const ALL = permissionCatalog.map(([k]) => k);
const OPS = [
  "overview",
  "orders",
  "tracking",
  "drivers",
  "customers",
  "accounts.edit",
  "drivers.verify",
  "documents.review",
  "documents.upload",
  "cargo.supervise",
  "support",
  "audit",
  "reports",
];
/** Default roles (Account Management spec). Only Super Admin is fixed. */
export const defaultRoles = () => [
  {
    name: "Super Admin",
    system: true,
    description: "Full access, including staff and roles.",
    permissions: ALL,
  },
  {
    name: "Admin",
    description: "Whole portal except staff accounts and settings.",
    permissions: [...OPS, "finance"],
  },
  {
    name: "Team Lead",
    description: "Broad operational access, no finance.",
    permissions: OPS,
  },
  {
    name: "Field Agent",
    description: "Driver documents and verification; no trips or money.",
    permissions: [
      "drivers",
      "customers",
      "drivers.verify",
      "documents.review",
      "documents.upload",
    ],
  },
  {
    name: "Customer Care",
    description: "Customer support, trips and messages.",
    permissions: [
      "overview",
      "orders",
      "drivers",
      "customers",
      "documents.upload",
      "support",
    ],
  },
];
export class PlatformStore extends Store {
  constructor(file) {
    super(file);
    this.ensure();
  }
  ensure() {
    const s = this.state;
    s.sessions ??= {};
    s.challenges ??= {};
    s.tickets ??= [];
    s.transfers ??= [];
    s.operations ??= [];
    s.withdrawals ??= [];
    s.reconciliations ??= [];
    s.rewards ??= [];
    s.savedPlaces ??= {};
    s.customPlaces ??= [];
    s.notifications ??= [];
    s.settings ??= {
      feeRate: s.feeRate,
      helperRate: s.helperRate,
      serviceArea: "Kampala & Wakiso",
      demo: true,
    };
    s.settings.offerSeconds ??= s.offerSeconds;
    s.ledger ??= [];
    s.walletTopups ??= [];
    s.accountNotes ??= [];
    // Saved demo state from before new seed accounts were added gets them too.
    for (const p of seed().profiles)
      if (!s.profiles.some((x) => x.id === p.id)) s.profiles.push(p);
    s.accounts ??= {
      platform: s.funding,
      settlement: Math.max(
        0,
        s.orders.reduce(
          (n, o) =>
            n +
            (o.payment.status === "paid" ? o.quote.total : 0) -
            o.financial.refunded -
            o.financial.events
              .filter((e) => e.kind === "payout")
              .reduce((n, e) => n + e.amount, 0),
          0,
        ),
      ),
    };
    s.roles ??= defaultRoles();
    s.staff ??= roles.map((role, i) => ({
      id: "staff-" + (i + 1),
      name: [
        "Irene Nakiwala",
        "Daniel Okello",
        "Rita Namara",
        "Peter Ssemanda",
        "Joan Auma",
      ][i],
      email:
        ["irene", "daniel", "rita", "peter", "joan"][i] + "@loadmaster.test",
      phone: "+25670000030" + i,
      role,
      status: "active",
      createdAt: now(),
      passwordHash: hash("DemoCargo2026!"),
      forceReset: false,
    }));
    for (const p of s.profiles) {
      p.status ??= "active";
      p.phoneVerified ??= true;
      p.passwordHash ??= hash("DemoCargo2026!");
      p.createdAt ??= now();
      p.paymentMethods ??= [
        {
          id: "method-mtn",
          kind: "mtn",
          last4: "0111",
          label: "Demo MTN account",
          isDefault: true,
        },
      ];
      p.preferences ??= { notifications: true, hideAmounts: false };
      if (p.role === "driver") {
        p.documents ??= [];
        p.vehicleStatus ??= p.verified ? "approved" : "not_submitted";
        if (p.verified && !p.documents.length)
          p.documents = [
            "Driver licence",
            "Identity document",
            "Vehicle registration",
            "Third-party insurance",
          ].map((name) => ({
            id: uid("DOC"),
            name,
            status: "approved",
            fileName: "Seeded demo document",
            createdAt: now(),
            demo: true,
          }));
      }
      s.accounts[p.id] ??= 0;
    }
  }
  profile(id) {
    return super.profile(id);
  }
  /**
   * Records the device a customer or driver is using, from the X-Device
   * header the mobile app sends with every request (URI-encoded JSON).
   * Keeps the current device plus up to four earlier ones.
   */
  recordDevice(actor, header) {
    if (!header || !actor) return;
    const p = this.state.profiles.find((x) => x.id === actor);
    if (!p || !["customer", "driver"].includes(p.role)) return;
    let raw;
    try {
      raw = JSON.parse(decodeURIComponent(String(header)));
    } catch {
      return;
    }
    if (!raw || typeof raw !== "object") return;
    const text = (v, n = 60) =>
      v === undefined || v === null || v === ""
        ? undefined
        : String(v)
            .replace(/[\u0000-\u001f]/g, "")
            .trim()
            .slice(0, n);
    const platform = ["ios", "android", "web"].includes(raw.platform)
      ? raw.platform
      : "other";
    const device = {
      platform,
      type: ["phone", "tablet", "browser"].includes(raw.type)
        ? raw.type
        : undefined,
      brand: text(raw.brand, 40),
      model: text(raw.model),
      osVersion: text(raw.osVersion, 20),
      name: text(raw.name),
      appVersion: text(raw.appVersion, 20),
    };
    const key = [device.platform, device.brand, device.model, device.name].join(
      "|",
    );
    const at = now();
    const list = (p.devices ||= []);
    const known = list.find((d) => d.key === key);
    if (known) {
      // Avoid rewriting state on every 2 s poll: refresh at most once a minute
      // unless something about the device (OS, app version) changed.
      const changed = ["osVersion", "appVersion", "type"].some(
        (k) => device[k] !== known[k],
      );
      if (!changed && Date.parse(at) - Date.parse(known.lastSeenAt) < 60_000)
        return;
      Object.assign(known, device, { lastSeenAt: at });
    } else list.push({ key, ...device, firstSeenAt: at, lastSeenAt: at });
    list.sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));
    p.devices = list.slice(0, 5);
    p.device = p.devices[0];
    this.save();
  }
  issue(actor, id, b) {
    const o = super.issue(actor, id, b);
    o.issues.at(-1).account = actor;
    this.save();
    return o;
  }
  quote(actor, b) {
    const length = places.length;
    places.push(...this.ownPlaces(actor));
    try {
      return super.quote(actor, b);
    } finally {
      places.splice(length);
    }
  }
  edit(actor, b) {
    return safe(super.edit(actor, b));
  }
  ownPlaces(actor) {
    return this.state.customPlaces.filter((p) => p.owner === actor);
  }
  missed(o, e) {
    this.notice(
      e.driverId,
      "Request missed",
      "You did not respond to " + o.id + " in time. It went to other drivers.",
      o.id,
    );
  }
  cancel(actor, id, b) {
    const o = super.cancel(actor, id, b);
    if (o.stage === "searching")
      this.notice(
        o.customerId,
        "Finding a new driver",
        "Your driver could not continue " + o.id + ". We are finding another.",
        o.id,
      );
    return o;
  }
  active(id) {
    const p = this.profile(id);
    check(
      p.status !== "suspended" && p.status !== "inactive",
      "ACCOUNT_RESTRICTED",
      "Your account is restricted. Contact support before continuing.",
      403,
    );
    return p;
  }
  resolveToken(token) {
    if (token === "demo-admin") return "admin";
    if (token?.startsWith("demo-")) {
      const id = token.slice(5);
      this.profile(id);
      return id;
    }
    const session = this.state.sessions[token];
    check(
      session && Date.parse(session.expiresAt) > Date.now(),
      "SESSION_EXPIRED",
      "Sign in again to continue.",
      401,
    );
    if (session.actor.startsWith("staff-")) {
      const staff = this.state.staff.find((s) => s.id === session.actor);
      check(
        staff?.status === "active",
        "SESSION_REVOKED",
        "Your staff access has changed. Sign in again.",
        401,
      );
    }
    return session.actor;
  }
  staff(actor) {
    const p = this.state.staff.find(
      (p) => p.id === (actor === "admin" ? "staff-1" : actor),
    );
    check(
      p && p.status === "active",
      "FORBIDDEN",
      "This area is only available to authorized staff.",
      403,
    );
    return p;
  }
  /**
   * Where a driver was last known to be. The demo does not collect GPS, so
   * this is simulated: the final stop of their latest finished trip, or a
   * stable base near a demo place. Active trips are positioned by stage in
   * the admin map instead.
   */
  lastKnown(p) {
    const done = this.state.orders
      .filter(
        (o) =>
          o.driverId === p.id && ["delivered", "returned"].includes(o.stage),
      )
      .at(-1);
    if (done) {
      const place =
        done.stage === "returned"
          ? done.quote.pickup
          : done.cargoPlan?.stops.at(-1)?.place || done.quote.destination;
      return {
        latitude: place.latitude,
        longitude: place.longitude,
        label: "Last drop-off · " + place.name,
        simulated: true,
      };
    }
    const n = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = places[n % places.length];
    return {
      latitude: base.latitude + ((n % 7) - 3) * 0.0025,
      longitude: base.longitude + ((n % 5) - 2) * 0.003,
      label: "Base near " + base.name,
      simulated: true,
    };
  }
  /** Staff who may see trips (orders or tracking scope) can load any trip route. */
  seesTrips(actor) {
    const p = this.state.staff.find(
      (p) => p.id === (actor === "admin" ? "staff-1" : actor),
    );
    return (
      !!p &&
      p.status === "active" &&
      ["orders", "tracking"].some((x) =>
        this.rolePermissions(p.role).includes(x),
      )
    );
  }
  rolePermissions(name) {
    return this.state.roles.find((r) => r.name === name)?.permissions || [];
  }
  can(actor, scope) {
    return this.rolePermissions(this.staff(actor).role).includes(scope);
  }
  permit(actor, scope) {
    const p = this.staff(actor);
    if (!this.rolePermissions(p.role).includes(scope)) {
      this.record(p.id, "access.denied", scope, {});
      throw new DomainError(
        "FORBIDDEN",
        "Your role does not permit this action.",
        403,
      );
    }
    return p;
  }
  session(actor) {
    const token = randomUUID() + randomUUID();
    this.state.sessions[token] = {
      actor,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    this.save();
    return {
      token,
      account: actor,
      profile: actor.startsWith("staff-")
        ? safe(this.staff(actor))
        : safe(this.profile(actor)),
    };
  }
  auth(action, b) {
    if (action === "register") {
      check(
        ["customer", "driver"].includes(b.role),
        "ROLE_INVALID",
        "Choose a customer or driver account.",
      );
      check(
        String(b.name || "").trim().length >= 2,
        "NAME_INVALID",
        "Enter your full name.",
      );
      check(
        /^\+?[0-9 ()-]{9,18}$/.test(b.phone || ""),
        "PHONE_INVALID",
        "Enter a valid phone number.",
      );
      check(
        String(b.password || "").length >= 8,
        "PASSWORD_WEAK",
        "Use a password with at least eight characters.",
      );
      check(
        !this.state.profiles.some(
          (p) => p.phone.replace(/\D/g, "") === b.phone.replace(/\D/g, ""),
        ),
        "ACCOUNT_EXISTS",
        "An account already uses this phone number.",
      );
      const p = {
        id: uid(b.role),
        role: b.role,
        name: b.name.trim(),
        phone: b.phone,
        email: String(b.email || "")
          .trim()
          .toLowerCase(),
        passwordHash: hash(b.password),
        status: "active",
        verified: b.role === "customer",
        phoneVerified: false,
        online: false,
        truckId: null,
        vehicle: "",
        plate: "",
        declined: [],
        documents: [],
        createdAt: now(),
      };
      this.state.profiles.push(p);
      this.ensure();
      const id = uid("VERIFY");
      this.state.challenges[id] = {
        actor: p.id,
        code: "246810",
        purpose: "verify",
        expiresAt: Date.now() + 300000,
        attempts: 0,
        sentAt: Date.now(),
      };
      this.record(p.id, "account.registered", p.id, {});
      return { challenge: id, demoCode: "246810", expiresIn: 300 };
    }
    if (action === "login") {
      const list =
        b.role === "staff"
          ? this.state.staff
          : this.state.profiles.filter((p) => p.role === b.role);
      const p = list.find((p) =>
        [p.email?.toLowerCase(), p.phone?.replace(/\D/g, ""), p.id].includes(
          String(b.identifier || "")
            .toLowerCase()
            .replace(/^(\+?\d[\d ()-]+)$/, (v) => v.replace(/\D/g, "")),
        ),
      );
      check(
        p && verify(b.password, p.passwordHash),
        "CREDENTIALS_INVALID",
        "Check your phone/email and password.",
        401,
      );
      check(
        p.status === "active",
        "ACCOUNT_RESTRICTED",
        "This account is restricted. Contact support.",
        403,
      );
      if (p.forceReset || p.phoneVerified === false) {
        const id = uid("FIRST");
        this.state.challenges[id] = {
          actor: p.id,
          code: "246810",
          purpose: p.forceReset ? "first" : "verify",
          expiresAt: Date.now() + 300000,
          attempts: 0,
          sentAt: Date.now(),
        };
        this.save();
        return {
          challenge: id,
          demoCode: "246810",
          forceReset: !!p.forceReset,
        };
      }
      return this.session(p.id);
    }
    if (action === "recover") {
      const identifier = String(b.identifier || "")
        .trim()
        .toLowerCase();
      const digits = identifier.includes("@")
        ? ""
        : identifier.replace(/\D/g, "");
      const p = [...this.state.profiles, ...this.state.staff].find(
        (p) =>
          (identifier && p.email === identifier) ||
          (digits.length >= 9 && p.phone?.replace(/\D/g, "") === digits),
      );
      const id = uid("RESET");
      this.state.challenges[id] = {
        actor: p?.id || null,
        code: "246810",
        purpose: "reset",
        expiresAt: Date.now() + 300000,
        attempts: 0,
        sentAt: Date.now(),
      };
      this.save();
      return {
        challenge: id,
        demoCode: "246810",
        message:
          "If the account exists, a reset is available. Demo code is shown locally.",
      };
    }
    if (action === "resend") {
      const c = this.state.challenges[b.challenge];
      check(c, "CHALLENGE_INVALID", "Start verification again.");
      check(
        Date.now() - c.sentAt >= 30000,
        "RESEND_COOLDOWN",
        "Wait 30 seconds before resending.",
      );
      c.code = "246810";
      c.expiresAt = Date.now() + 300000;
      c.sentAt = Date.now();
      c.attempts = 0;
      this.save();
      return { demoCode: c.code };
    }
    if (action === "verify") {
      const c = this.state.challenges[b.challenge];
      check(
        c && c.expiresAt > Date.now() && c.attempts < 5,
        "CODE_EXPIRED",
        "This code has expired. Request a new one.",
      );
      c.attempts++;
      this.save();
      check(
        b.code === c.code,
        "CODE_INCORRECT",
        "That code is incorrect. Try again.",
      );
      check(c.actor, "CODE_INVALID", "This account could not be verified.");
      const p = c.actor.startsWith("staff-")
        ? this.staff(c.actor)
        : this.profile(c.actor);
      if (["reset", "first"].includes(c.purpose)) {
        check(
          String(b.password || "").length >= 8,
          "PASSWORD_WEAK",
          "Use at least eight characters.",
        );
        p.passwordHash = hash(b.password);
        p.forceReset = false;
        this.revoke(p.id);
      }
      p.phoneVerified = true;
      delete this.state.challenges[b.challenge];
      this.record(p.id, "identity.verified", p.id, {});
      return this.session(p.id);
    }
    throw new DomainError(
      "ACTION_INVALID",
      "Unsupported identity action.",
      404,
    );
  }
  revoke(id) {
    for (const [k, v] of Object.entries(this.state.sessions))
      if (v.actor === id) delete this.state.sessions[k];
  }
  snapshot(actor) {
    const s = super.snapshot(actor);
    s.profile = safe(s.profile);
    const related = new Set(
      s.orders.flatMap((o) => [o.customerId, o.driverId]).filter(Boolean),
    );
    related.delete(actor);
    s.people = this.state.profiles
      .filter((p) => related.has(p.id))
      .map(({ id, role, name, phone, truckId, vehicle, plate }) =>
        role === "driver"
          ? { id, role, name, phone, truckId, vehicle, plate }
          : { id, role, name, phone },
      );
    s.savedPlaces = this.state.savedPlaces[actor] || [];
    s.places = [...s.places, ...this.ownPlaces(actor)];
    s.notifications = this.state.notifications.filter(
      (n) => n.account === actor,
    );
    s.tickets = this.state.tickets.filter((t) => t.account === actor);
    s.withdrawals = this.state.withdrawals.filter((w) => w.driverId === actor);
    s.adjustmentBalance = this.state.accounts[actor] || 0;
    s.walletTopups = this.state.walletTopups
      .filter((t) => t.account === actor)
      .map(safe);
    s.rewards = this.state.rewards.filter((r) => r.account === actor);
    s.transfers = this.state.transfers.filter(
      (t) => t.source === actor || t.destination === actor,
    );
    return s;
  }
  create(actor, b, key) {
    this.active(actor);
    const o = super.create(actor, b, key);
    o.financial.rate ??= this.state.feeRate;
    this.notice(actor, "Order placed", o.id + " is " + o.stage, o.id);
    return o;
  }
  availability(actor, b) {
    if (b.online) this.active(actor);
    return super.availability(actor, b);
  }
  accept(actor, id) {
    this.active(actor);
    const o = super.accept(actor, id);
    this.notice(
      o.customerId,
      "Driver assigned",
      "Your driver has accepted " + o.id,
      o.id,
    );
    return o;
  }
  attempt(o, scenario) {
    const a = super.attempt(o, scenario);
    a.amount = o.quote.total;
    a.source = o.method === "wallet" ? o.customerId : o.method;
    a.destination = o.method === "cash" ? o.driverId : "settlement";
    a.driverId = o.driverId;
    a.message =
      o.method === "wallet"
        ? "Confirm payment from your LoadMaster wallet."
        : o.method === "cash"
          ? "Waiting for cash collection and payer confirmation."
          : "Payment request sent. Approve through the selected provider. This demo simulates provider approval.";
    o.payment.message = a.message;
    this.notice(
      o.customerId,
      "Payment requested",
      `${o.id}: ${a.message}`,
      o.id,
    );
    if (o.driverId)
      this.notice(
        o.driverId,
        "Awaiting customer payment",
        `${o.id}: collection requested via ${o.method}.`,
        o.id,
      );
    return a;
  }
  payment(actor, id, b) {
    const o = super.payment(actor, id, b);
    if (["failed", "unknown"].includes(o.payment.status) && o.driverId)
      this.notice(
        o.driverId,
        "Payment " + o.payment.status,
        `${o.id}: ${o.payment.message}`,
        o.id,
      );
    return o;
  }
  refundDestination(o) {
    return o.method === "wallet" ? o.customerId : `${o.customerId}:${o.method}`;
  }
  collectionNotice(o) {
    this.notice(
      o.customerId,
      "Payment confirmed",
      "Your receipt for " + o.id + " is ready.",
      o.id,
    );
    if (o.driverId)
      this.notice(
        o.driverId,
        "Customer payment received",
        `${o.id}: ${o.quote.total.toLocaleString()} UGX via ${o.method}. Your earning is ${o.financial.earning.toLocaleString()} UGX.`,
        o.id,
      );
  }
  paid(o, a) {
    if (o.payment.status === "paid") return;
    super.paid(o, a);
    this.state.accounts.settlement += o.quote.total;
    this.post(
      "collection",
      o.quote.total,
      "provider:" + o.method,
      "settlement",
      o.id,
    );
    this.collectionNotice(o);
  }
  notice(account, title, message, orderId) {
    if (
      this.state.profiles.find((p) => p.id === account)?.preferences
        ?.notifications === false
    )
      return;
    if (
      orderId &&
      this.state.notifications.some(
        (n) =>
          n.account === account && n.title === title && n.orderId === orderId,
      )
    )
      return;
    this.state.notifications.push({
      id: uid("NOT"),
      account,
      title,
      message,
      orderId,
      read: false,
      createdAt: now(),
    });
    this.save();
  }
  post(kind, amount, source, destination, reference) {
    this.state.ledger.push({
      id: uid("LED"),
      kind,
      reference,
      at: now(),
      entries: [
        { account: source, amount: -amount },
        { account: destination, amount },
      ],
    });
  }
  mobile(actor, action, b) {
    const p = this.profile(actor);
    if (action === "wallet") {
      this.active(actor);
      check(
        p.role === "customer",
        "FORBIDDEN",
        "Only customers can fund a wallet.",
        403,
      );
      check(
        typeof b.key === "string" && b.key.length >= 8,
        "KEY_REQUIRED",
        "A payment reference is required.",
      );
      const previous = this.state.walletTopups.find(
        (t) => t.id === b.key && t.account === actor,
      );
      const credit = (t) => {
        this.state.accounts.providerClearing ??= 0;
        this.state.accounts.providerClearing -= t.amount;
        this.state.accounts[actor] += t.amount;
        t.status = "completed";
        this.post("wallet.topup", t.amount, "providerClearing", actor, t.id);
        this.record(actor, "wallet.completed", t.id, {
          amount: t.amount,
          method: t.method,
        });
        this.notice(
          actor,
          "Wallet funds added",
          `UGX ${t.amount.toLocaleString()} added to your demo wallet.`,
        );
      };
      if (b.resolve) {
        check(previous, "NOT_FOUND", "This top-up could not be found.", 404);
        if (previous.status === "pending") credit(previous);
        return safe(previous);
      }
      if (previous) {
        check(
          previous.amount === b.amount && previous.method === b.method,
          "KEY_REUSED",
          "Use the original details when checking a top-up.",
        );
        return safe(previous);
      }
      check(
        !this.state.walletTopups.some(
          (t) => t.account === actor && t.status === "pending",
        ),
        "TOPUP_PENDING",
        "Check your pending top-up before starting another payment.",
      );
      check(
        Number.isInteger(b.amount) && b.amount >= 1 && b.amount <= 1000000,
        "AMOUNT_INVALID",
        "Enter a whole amount between UGX 1 and UGX 1,000,000.",
      );
      check(
        ["mtn", "airtel", "card", "flexipay", "external_wallet"].includes(
          b.method,
        ),
        "METHOD_INVALID",
        "Choose Mobile Money or card.",
      );
      check(
        ["success", "pending", "failed"].includes(b.outcome),
        "OUTCOME_INVALID",
        "Choose a demo payment outcome.",
      );
      const t = {
        id: b.key,
        account: actor,
        amount: b.amount,
        method: b.method,
        status: b.outcome === "failed" ? "failed" : "pending",
        createdAt: now(),
      };
      this.state.walletTopups.push(t);
      if (b.outcome === "success") credit(t);
      else
        this.record(actor, "wallet." + t.status, t.id, {
          amount: t.amount,
          method: t.method,
        });
      return safe(t);
    }
    if (action === "profile") {
      const before = safe(p);
      if (b.name !== undefined) {
        check(
          String(b.name).trim().length >= 2,
          "NAME_INVALID",
          "Enter your full name.",
        );
        p.name = String(b.name).trim().slice(0, 80);
      }
      if (b.email !== undefined) {
        check(
          !b.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email),
          "EMAIL_INVALID",
          "Enter a valid email.",
        );
        p.email = b.email;
      }
      if (b.preferences) p.preferences = { ...p.preferences, ...b.preferences };
      this.record(actor, "profile.updated", actor, {
        before: safe(before),
        after: safe(p),
      });
      return safe(p);
    }
    if (action === "password") {
      check(
        verify(b.current, p.passwordHash),
        "PASSWORD_INCORRECT",
        "Your current password is incorrect.",
      );
      check(
        String(b.password || "").length >= 8,
        "PASSWORD_WEAK",
        "Use at least eight characters.",
      );
      p.passwordHash = hash(b.password);
      this.revoke(actor);
      this.record(actor, "password.changed", actor, {});
      return this.session(actor);
    }
    if (action === "vehicle") {
      check(
        p.role === "driver",
        "FORBIDDEN",
        "Only a driver can register a vehicle.",
        403,
      );
      check(
        trucks.some((t) => t.id === b.truckId) &&
          String(b.vehicle || "").trim() &&
          String(b.plate || "").trim(),
        "VEHICLE_INVALID",
        "Enter truck type, model and licence plate.",
      );
      check(
        !this.state.orders.some(
          (o) =>
            o.driverId === actor &&
            !["delivered", "cancelled", "returned"].includes(o.stage),
        ),
        "DRIVER_BUSY",
        "Finish your delivery before changing vehicles.",
      );
      const before = { vehicle: p.vehicle, plate: p.plate, truckId: p.truckId };
      Object.assign(p, {
        truckId: b.truckId,
        vehicle: b.vehicle.trim(),
        plate: b.plate.trim().toUpperCase(),
        vehicleStatus: "pending",
        verified: false,
        online: false,
      });
      this.record(actor, "vehicle.submitted", actor, {
        before,
        after: { truckId: p.truckId, vehicle: p.vehicle, plate: p.plate },
      });
      return safe(p);
    }
    if (action === "document") {
      check(
        p.role === "driver",
        "FORBIDDEN",
        "Only drivers submit vehicle documents.",
        403,
      );
      check(
        [
          "Driver licence",
          "Identity document",
          "Vehicle registration",
          "Third-party insurance",
        ].includes(b.name),
        "DOCUMENT_INVALID",
        "Select a required document.",
      );
      check(
        typeof b.content === "string" &&
          /^data:image\/(jpeg|png);base64,/.test(b.content) &&
          b.content.length < 3000000,
        "FILE_INVALID",
        "Use a JPG/PNG document smaller than 2 MB.",
      );
      const old = p.documents.find((d) => d.name === b.name);
      const doc = {
        id: old?.id || uid("DOC"),
        name: b.name,
        fileName: String(b.fileName || "document.jpg").slice(0, 100),
        content: b.content,
        status: "pending",
        createdAt: now(),
      };
      p.documents = p.documents.filter((d) => d.name !== b.name);
      p.documents.push(doc);
      p.verified = false;
      p.online = false;
      this.record(actor, "document.submitted", doc.id, {
        name: b.name,
        status: "pending",
      });
      return { ...doc, content: undefined };
    }
    if (action === "methods") {
      check(
        [
          "mtn",
          "airtel",
          "card",
          "cash",
          "flexipay",
          "external_wallet",
          "wallet",
        ].includes(b.kind),
        "METHOD_INVALID",
        "Choose a supported method.",
      );
      const id = b.id || uid("METHOD");
      p.paymentMethods = p.paymentMethods.filter((m) => m.id !== id);
      if (!b.remove)
        p.paymentMethods.push({
          id,
          kind: b.kind,
          label: String(b.label || "Demo method").slice(0, 50),
          last4:
            b.kind === "card" ? "4242" : String(b.last4 || "0111").slice(-4),
          isDefault: !!b.isDefault,
        });
      if (b.isDefault)
        p.paymentMethods = p.paymentMethods.map((m) => ({
          ...m,
          isDefault: m.id === id,
        }));
      this.record(actor, "method.updated", id, {
        kind: b.kind,
        removed: !!b.remove,
      });
      return p.paymentMethods;
    }
    if (action === "location") {
      check(
        typeof b.name === "string" &&
          b.name.trim().length >= 2 &&
          Number.isFinite(b.latitude) &&
          Number.isFinite(b.longitude),
        "LOCATION_INVALID",
        "Choose a valid named location.",
      );
      check(
        b.latitude >= 0.1 &&
          b.latitude <= 0.65 &&
          b.longitude >= 32.4 &&
          b.longitude <= 32.85,
        "OUTSIDE_SERVICE_AREA",
        "This location is outside the Kampala demo service area. Choose a demo location or change the simulator location.",
      );
      const place = {
        id: uid("PLACE"),
        owner: actor,
        name: b.name.trim().slice(0, 120),
        detail: "Selected location · Kampala area",
        latitude: b.latitude,
        longitude: b.longitude,
      };
      this.state.customPlaces.push(place);
      this.record(actor, "location.selected", place.id, {});
      return place;
    }
    if (action === "place") {
      const list = (this.state.savedPlaces[actor] ??= []);
      if (b.remove)
        this.state.savedPlaces[actor] = list.filter((x) => x.id !== b.id);
      else {
        const place = [...places, ...this.ownPlaces(actor)].find(
          (x) => x.id === b.placeId,
        );
        check(place, "LOCATION_INVALID", "Choose a demo location.");
        check(
          list.length < 10,
          "PLACE_LIMIT",
          "You can save up to ten places.",
        );
        list.push({
          id: uid("SAVED"),
          label: String(b.label || place.name).slice(0, 60),
          placeId: place.id,
        });
      }
      this.record(actor, "saved-place.updated", actor, {});
      return this.state.savedPlaces[actor];
    }
    if (action === "notification") {
      for (const n of this.state.notifications)
        if (n.account === actor && (!b.id || n.id === b.id)) n.read = true;
      this.save();
      return { ok: true };
    }
    if (action === "ticket") {
      check(
        String(b.message || "").trim().length >= 5,
        "MESSAGE_REQUIRED",
        "Describe the issue.",
      );
      const ticket = {
        id: uid("CASE"),
        account: actor,
        subject: String(b.subject || "Help with my account").slice(0, 120),
        message: b.message.slice(0, 1500),
        status: "open",
        createdAt: now(),
        replies: [],
      };
      this.state.tickets.push(ticket);
      this.record(actor, "support.created", ticket.id, {});
      return ticket;
    }
    if (action === "withdrawal") {
      check(
        p.role === "driver",
        "FORBIDDEN",
        "Only drivers request payouts.",
        403,
      );
      if (b.key) {
        const previous = this.state.withdrawals.find(
          (w) => w.driverId === actor && w.key === b.key,
        );
        if (previous) return previous;
      }
      check(
        !this.state.withdrawals.some(
          (w) =>
            w.driverId === actor &&
            ["requested", "approved", "processing", "failed"].includes(
              w.status,
            ),
        ),
        "REQUEST_EXISTS",
        "Your existing withdrawal is still being processed.",
      );
      const orders = this.state.orders.filter(
        (o) =>
          o.driverId === actor &&
          ["delivered", "returned"].includes(o.stage) &&
          o.financial.payoutStatus === "scheduled" &&
          o.method !== "cash" &&
          !this.state.operations.some(
            (op) =>
              op.orderId === o.id &&
              op.kind !== "refund" &&
              op.status === "pending",
          ),
      );
      const available = orders.reduce(
        (n, o) => n + o.financial.earning - (o.financial.disbursed || 0),
        0,
      );
      check(
        available > 0,
        "NO_EARNINGS",
        "There are no earnings available for withdrawal.",
      );
      const amount = b.amount ?? available;
      check(
        Number.isSafeInteger(amount) && amount > 0 && amount <= available,
        "AMOUNT_INVALID",
        "Enter a positive whole amount within your available earnings.",
      );
      const method = b.method || "mtn";
      check(
        ["mtn", "airtel", "flexipay", "external_wallet"].includes(method),
        "METHOD_INVALID",
        "Choose a supported payout platform.",
      );
      const destination = String(b.destination || p.phone || "").trim();
      check(
        method === "external_wallet"
          ? destination.length >= 5 && destination.length <= 100
          : /^\+?[0-9 ()-]{9,18}$/.test(destination),
        "DESTINATION_INVALID",
        "Enter a valid payout phone number or account.",
      );
      const provider =
        method === "external_wallet" ? String(b.provider || "").trim() : method;
      check(
        provider.length >= 2 && provider.length <= 50,
        "PROVIDER_REQUIRED",
        "Name the payout platform.",
      );
      let remaining = amount;
      const allocations = [];
      for (const o of orders) {
        const allocated = Math.min(
          remaining,
          o.financial.earning - (o.financial.disbursed || 0),
        );
        if (allocated > 0)
          allocations.push({ orderId: o.id, amount: allocated });
        remaining -= allocated;
      }
      const w = {
        id: uid("WD"),
        key: b.key,
        driverId: actor,
        orderIds: allocations.map((a) => a.orderId),
        allocations,
        amount,
        method,
        destination,
        provider,
        status: "requested",
        createdAt: now(),
        attempts: [],
      };
      this.state.withdrawals.push(w);
      this.record(actor, "withdrawal.requested", w.id, { amount: w.amount });
      return w;
    }
    if (action === "rating") {
      const o = this.order(b.orderId, actor);
      check(
        o.customerId === actor && o.stage === "delivered",
        "RATING_UNAVAILABLE",
        "Rate a completed delivery.",
      );
      check(
        Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5,
        "RATING_INVALID",
        "Choose one to five stars.",
      );
      o.rating = b.rating;
      o.review = String(b.review || "").slice(0, 500);
      this.record(actor, "delivery.rated", o.id, { rating: b.rating });
      return o;
    }
    if (action === "delete") {
      check(
        !this.state.orders.some(
          (o) =>
            (o.customerId === actor || o.driverId === actor) &&
            !["delivered", "cancelled", "returned"].includes(o.stage),
        ),
        "ACTIVE_ORDER",
        "Finish or cancel active orders first.",
      );
      p.status = "inactive";
      p.online = false;
      this.revoke(actor);
      this.record(actor, "deletion.requested", actor, {
        retained: "Order and financial history retained for this demo",
      });
      return { ok: true };
    }
    throw new DomainError(
      "ACTION_INVALID",
      "This account action is unavailable.",
      404,
    );
  }
  adminSnapshot(actor) {
    const p = this.staff(actor),
      allow = this.rolePermissions(p.role);
    this.dispatchRound();
    return {
      me: safe(p),
      permissions: allow,
      people: allow.some((x) => ["customers", "drivers"].includes(x))
        ? this.state.profiles.map((p) => {
            const v = allow.includes("finance")
              ? safe(p)
              : { ...safe(p), paymentMethods: undefined };
            if (p.role === "driver") v.lastKnown = this.lastKnown(p);
            return v;
          })
        : [],
      orders:
        allow.includes("orders") || allow.includes("finance")
          ? this.state.orders.map((o) =>
              allow.includes("finance")
                ? o
                : {
                    ...o,
                    quote: {
                      ...o.quote,
                      total: undefined,
                      transport: undefined,
                      loadingFee: undefined,
                      offloadingFee: undefined,
                    },
                    financial: undefined,
                    payment: undefined,
                  },
            )
          : [],
      // Full staff records only for the staff section (Super Admin). Roles that
      // may view admin actions get names so every action shows who did it.
      staff: allow.includes("staff")
        ? this.state.staff.map(safe)
        : allow.includes("audit")
          ? this.state.staff.map(({ id, name, role }) => ({ id, name, role }))
          : [],
      audit: allow.includes("audit") ? this.state.audit : [],
      tickets: allow.includes("support") ? this.state.tickets : [],
      transfers: allow.includes("finance") ? this.state.transfers : [],
      accounts: allow.includes("finance") ? this.state.accounts : {},
      withdrawals: allow.includes("finance") ? this.state.withdrawals : [],
      operations: allow.includes("finance") ? this.state.operations : [],
      ledger: allow.includes("finance") ? this.state.ledger : [],
      reconciliations: allow.includes("finance")
        ? this.state.reconciliations
        : [],
      rewards: allow.includes("rewards") ? this.state.rewards : [],
      walletTopups: allow.includes("finance")
        ? this.state.walletTopups.map(safe)
        : [],
      notes: allow.some((x) => ["customers", "drivers"].includes(x))
        ? this.state.accountNotes
        : [],
      settings: allow.includes("settings")
        ? this.state.settings
        : { serviceArea: this.state.settings.serviceArea },
      roles: allow.includes("staff") ? this.state.roles : [],
      permissionCatalog: allow.includes("staff") ? permissionCatalog : [],
      trucks,
      places,
      serverTime: now(),
    };
  }
  adminAction(actor, action, b) {
    const scope = {
      self: "self",
      staff: "staff.write",
      role: "staff.write",
      user: "drivers",
      note: "customers",
      message: "support",
      dispatch: "orders",
      support: "support",
      transfer: "finance",
      reconcile: "finance",
      withdrawal: "finance",
      settings: "settings",
      reward: "rewards",
      document: "drivers",
      upload: "drivers",
    }[action];
    check(scope, "ACTION_INVALID", "Unsupported administration action.");
    const staff =
      scope === "self" ? this.staff(actor) : this.permit(actor, scope);
    const reason = String(b.reason || "").trim();
    if (action === "self") {
      if (b.name !== undefined) {
        const name = String(b.name).trim();
        check(name.length >= 2, "NAME_INVALID", "Enter your full name.");
        staff.name = name.slice(0, 80);
      }
      if (b.phone) {
        check(
          /^\+?[0-9 ()-]{9,18}$/.test(b.phone),
          "PHONE_INVALID",
          "Enter a valid phone number.",
        );
        staff.phone = b.phone;
      }
      if (b.password) {
        check(
          verify(b.current, staff.passwordHash),
          "PASSWORD_INCORRECT",
          "Your current password is incorrect.",
        );
        check(
          String(b.password).length >= 8,
          "PASSWORD_WEAK",
          "Use at least eight characters.",
        );
        staff.passwordHash = hash(b.password);
        this.revoke(staff.id);
      }
      this.record(staff.id, "staff.profile.updated", staff.id, {
        name: staff.name,
        phone: staff.phone,
        passwordChanged: !!b.password,
      });
      return safe(staff);
    }
    if (
      [
        "transfer",
        "user",
        "dispatch",
        "withdrawal",
        "document",
        "reward",
      ].includes(action) ||
      (action === "role" && b.mode !== "create")
    )
      check(
        reason.length >= 5,
        "REASON_REQUIRED",
        "Enter a clear reason of at least five characters.",
      );
    if (action === "user") {
      const approveOnly =
        b.verify === true &&
        Object.keys(b).every((k) => ["id", "verify", "reason"].includes(k));
      check(
        this.can(staff.id, "accounts.edit") ||
          (approveOnly && this.can(staff.id, "drivers.verify")),
        "FORBIDDEN",
        "Your role can view accounts but cannot change them.",
        403,
      );
      const p = this.profile(b.id);
      if (p.role === "customer") this.permit(actor, "customers");
      const before = safe(p);
      let temporary;
      if (b.name) p.name = String(b.name).trim().slice(0, 80);
      if (b.phone !== undefined && b.phone !== p.phone) {
        check(
          /^\+?[0-9 ()-]{9,18}$/.test(b.phone),
          "PHONE_INVALID",
          "Enter a valid phone number.",
        );
        const digits = String(b.phone).replace(/\D/g, "");
        check(
          !this.state.profiles.some(
            (x) =>
              x.id !== p.id && String(x.phone).replace(/\D/g, "") === digits,
          ),
          "ACCOUNT_EXISTS",
          "Another account already uses this phone number.",
        );
        p.phone = String(b.phone).trim();
      }
      if (b.email !== undefined && b.email !== p.email) {
        const email = String(b.email).trim().toLowerCase();
        check(
          !email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),
          "EMAIL_INVALID",
          "Enter a valid email address.",
        );
        check(
          !email ||
            !this.state.profiles.some(
              (x) => x.id !== p.id && x.email === email,
            ),
          "ACCOUNT_EXISTS",
          "Another account already uses this email.",
        );
        p.email = email;
      }
      if (b.photo !== undefined) {
        // Data URL from the admin upload (resized client-side). null removes it.
        if (b.photo === null || b.photo === "") delete p.photo;
        else {
          const photo = String(b.photo);
          check(
            /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(photo),
            "PHOTO_INVALID",
            "Upload a JPG or PNG image.",
          );
          check(
            photo.length <= 7_000_000,
            "PHOTO_TOO_LARGE",
            "Choose an image up to 5 MB.",
          );
          p.photo = photo;
        }
      }
      if (b.vehicle !== undefined || b.plate !== undefined || b.truckId) {
        check(p.role === "driver", "FORBIDDEN", "Only drivers have vehicles.");
        check(
          !this.state.orders.some(
            (o) =>
              o.driverId === p.id &&
              !["delivered", "cancelled", "returned"].includes(o.stage),
          ),
          "ACTIVE_ORDER",
          "Change the vehicle after the driver's current trip ends.",
        );
        if (b.truckId) {
          check(
            trucks.some((t) => t.id === b.truckId),
            "TRUCK_INVALID",
            "Choose a truck category.",
          );
          p.truckId = b.truckId;
        }
        if (b.vehicle !== undefined)
          p.vehicle = String(b.vehicle).trim().slice(0, 60);
        if (b.plate !== undefined) {
          const plate = String(b.plate).trim().toUpperCase();
          check(
            /^[A-Z0-9 -]{4,12}$/.test(plate),
            "PLATE_INVALID",
            "Enter a valid number plate.",
          );
          check(
            !this.state.profiles.some(
              (x) => x.id !== p.id && x.plate === plate,
            ),
            "PLATE_EXISTS",
            "Another driver is registered with this plate.",
          );
          p.plate = plate;
        }
      }
      if (b.offline) {
        check(p.role === "driver", "FORBIDDEN", "Only drivers go offline.");
        p.online = false;
        this.expireOffers();
        this.notice(p.id, "You were set offline", reason);
      }
      if (b.verify === false) {
        check(p.role === "driver", "FORBIDDEN", "Only drivers are verified.");
        p.verified = false;
        p.vehicleStatus = "pending";
        p.online = false;
        this.expireOffers();
      }
      if (b.resetPassword) {
        temporary = "Welcome2026!";
        p.forceReset = true;
        p.passwordHash = hash(temporary);
        this.revoke(p.id);
      }
      if (b.status) {
        check(
          ["active", "suspended", "inactive"].includes(b.status),
          "STATUS_INVALID",
          "Choose a valid account status.",
        );
        p.status = b.status;
        if (p.status !== "active") {
          p.online = false;
          this.revoke(p.id);
        }
      }
      if (b.verify) {
        check(
          p.role === "driver" && p.vehicle && p.plate && p.truckId,
          "VEHICLE_REQUIRED",
          "A registered vehicle is required.",
        );
        check(
          p.documents.length === 4 &&
            p.documents.every((d) => d.status === "approved"),
          "DOCUMENTS_REQUIRED",
          "Approve all four required documents first.",
        );
        p.verified = true;
        p.vehicleStatus = "approved";
      }
      // Audit says whether a photo is set, not the image itself.
      const audited = ({ photo, ...v }) => ({
        ...v,
        photo: photo ? "set" : "none",
      });
      this.record(staff.id, "account.updated", p.id, {
        before: audited(before),
        after: audited(safe(p)),
        reason,
      });
      this.notice(p.id, "Account updated", reason);
      return temporary
        ? { ...safe(p), demoTemporaryPassword: temporary }
        : safe(p);
    }
    if (action === "message") {
      const p = this.profile(b.id);
      const subject = String(b.subject || "")
        .trim()
        .slice(0, 80);
      const text = String(b.text || "")
        .trim()
        .slice(0, 500);
      check(
        subject.length >= 3 && text.length >= 3,
        "MESSAGE_REQUIRED",
        "Write a subject and a message.",
      );
      this.notice(p.id, subject, text);
      this.record(staff.id, "account.messaged", p.id, { subject });
      return { sent: true };
    }
    if (action === "note") {
      const p = this.profile(b.id);
      if (p.role === "driver") this.permit(actor, "drivers");
      const text = String(b.text || "")
        .trim()
        .slice(0, 1000);
      check(text.length >= 3, "NOTE_REQUIRED", "Write a note first.");
      const note = {
        id: uid("NOTE"),
        account: p.id,
        by: staff.id,
        text,
        at: now(),
      };
      this.state.accountNotes.push(note);
      this.record(staff.id, "account.note", p.id, {});
      return note;
    }
    if (action === "upload") {
      check(
        this.can(staff.id, "documents.upload"),
        "FORBIDDEN",
        "Your role cannot upload driver evidence.",
        403,
      );
      const result = this.mobile(b.account, "document", b);
      this.state.audit.at(-1).actor = staff.id;
      this.save();
      return result;
    }
    if (action === "document") {
      check(
        this.can(staff.id, "documents.review"),
        "FORBIDDEN",
        "Your role cannot review driver evidence.",
        403,
      );
      const p = this.profile(b.account);
      const d = p.documents.find((d) => d.id === b.id);
      check(d, "NOT_FOUND", "Document not found.", 404);
      check(
        ["approved", "rejected", "removed"].includes(b.status),
        "STATUS_INVALID",
        "Approve or reject this document.",
      );
      if (b.status === "removed") {
        check(
          this.can(staff.id, "documents.delete"),
          "FORBIDDEN",
          "Your role cannot remove driver evidence.",
          403,
        );
        delete d.content;
      }
      const before = d.status;
      d.status = b.status;
      d.reason = reason;
      if (b.status !== "approved") {
        p.verified = false;
        p.online = false;
      }
      this.record(staff.id, "document.reviewed", d.id, {
        before,
        after: d.status,
        reason,
      });
      this.notice(p.id, "Document review", d.name + ": " + d.status);
      return { ...d, content: undefined };
    }
    if (action === "dispatch") {
      const o = this.order(b.id, "admin");
      check(
        ["searching", "assigned", "to_pickup", "at_pickup"].includes(o.stage),
        "REASSIGN_UNAVAILABLE",
        "Cargo already in custody cannot be reassigned automatically.",
      );
      const driver = this.active(b.driverId);
      check(
        driver.role === "driver" && driver.verified && driver.online,
        "DRIVER_UNAVAILABLE",
        "Choose a verified online driver.",
      );
      check(
        trucks.find((t) => t.id === driver.truckId)?.maxKg >=
          trucks.find((t) => t.id === o.quote.truckId)?.maxKg,
        "CAPACITY_MISMATCH",
        "This vehicle is too small.",
      );
      check(
        !this.state.orders.some(
          (x) =>
            x.id !== o.id &&
            x.driverId === driver.id &&
            !["delivered", "cancelled", "returned"].includes(x.stage),
        ),
        "DRIVER_BUSY",
        "This driver has another delivery.",
      );
      const before = o.driverId;
      if (before) {
        const entry = this.dispatchEntry(o, before);
        if (entry?.status === "accepted")
          this.close(entry, "withdrawn", "Reassigned by operations: " + reason);
      }
      const offered = this.dispatchEntry(o, driver.id);
      if (offered?.status === "offered")
        this.close(offered, "accepted", "Assigned by operations");
      else {
        const at = now();
        o.dispatch.push({
          driverId: driver.id,
          status: "accepted",
          offeredAt: at,
          expiresAt: at,
          respondedAt: at,
          reason: "Assigned by operations",
          by: staff.id,
        });
      }
      o.driverId = driver.id;
      this.update(o, "assigned", reason);
      this.record(staff.id, "order.reassigned", o.id, {
        before,
        after: driver.id,
        reason,
      });
      if (before)
        this.notice(
          before,
          "Order reassigned",
          o.id + " was reassigned by operations.",
          o.id,
        );
      this.notice(
        o.customerId,
        "Driver updated",
        driver.name + " is your assigned driver.",
        o.id,
      );
      return o;
    }
    if (action === "support") {
      const t = this.state.tickets.find((t) => t.id === b.id);
      const o = this.state.orders.find((o) =>
        o.issues.some((i) => i.id === b.id),
      );
      const issue = o?.issues.find((i) => i.id === b.id);
      const item = t || issue;
      check(item, "NOT_FOUND", "Support case not found.", 404);
      if (b.status) {
        check(
          ["open", "in_review", "resolved"].includes(b.status),
          "STATUS_INVALID",
          "Choose a valid case status.",
        );
        item.status = b.status;
      }
      if (b.reply) {
        item.replies ??= [];
        item.replies.push({
          id: uid("REPLY"),
          actor: staff.id,
          message: String(b.reply).slice(0, 1500),
          at: now(),
        });
        this.notice(
          t?.account || issue.account || o.customerId,
          "Support replied",
          b.reply,
          o?.id,
        );
      }
      this.record(staff.id, "support.updated", b.id, {
        status: item.status,
        reply: b.reply,
      });
      return item;
    }
    if (action === "settings") {
      check(
        Number.isFinite(b.feeRate) &&
          b.feeRate >= 0 &&
          b.feeRate <= 0.5 &&
          Number.isSafeInteger(b.helperRate) &&
          b.helperRate >= 0,
        "RATE_INVALID",
        "Use a fee between 0–50% and a non-negative whole UGX helper rate.",
      );
      if (b.offerSeconds !== undefined)
        check(
          Number.isSafeInteger(b.offerSeconds) &&
            b.offerSeconds >= 15 &&
            b.offerSeconds <= 300,
          "RATE_INVALID",
          "Give drivers between 15 and 300 seconds to respond.",
        );
      const before = { ...this.state.settings };
      if (b.offerSeconds !== undefined) {
        this.state.offerSeconds = b.offerSeconds;
        this.state.settings.offerSeconds = b.offerSeconds;
      }
      this.state.feeRate = b.feeRate;
      this.state.helperRate = b.helperRate;
      Object.assign(this.state.settings, {
        feeRate: b.feeRate,
        helperRate: b.helperRate,
      });
      this.record(staff.id, "settings.updated", "pricing", {
        before,
        after: this.state.settings,
      });
      return this.state.settings;
    }
    if (action === "role") {
      const roles = this.state.roles;
      const name = String(b.name || "")
        .trim()
        .slice(0, 40);
      const perms = [
        ...new Set(
          (Array.isArray(b.permissions)
            ? b.permissions
            : String(b.permissions || "").split(",")
          ).filter((x) => ALL.includes(x)),
        ),
      ];
      const r = roles.find((r) => r.name === b.role);
      if (b.mode !== "create") {
        check(r, "NOT_FOUND", "Role not found.", 404);
        check(
          !r.system,
          "ROLE_LOCKED",
          "Super Admin is fixed: it always has full access.",
          409,
        );
      }
      if (b.mode === "delete") {
        const holders = this.state.staff.filter((x) => x.role === r.name);
        check(
          !holders.length,
          "ROLE_IN_USE",
          `Move ${holders.length} staff member(s) to another role first.`,
          409,
        );
        this.state.roles = roles.filter((x) => x !== r);
        this.record(staff.id, "role.deleted", r.name, { reason });
        return { deleted: r.name };
      }
      check(name.length >= 2, "ROLE_INVALID", "Give the role a name.");
      check(
        !roles.some(
          (x) => x !== r && x.name.toLowerCase() === name.toLowerCase(),
        ),
        "ROLE_EXISTS",
        "Another role already has this name.",
      );
      check(perms.length, "ROLE_INVALID", "Choose at least one permission.");
      const description = String(b.description || "")
        .trim()
        .slice(0, 140);
      if (b.mode === "create") {
        const role = { name, description, permissions: perms };
        roles.push(role);
        this.record(staff.id, "role.created", name, { permissions: perms });
        return role;
      }
      const before = { ...r };
      if (name !== r.name)
        for (const x of this.state.staff) if (x.role === r.name) x.role = name;
      Object.assign(r, { name, description, permissions: perms });
      // Sessions of affected staff pick up new rights on their next request.
      this.record(staff.id, "role.updated", name, {
        before,
        after: { ...r },
        reason,
      });
      return r;
    }
    if (action === "staff") {
      if (b.mode !== "create")
        check(
          reason.length >= 5,
          "REASON_REQUIRED",
          "Explain this staff access change.",
        );
      let p = this.state.staff.find((p) => p.id === b.id);
      if (b.mode === "create") {
        check(
          b.name &&
            /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email || "") &&
            this.state.roles.some((r) => r.name === b.role),
          "STAFF_INVALID",
          "Provide name, email and a valid role.",
        );
        check(
          !this.state.staff.some((x) => x.email === b.email),
          "ACCOUNT_EXISTS",
          "This staff email already exists.",
        );
        if (b.role === "Super Admin")
          check(
            this.state.staff.filter(
              (x) => x.role === "Super Admin" && x.status === "active",
            ).length < 2,
            "SUPER_ADMIN_LIMIT",
            "At most two Super Admins may be active.",
          );
        p = {
          id: uid("staff").toLowerCase(),
          name: b.name,
          email: b.email,
          phone: b.phone || "",
          role: b.role,
          status: "active",
          createdAt: now(),
          forceReset: true,
          passwordHash: hash("Welcome2026!"),
        };
        this.state.staff.push(p);
        this.record(staff.id, "staff.invited", p.id, {
          email: p.email,
          role: p.role,
        });
        return { ...safe(p), demoTemporaryPassword: "Welcome2026!" };
      }
      check(p, "NOT_FOUND", "Staff account not found.", 404);
      check(
        p.id !== staff.id ||
          ((!b.role || b.role === p.role) &&
            (!b.status || b.status === p.status)),
        "SELF_CHANGE_FORBIDDEN",
        "You cannot change your own role or deactivate your own account.",
        403,
      );
      const before = safe(p);
      if (b.mode === "reset") {
        p.forceReset = true;
        p.passwordHash = hash("Welcome2026!");
        this.revoke(p.id);
      } else {
        if (b.role) {
          check(
            this.state.roles.some((r) => r.name === b.role),
            "ROLE_INVALID",
            "Choose a valid role.",
          );
          p.role = b.role;
        }
        if (b.status) {
          check(
            ["active", "inactive"].includes(b.status),
            "STATUS_INVALID",
            "Choose active or inactive.",
          );
          p.status = b.status;
        }
        if (b.name) p.name = String(b.name).trim().slice(0, 80);
        if (b.phone) {
          check(
            /^\+?[0-9 ()-]{9,18}$/.test(b.phone),
            "PHONE_INVALID",
            "Enter a valid phone number.",
          );
          p.phone = b.phone;
        }
        if (b.email && b.email !== p.email) {
          const email = String(b.email).trim().toLowerCase();
          check(
            /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) &&
              !this.state.staff.some((x) => x.id !== p.id && x.email === email),
            "EMAIL_INVALID",
            "Enter a work email no other staff member uses.",
          );
          p.email = email;
        }
        const activeSupers = this.state.staff.filter(
          (x) => x.role === "Super Admin" && x.status === "active",
        );
        if (activeSupers.length < 1 || activeSupers.length > 2) {
          Object.assign(p, before);
          throw new DomainError(
            "SUPER_ADMIN_LIMIT",
            "Keep between one and two active Super Admins.",
            409,
          );
        }
        this.revoke(p.id);
      }
      this.record(staff.id, "staff.updated", p.id, {
        before,
        after: safe(p),
        reason,
      });
      return {
        ...safe(p),
        ...(b.mode === "reset"
          ? { demoTemporaryPassword: "Welcome2026!" }
          : {}),
      };
    }
    if (action === "transfer") {
      if (b.mode === "resolve") {
        const t = this.state.transfers.find((t) => t.id === b.id);
        check(
          t && t.status === "pending",
          "OPERATION_UNAVAILABLE",
          "This transfer is not pending.",
        );
        check(
          this.state.accounts[t.source] >= t.amount,
          "INSUFFICIENT_FUNDS",
          "The source account has insufficient funds.",
        );
        this.state.accounts[t.source] -= t.amount;
        this.state.accounts[t.destination] += t.amount;
        this.state.funding = this.state.accounts.platform;
        t.status = "completed";
        this.post("transfer", t.amount, t.source, t.destination, t.id);
        this.record(staff.id, "transfer.confirmed", t.id, {
          reason,
          amount: t.amount,
        });
        return t;
      }
      check(
        Number.isSafeInteger(b.amount) && b.amount > 0,
        "AMOUNT_INVALID",
        "Enter a positive whole UGX amount.",
      );
      check(
        b.source !== b.destination &&
          b.source in this.state.accounts &&
          b.destination in this.state.accounts,
        "ACCOUNT_INVALID",
        "Choose two distinct ledger accounts.",
      );
      check(
        typeof b.key === "string" && b.key.length >= 8,
        "KEY_REQUIRED",
        "An operation reference is required.",
      );
      const existing = this.state.transfers.find((t) => t.id === b.key);
      if (existing) return existing;
      check(
        this.state.accounts[b.source] >= b.amount,
        "INSUFFICIENT_FUNDS",
        "The source account has insufficient funds.",
      );
      const t = {
        id: b.key,
        source: b.source,
        destination: b.destination,
        amount: b.amount,
        reason,
        status:
          b.outcome === "failed"
            ? "failed"
            : b.outcome === "pending"
              ? "pending"
              : "completed",
        createdAt: now(),
        actor: staff.id,
      };
      if (t.status === "completed") {
        this.state.accounts[b.source] -= b.amount;
        this.state.accounts[b.destination] += b.amount;
        this.state.funding = this.state.accounts.platform;
        this.post("transfer", b.amount, b.source, b.destination, t.id);
        for (const id of [b.source, b.destination])
          if (this.state.profiles.some((p) => p.id === id))
            this.notice(id, "Account adjustment", reason);
      }
      this.state.transfers.push(t);
      this.record(staff.id, "transfer." + t.status, t.id, { ...t });
      return t;
    }
    if (action === "reconcile") {
      check(
        Array.isArray(b.rows) && b.rows.length <= 500,
        "IMPORT_INVALID",
        "Import up to 500 settlement rows.",
      );
      check(
        b.rows.every(
          (row) =>
            row &&
            typeof row.reference === "string" &&
            row.reference.trim() &&
            Number.isSafeInteger(row.amount) &&
            row.amount > 0,
        ),
        "IMPORT_INVALID",
        "Every settlement row needs a reference and positive whole amount.",
      );
      const attempts = this.state.orders.flatMap((o) =>
        o.payment.attempts
          .filter((a) => !["cash", "wallet"].includes(a.method))
          .map((a) => ({
            orderId: o.id,
            reference: a.id,
            method: a.method,
            collectionStatus: a.status,
            amount: a.amount ?? o.quote.total,
          })),
      );
      for (const t of this.state.walletTopups)
        attempts.push({
          reference: t.id,
          account: t.account,
          method: t.method,
          collectionStatus:
            t.status === "completed"
              ? "paid"
              : t.status === "pending"
                ? "processing"
                : "failed",
          amount: t.amount,
          kind: "wallet_topup",
        });
      const seen = new Set();
      const rows = b.rows.map((row) => {
        const reference = row.reference.trim();
        const p = attempts.find((p) => p.reference === reference);
        const duplicate = seen.has(reference);
        seen.add(reference);
        return {
          ...row,
          reference,
          orderId: p?.orderId,
          account: p?.account,
          kind: p?.kind || (p ? "trip_payment" : undefined),
          method: p?.method,
          collectionStatus: p?.collectionStatus,
          expectedAmount: p?.amount,
          status: duplicate
            ? "duplicate"
            : !p
              ? "unexpected"
              : row.amount !== p.amount
                ? "amount_mismatch"
                : p.collectionStatus === "paid"
                  ? "matched"
                  : ["unknown", "processing"].includes(p.collectionStatus)
                    ? "confirmation_pending"
                    : "status_mismatch",
        };
      });
      for (const p of attempts)
        if (p.collectionStatus === "paid" && !seen.has(p.reference))
          rows.push({ ...p, expectedAmount: p.amount, status: "missing" });
      const record = {
        id: uid("REC"),
        createdAt: now(),
        actor: staff.id,
        rows,
      };
      this.state.reconciliations.push(record);
      this.record(staff.id, "reconciliation.imported", record.id, {
        matched: rows.filter((r) => r.status === "matched").length,
        total: rows.length,
      });
      return record;
    }
    if (action === "withdrawal") {
      const w = this.state.withdrawals.find((w) => w.id === b.id);
      check(w, "REQUEST_UNAVAILABLE", "This withdrawal could not be found.");
      if (w.status === "paid") return w;
      if (b.status === "approved") {
        check(
          w.status === "requested",
          "REQUEST_UNAVAILABLE",
          "Only a requested withdrawal can be approved.",
        );
        w.status = "approved";
        w.approvedBy = staff.id;
        w.approvedAt = now();
      } else if (b.status === "rejected") {
        check(
          ["requested", "approved", "failed"].includes(w.status),
          "REQUEST_UNAVAILABLE",
          "Resolve an in-progress payment before releasing its earnings.",
        );
        w.status = "rejected";
        w.rejectedBy = staff.id;
        w.rejectedAt = now();
      } else {
        check(
          b.status === "pay" || b.status === "resolve",
          "STATUS_INVALID",
          "Choose approve, reject, pay or resolve.",
        );
        check(
          ["success", "failed", "pending"].includes(b.outcome),
          "OUTCOME_INVALID",
          "Choose a payout result.",
        );
        w.attempts ??= [];
        if (b.status === "pay") {
          check(
            ["approved", "failed"].includes(w.status),
            "REQUEST_UNAVAILABLE",
            "Office approval is required before finance pays.",
          );
          check(
            typeof b.key === "string" && b.key.length >= 8,
            "KEY_REQUIRED",
            "A unique payout attempt reference is required.",
          );
          if (w.attempts.some((a) => a.id === b.key)) return w;
        } else {
          check(
            w.status === "processing" && b.outcome !== "pending",
            "REQUEST_UNAVAILABLE",
            "Confirm the result of the existing pending payment.",
          );
        }
        const reference = String(b.reference || "").trim();
        check(
          b.outcome !== "success" || reference.length >= 5,
          "REFERENCE_REQUIRED",
          "Record the finance or provider payment reference.",
        );
        check(
          !reference ||
            !this.state.withdrawals.some(
              (other) =>
                other.id !== w.id &&
                (other.reference === reference ||
                  other.attempts?.some((a) => a.reference === reference)),
            ),
          "REFERENCE_USED",
          "This payment reference belongs to another withdrawal.",
        );
        const fee =
          b.fee == null
            ? w.status === "processing"
              ? (w.fee ?? 0)
              : 0
            : Number(b.fee);
        const feePayer =
          b.feePayer ||
          (w.status === "processing" ? w.feePayer : "driver") ||
          "driver";
        check(
          Number.isSafeInteger(fee) &&
            fee >= 0 &&
            ["driver", "platform"].includes(feePayer) &&
            (feePayer !== "driver" || fee < w.amount),
          "FEE_INVALID",
          "Enter a non-negative whole charge. A driver-paid charge must be below the withdrawal amount.",
        );
        check(
          w.status !== "processing" ||
            (fee === (w.fee ?? 0) && feePayer === (w.feePayer || "driver")),
          "FEE_LOCKED",
          "Resolve this pending transfer using its recorded charge and payer.",
        );
        const charges = {
          fee,
          feePayer,
          netAmount: w.amount - (feePayer === "driver" ? fee : 0),
        };
        const payment = { ...w, ...charges };
        if (b.outcome === "pending")
          this.disburseWithdrawal(payment, reference, staff.id, true);
        if (payment.funding) w.funding = payment.funding;
        if (b.outcome === "failed" && w.funding) {
          const clearing = "withdrawalClearing:" + w.id;
          for (const f of w.funding) {
            this.state.accounts[clearing] -= f.amount;
            this.state.accounts[f.source] += f.amount;
            this.post("withdrawal.release", f.amount, clearing, f.source, w.id);
          }
          delete w.funding;
          this.state.funding = this.state.accounts.platform;
        }
        if (b.outcome === "success")
          this.disburseWithdrawal(payment, reference, staff.id);
        Object.assign(w, charges);
        if (b.outcome === "success") {
          delete w.funding;
          Object.assign(w, {
            reference: payment.reference,
            paidAt: payment.paidAt,
            paidBy: payment.paidBy,
          });
        }
        const attempt =
          b.status === "resolve"
            ? w.attempts.at(-1)
            : { id: b.key, createdAt: now(), actor: staff.id };
        attempt.status =
          b.outcome === "success"
            ? "paid"
            : b.outcome === "pending"
              ? "processing"
              : "failed";
        Object.assign(attempt, charges);
        attempt.reference = reference;
        attempt.message = reason;
        if (b.outcome !== "pending") attempt.resolvedAt = now();
        if (b.status === "pay") w.attempts.push(attempt);
        w.status = attempt.status;
      }
      w.reason = reason;
      this.record(staff.id, "withdrawal." + w.status, w.id, {
        amount: w.amount,
        fee: w.fee,
        feePayer: w.feePayer,
        netAmount: w.netAmount,
        reason,
      });
      this.notice(w.driverId, "Payout request " + w.status, reason);
      return w;
    }
    if (action === "reward") {
      if (b.mode === "create") {
        check(
          this.state.profiles.some((p) => p.id === b.account) &&
            Number.isSafeInteger(b.amount) &&
            b.amount > 0,
          "REWARD_INVALID",
          "Choose an account and positive amount.",
        );
        check(
          ["referral", "cashback"].includes(b.kind),
          "REWARD_INVALID",
          "Choose a referral or cashback reward.",
        );
        const o = this.order(b.orderId, "admin");
        check(
          o.stage === "delivered",
          "ORDER_INCOMPLETE",
          "Rewards must relate to a completed delivery.",
        );
        check(
          !this.state.rewards.some(
            (r) =>
              r.orderId === o.id &&
              r.account === b.account &&
              r.kind === b.kind,
          ),
          "REWARD_EXISTS",
          "This reward already exists.",
        );
        const r = {
          id: uid("REWARD"),
          account: b.account,
          orderId: o.id,
          kind: b.kind,
          amount: b.amount,
          status: "pending",
          reason,
          createdAt: now(),
        };
        this.state.rewards.push(r);
        this.record(staff.id, "reward.created", r.id, {
          amount: r.amount,
          reason,
        });
        return r;
      }
      const r = this.state.rewards.find((r) => r.id === b.id);
      check(
        r && r.status === "pending",
        "REWARD_UNAVAILABLE",
        "This reward is not pending.",
      );
      check(
        this.state.accounts.platform >= r.amount,
        "INSUFFICIENT_FUNDS",
        "The platform reserve is insufficient.",
      );
      this.state.accounts.platform -= r.amount;
      this.state.funding = this.state.accounts.platform;
      this.state.accounts[r.account] += r.amount;
      r.status = "paid";
      this.post("reward", r.amount, "platform", r.account, r.id);
      this.record(staff.id, "reward.paid", r.id, { amount: r.amount, reason });
      return r;
    }
  }
  disburseWithdrawal(w, reference, actor, reserveOnly = false) {
    const allocations =
      w.allocations ||
      w.orderIds.map((id) => ({
        orderId: id,
        amount: this.order(id, "admin").financial.earning,
      }));
    let settlement = 0;
    let reserve = 0;
    for (const a of allocations) {
      const o = this.order(a.orderId, "admin");
      check(
        o.financial.payoutStatus === "scheduled" &&
          a.amount <= o.financial.earning - (o.financial.disbursed || 0),
        "PAYOUT_UNAVAILABLE",
        "The earnings backing this withdrawal have changed.",
      );
      if (o.payment.status === "paid") settlement += a.amount;
      else reserve += a.amount;
    }
    const platformFee = w.feePayer === "platform" ? w.fee || 0 : 0;
    check(
      w.funding
        ? this.state.accounts["withdrawalClearing:" + w.id] >=
            w.amount + platformFee
        : this.state.accounts.settlement >= settlement &&
            this.state.accounts.platform >= reserve + platformFee,
      "INSUFFICIENT_FUNDS",
      "Funding is insufficient for this withdrawal.",
    );
    if (reserveOnly) {
      w.funding = allocations.map((a) => {
        const o = this.order(a.orderId, "admin");
        const source = o.payment.status === "paid" ? "settlement" : "platform";
        const clearing = "withdrawalClearing:" + w.id;
        this.state.accounts[source] -= a.amount;
        this.state.accounts[clearing] =
          (this.state.accounts[clearing] || 0) + a.amount;
        this.post("withdrawal.reserve", a.amount, source, clearing, w.id);
        return { ...a, source };
      });
      if (platformFee) {
        const clearing = "withdrawalClearing:" + w.id;
        this.state.accounts.platform -= platformFee;
        this.state.accounts[clearing] += platformFee;
        this.post(
          "withdrawal.reserve_fee",
          platformFee,
          "platform",
          clearing,
          w.id,
        );
        w.funding.push({ source: "platform", amount: platformFee });
      }
      this.state.funding = this.state.accounts.platform;
      return;
    }
    let remainingFee = w.feePayer === "driver" ? w.fee || 0 : 0;
    for (const a of allocations) {
      const o = this.order(a.orderId, "admin");
      const source = w.funding
        ? "withdrawalClearing:" + w.id
        : o.payment.status === "paid"
          ? "settlement"
          : "platform";
      const destination = `external:${w.provider || w.method || "mtn"}:${w.destination || this.profile(w.driverId).phone}`;
      const feeShare = Math.min(remainingFee, a.amount);
      remainingFee -= feeShare;
      const received = a.amount - feeShare;
      this.state.accounts[source] -= a.amount;
      this.state.accounts[destination] =
        (this.state.accounts[destination] || 0) + received;
      if (feeShare) {
        const feeAccount = "providerFees:" + (w.provider || w.method || "mtn");
        this.state.accounts[feeAccount] =
          (this.state.accounts[feeAccount] || 0) + feeShare;
        this.post(
          "withdrawal.fee",
          feeShare,
          source,
          feeAccount,
          w.id + "-" + o.id,
        );
      }
      o.financial.disbursed = (o.financial.disbursed || 0) + a.amount;
      if (o.financial.disbursed === o.financial.earning)
        o.financial.payoutStatus = "paid";
      o.financial.events.push({
        id: w.id + "-" + o.id,
        kind: "payout",
        amount: a.amount,
        reason: "Driver withdrawal " + reference,
        status: "paid",
        createdAt: now(),
        source,
        destination,
      });
      if (received)
        this.post(
          "withdrawal",
          received,
          source,
          destination,
          w.id + "-" + o.id,
        );
    }
    if (platformFee) {
      const source = w.funding ? "withdrawalClearing:" + w.id : "platform";
      const feeAccount = "providerFees:" + (w.provider || w.method || "mtn");
      this.state.accounts[source] -= platformFee;
      this.state.accounts[feeAccount] =
        (this.state.accounts[feeAccount] || 0) + platformFee;
      this.post("withdrawal.fee", platformFee, source, feeAccount, w.id);
    }
    this.state.funding = this.state.accounts.platform;
    delete w.funding;
    w.reference = reference;
    w.paidAt = now();
    w.paidBy = actor;
  }
  admin(id, b, actor = "admin") {
    const staff = this.permit(actor, "finance");
    const o = this.order(id, "admin");
    if (["payout", "guarantee"].includes(b.action))
      check(
        !(o.financial.disbursed > 0) &&
          !this.state.withdrawals.some(
            (w) =>
              ["requested", "approved", "processing", "failed"].includes(
                w.status,
              ) && w.orderIds.includes(id),
          ),
        "EARNINGS_RESERVED",
        "These earnings are allocated to driver withdrawals. Complete payment through the withdrawal request.",
      );
    if (b.action === "resolve-operation") {
      const op = this.state.operations.find(
        (op) => op.id === b.operationId && op.orderId === id,
      );
      check(
        op && op.status === "pending",
        "OPERATION_UNAVAILABLE",
        "No pending operation was found.",
      );
      const result = this.admin(
        id,
        { ...op.request, outcome: "success" },
        actor,
      );
      op.status = "completed";
      this.save();
      return result;
    }
    check(
      ["refund", "payout", "guarantee"].includes(b.action),
      "ACTION_INVALID",
      "Choose a financial action.",
    );
    check(
      Number.isSafeInteger(b.amount) &&
        b.amount > 0 &&
        String(b.reason || "").trim().length >= 5 &&
        typeof b.key === "string" &&
        b.key.length >= 8,
      "ADJUSTMENT_INVALID",
      "Enter an amount, reason and operation reference.",
    );
    const previous = this.state.operations.find((op) => op.id === b.key);
    if (previous && previous.status !== "pending") return o;
    if (["pending", "failed"].includes(b.outcome)) {
      check(
        !this.state.operations.some(
          (op) => op.orderId === id && op.status === "pending",
        ),
        "OPERATION_PENDING",
        "Resolve the existing pending operation first.",
      );
      check(
        !previous,
        "OPERATION_EXISTS",
        "This operation has already been recorded.",
      );
      if (b.action === "refund")
        check(
          o.payment.status === "paid" &&
            b.amount <= o.quote.total - o.financial.refunded,
          "REFUND_LIMIT",
          "This refund exceeds confirmed refundable funds.",
        );
      else
        check(
          ["delivered", "returned"].includes(o.stage) &&
            o.financial.payoutStatus === "scheduled" &&
            b.amount === o.financial.earning,
          "PAYOUT_UNAVAILABLE",
          "No matching unpaid driver entitlement exists.",
        );
      this.state.operations.push({
        id: b.key,
        orderId: id,
        kind: b.action,
        amount: b.amount,
        status: b.outcome,
        request: b,
        reason: b.reason,
        createdAt: now(),
        actor: staff.id,
      });
      this.record(staff.id, b.action + "." + b.outcome, id, {
        amount: b.amount,
        reason: b.reason,
      });
      return o;
    }
    const pending = this.state.operations.filter(
      (op) => op.orderId === id && op.status === "pending" && op.id !== b.key,
    );
    check(
      !pending.some((op) => op.kind === b.action),
      "OPERATION_PENDING",
      "Resolve the existing pending operation before starting another.",
    );
    const reserve = this.state.funding;
    const source =
      b.action === "guarantee"
        ? "platform"
        : b.action === "refund"
          ? b.source === "platform" || this.state.accounts.settlement < b.amount
            ? "platform"
            : "settlement"
          : "settlement";
    check(
      this.state.accounts[source] >= b.amount,
      "INSUFFICIENT_FUNDS",
      "The selected funding account has insufficient funds.",
    );
    if (b.action === "payout")
      this.state.funding = this.state.accounts.settlement;
    let result;
    const save = this.save;
    this.save = () => {};
    try {
      result = super.admin(id, b);
    } catch (e) {
      this.state.funding = reserve;
      throw e;
    } finally {
      this.save = save;
    }
    if (b.action === "payout") {
      this.state.accounts.settlement = this.state.funding;
      this.state.funding = reserve;
    } else if (b.action === "refund") {
      this.state.accounts[source] -= b.amount;
      if (source === "platform")
        this.state.funding = this.state.accounts.platform;
    } else this.state.accounts.platform = this.state.funding;
    const destination =
      b.action === "refund"
        ? this.refundDestination?.(o) || o.customerId
        : o.driverId;
    this.state.accounts[destination] =
      (this.state.accounts[destination] || 0) + b.amount;
    this.post(b.action, b.amount, source, destination, b.key);
    const entry = this.state.audit.at(-1);
    if (entry?.action === b.action) entry.actor = staff.id;
    if (previous) previous.status = "completed";
    else
      this.state.operations.push({
        id: b.key,
        orderId: id,
        kind: b.action,
        amount: b.amount,
        status: "completed",
        reason: b.reason,
        createdAt: now(),
        actor: staff.id,
      });
    this.notice(
      b.action === "refund" ? o.customerId : destination,
      b.action === "refund" ? "Refund issued" : "Driver payment sent",
      b.reason,
      id,
    );
    this.save();
    return result;
  }
}
