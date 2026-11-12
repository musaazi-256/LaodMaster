import { randomBytes, randomInt } from "node:crypto";
import { PlatformStore } from "./platform.mjs";
import { Store, DomainError, trucks } from "./model.mjs";
const check = (ok, code, message, status = 422) => {
  if (!ok) throw new DomainError(code, message, status);
};
const now = () => new Date().toISOString();
const uid = () => randomBytes(16).toString("hex");
const phone = (n) => /^\+?[0-9 ()-]{9,18}$/.test(String(n || ""));
const contact = (c) => {
  check(
    c && String(c.name || "").trim().length >= 2 && phone(c.phone),
    "CONTACT_REQUIRED",
    "Enter a contact name and valid phone number.",
  );
  return {
    name: String(c.name).trim().slice(0, 100),
    phone: String(c.phone).trim().slice(0, 30),
  };
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const distance = (a, b) =>
  Math.hypot(
    (a.latitude - b.latitude) * 111,
    (a.longitude - b.longitude) * 111,
  ) * 1.3;
export class CargoStore extends PlatformStore {
  constructor(file) {
    super(file);
    this.state.handoverCodes ??= {};
    this.state.trackingLinks ??= [];
    this.state.recipientLinks ??= [];
    this.state.pairAttempts ??= {};
    for (const [i, p] of this.state.profiles
      .filter((p) => p.role === "driver")
      .entries())
      p.pairCode ??= String(2001 + i);
  }
  quote(actor, b) {
    if (!b.stops) return super.quote(actor, b);
    check(
      Array.isArray(b.stops) && b.stops.length >= 1 && b.stops.length <= 5,
      "STOPS_INVALID",
      "Choose between one and five delivery stops.",
    );
    const own = this.snapshot(actor).places;
    const pickup = own.find((p) => p.id === b.pickupId);
    check(pickup, "ROUTE_INVALID", "Choose a pickup location.");
    const seen = new Set([pickup.id]);
    const stops = b.stops.map((s, i) => {
      const place = own.find((p) => p.id === s.placeId);
      check(
        place && !seen.has(place.id),
        "STOPS_INVALID",
        "Each destination must be different from pickup and the other stops.",
      );
      seen.add(place.id);
      check(
        Number.isInteger(s.helpers) && s.helpers >= 0 && s.helpers <= 2,
        "HANDLING_INVALID",
        "Choose zero, one or two helpers per stop.",
      );
      return { id: s.id || `stop-${i + 1}`, place, helpers: s.helpers };
    });
    const q = super.quote(actor, {
      ...b,
      destinationId: stops.at(-1).place.id,
      offloading: 0,
    });
    let from = pickup;
    let km = 0;
    for (const s of stops) {
      km += distance(from, s.place);
      from = s.place;
    }
    const t = trucks.find((t) => t.id === b.truckId);
    q.distance = Math.max(2, Math.round(km));
    q.transport = t.base + q.distance * t.perKm;
    q.stops = stops;
    q.offloading = stops.reduce((n, s) => n + s.helpers, 0);
    q.offloadingFee = q.offloading * this.state.helperRate;
    q.stopFee = (stops.length - 1) * 1500;
    q.total = q.transport + q.loadingFee + q.offloadingFee + q.stopFee;
    q.routeEstimate = "Demo distance estimate; road route preview is separate.";
    this.save();
    return q;
  }
  pair(actor, b) {
    this.active(actor);
    check(
      this.profile(actor).role === "customer",
      "FORBIDDEN",
      "Only customers can pair with a driver.",
      403,
    );
    const at = Date.now();
    const a = (this.state.pairAttempts[actor] ??= { at, count: 0 });
    if (at - a.at > 60000) {
      a.at = at;
      a.count = 0;
    }
    check(
      a.count < 8,
      "PAIR_RATE_LIMIT",
      "Too many pairing attempts. Wait one minute.",
    );
    a.count++;
    this.save();
    const p = this.state.profiles.find(
      (p) =>
        p.role === "driver" &&
        (p.pairCode === String(b.code).trim() ||
          p.id === String(b.code).trim()),
    );
    check(p, "PAIR_NOT_FOUND", "Check the driver’s short number.");
    check(
      p.status === "active" && p.verified && p.online && !this.busy(p.id),
      "DRIVER_UNAVAILABLE",
      "This driver is unavailable. Choose automatic matching instead.",
    );
    const requested = trucks.find((t) => t.id === b.truckId);
    check(
      requested &&
        trucks.find((t) => t.id === p.truckId)?.maxKg >= requested.maxKg,
      "CAPACITY_MISMATCH",
      "This driver’s truck is too small for the selected load.",
    );
    return {
      id: p.id,
      name: p.name,
      vehicle: p.vehicle,
      plate: p.plate,
      pairCode: p.pairCode,
      truckId: p.truckId,
    };
  }
  create(actor, b, key) {
    const previous = this.state.keys[actor + ":" + key];
    if (previous) return this.order(previous, actor);
    if (!b.cargoPlan) return super.create(actor, b, key);
    const q = this.state.quotes.find(
      (q) => q.id === b.quoteId && q.actor === actor,
    );
    check(q?.stops, "QUOTE_MISSING", "Get a cargo quote before ordering.");
    const plan = b.cargoPlan;
    const sender = contact(plan.sender);
    check(
      plan.termsAccepted === true,
      "TERMS_REQUIRED",
      "Confirm the cargo and service acknowledgement.",
    );
    check(
      Array.isArray(plan.items) &&
        plan.items.length > 0 &&
        plan.items.length <= 20,
      "CARGO_REQUIRED",
      "Add between one and twenty cargo items.",
    );
    const stopIds = q.stops.map((s) => s.id);
    const items = plan.items.map((item, i) => {
      check(
        String(item.description || "").trim().length >= 2,
        "CARGO_REQUIRED",
        `Describe cargo item ${i + 1}.`,
      );
      check(
        Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 1000 &&
          Number.isFinite(item.weightKg) &&
          item.weightKg > 0,
        "CARGO_INVALID",
        "Enter positive item quantities and unit weights.",
      );
      check(
        stopIds.includes(item.stopId),
        "CARGO_STOP_INVALID",
        "Assign every cargo item to a delivery stop.",
      );
      return {
        id: item.id || uid(),
        description: String(item.description).trim().slice(0, 256),
        quantity: item.quantity,
        weightKg: item.weightKg,
        dimensions: String(item.dimensions || "").slice(0, 100),
        fragile: !!item.fragile,
        stopId: item.stopId,
      };
    });
    check(
      items.reduce((n, i) => n + i.quantity * i.weightKg, 0) <=
        trucks.find((t) => t.id === q.truckId).maxKg,
      "CAPACITY_MISMATCH",
      "The combined cargo weight exceeds this truck’s capacity.",
    );
    const stops = q.stops.map((s) => {
      const detail = plan.stops?.find((x) => x.id === s.id);
      check(
        items.some((i) => i.stopId === s.id),
        "EMPTY_STOP",
        "Assign cargo to every delivery stop.",
      );
      return {
        ...s,
        recipient: contact(detail?.recipient),
        instructions: String(detail?.instructions || "").slice(0, 256),
        status: "pending",
        pinRequired: !!detail?.pinRequired,
        pinAttempts: 0,
      };
    });
    check(
      !(plan.payer === "recipient" && b.method === "wallet"),
      "PAYER_METHOD_INVALID",
      "Recipient payments require cash or an external payment method; do not debit the ordering customer’s wallet.",
    );
    check(
      ["customer", "recipient"].includes(plan.payer),
      "PAYER_INVALID",
      "Choose who pays the transport charge.",
    );
    check(
      !b.scheduledAt || !plan.pairCode,
      "PAIR_SCHEDULED",
      "Use automatic matching for scheduled orders.",
    );
    const paired = plan.pairCode
      ? this.pair(actor, { code: plan.pairCode, truckId: q.truckId })
      : null;
    check(
      b.method !== "external_wallet" ||
        String(plan.externalWalletName || "").trim().length >= 2,
      "PROVIDER_REQUIRED",
      "Name the external wallet for this demo.",
    );
    const o = super.create(
      actor,
      {
        ...b,
        cargo: items.map((i) => `${i.quantity} × ${i.description}`).join("; "),
        recipient: stops.at(-1).recipient.name,
        recipientPhone: stops.at(-1).recipient.phone,
      },
      key,
    );
    o.cargoPlan = {
      sender,
      items,
      stops,
      payer: plan.payer,
      pairCode: paired?.pairCode || null,
      pickupInstructions: String(plan.pickupInstructions || "").slice(0, 256),
      externalWalletName: String(plan.externalWalletName || "").slice(0, 50),
      termsAcceptedAt: now(),
    };
    o.currentStop = 0;
    o.messages = [];
    o.preferredDriverId = paired?.id || null;
    this.state.handoverCodes[o.id] = Object.fromEntries(
      stops
        .filter((s) => s.pinRequired)
        .map((s) => [s.id, String(randomInt(1000, 10000))]),
    );
    if (plan.payer === "recipient") {
      const token = uid();
      this.state.recipientLinks.push({
        token,
        orderId: o.id,
        expires: Date.now() + 7 * 86400000,
        accepted: false,
      });
    }
    this.record(actor, "cargo.created", o.id, {
      stops: stops.length,
      items: items.length,
      paired: paired?.id || null,
      payer: plan.payer,
    });
    return o;
  }
  offerable(p, o) {
    return (
      (!o.preferredDriverId || o.preferredDriverId === p.id) &&
      super.offerable(p, o)
    );
  }
  accept(actor, id) {
    const o = this.order(id, "admin");
    check(
      !o.preferredDriverId || o.preferredDriverId === actor,
      "PAIR_ONLY",
      "This order is awaiting the paired driver.",
      403,
    );
    return super.accept(actor, id);
  }
  snapshot(actor) {
    const s = clone(super.snapshot(actor));
    s.profile.pairCode = this.profile(actor).pairCode;
    for (const o of s.orders) {
      if (o.customerId === actor) {
        o.demoHandoverCodes = this.state.handoverCodes[o.id] || {};
        const link = this.state.recipientLinks.find(
          (l) => l.orderId === o.id && !l.revoked,
        );
        if (link)
          o.recipientPayment = {
            token: link.token,
            accepted: link.accepted,
            expires: link.expires,
          };
      }
      if (o.cargoPlan) delete o.cargoPlan.pairCode;
    }
    for (const o of s.offers) {
      if (o.cargoPlan) {
        o.cargoPlan.sender = {
          name: "Pickup contact available after acceptance",
          phone: "",
        };
        for (const stop of o.cargoPlan.stops)
          stop.recipient = {
            name: "Recipient available after acceptance",
            phone: "",
          };
      }
      o.recipientPhone = "";
      delete o.demoHandoverCodes;
      delete o.recipientPayment;
    }
    return s;
  }
  advance(actor, id, b) {
    const o = this.order(id, actor);
    check(
      o.driverId === actor,
      "FORBIDDEN",
      "Only the assigned driver can update delivery.",
      403,
    );
    if (!o.cargoPlan) return super.advance(actor, id, b);
    if (b.stage !== "delivered") return super.advance(actor, id, b);
    if (o.stage === "delivered") return o;
    if (
      b.stopId &&
      o.cargoPlan.stops.find((s) => s.id === b.stopId)?.status === "delivered"
    )
      return o;
    check(
      o.stage === "offloading",
      "STAGE_CONFLICT",
      "Complete offloading at the current stop first.",
    );
    const stop = o.cargoPlan.stops[o.currentStop];
    check(b.confirmed === true, "HANDOVER_REQUIRED", "Confirm cargo handover.");
    if (stop.pinRequired) {
      check(
        stop.pinAttempts < 5,
        "PIN_LOCKED",
        "Too many incorrect codes. Ask support to review handover.",
      );
      if (String(b.pin) !== this.state.handoverCodes[o.id]?.[stop.id]) {
        stop.pinAttempts++;
        this.save();
        throw new DomainError(
          "PIN_INVALID",
          "The recipient handover code is incorrect.",
          422,
        );
      }
    }
    stop.status = "delivered";
    stop.deliveredAt = now();
    stop.proof = stop.pinRequired ? "recipient_pin" : "driver_confirmation";
    if (o.currentStop < o.cargoPlan.stops.length - 1) {
      o.currentStop++;
      this.update(
        o,
        "in_transit",
        `Stop ${o.currentStop} completed; proceeding to stop ${o.currentStop + 1}`,
      );
      this.record(actor, "cargo.stop_delivered", id, { stop: stop.id });
      return o;
    }
    if (o.cargoPlan.stops.some((s) => s.status === "failed")) {
      o.return = {
        status: "returning",
        reason:
          "Undelivered cargo remains in custody after the completed stops.",
        authorizedBy: "supervisor-reviewed-stop",
      };
      this.update(
        o,
        "returning",
        "Completed available handovers; return remaining failed cargo to sender for supervisor confirmation.",
      );
      this.record(actor, "cargo.partial_return", id, {});
      return o;
    }
    return super.advance(actor, id, b);
  }
  refundDestination(o) {
    return o.cargoPlan?.payer === "recipient"
      ? "recipient:" + o.id
      : super.refundDestination(o);
  }
  paid(o, a) {
    if (o.payment.status === "paid") return;
    if (o.method === "wallet") {
      check(
        (this.state.accounts[o.customerId] || 0) >= o.quote.total,
        "INSUFFICIENT_FUNDS",
        "Your LoadMaster wallet has insufficient funds. Add funds or choose another method.",
      );
      Store.prototype.paid.call(this, o, a);
      this.state.accounts[o.customerId] -= o.quote.total;
      this.state.accounts.settlement += o.quote.total;
      this.post(
        "wallet.collection",
        o.quote.total,
        o.customerId,
        "settlement",
        o.id,
      );
      this.collectionNotice(o);
      return;
    }
    if (o.method === "cash") {
      const alreadyPaid = o.financial.payoutStatus === "paid";
      Store.prototype.paid.call(this, o, a);
      const account = "driverCash:" + o.driverId;
      this.state.accounts[account] ??= 0;
      this.state.accounts[account] += o.quote.total;
      this.post(
        "cash.collection",
        o.quote.total,
        "external-customer",
        account,
        o.id,
      );
      if (!alreadyPaid) {
        this.state.accounts[account] -= o.financial.earning;
        this.state.accounts[o.driverId] += o.financial.earning;
        this.post(
          "cash.retained_earning",
          o.financial.earning,
          account,
          o.driverId,
          o.id,
        );
      }
      o.financial.cash = {
        gross: o.quote.total,
        feeDue: alreadyPaid ? o.quote.total : o.financial.fee,
        remitted: 0,
      };
      o.financial.payoutStatus = "paid";
      if (!alreadyPaid)
        o.financial.events.push({
          id: uid(),
          kind: "payout",
          amount: o.financial.earning,
          reason: alreadyPaid
            ? "Driver already paid; collected cash is owed to platform"
            : "Driver retained cash earning; do not pay again",
          status: "paid",
          createdAt: now(),
          source: account,
          destination: o.driverId,
        });
      this.collectionNotice(o);
      return;
    }
    return super.paid(o, a);
  }
  payment(actor, id, b) {
    const o = this.order(id, actor);
    if (o.cargoPlan?.payer === "recipient" && !this.recipientContext)
      throw new DomainError(
        "RECIPIENT_APPROVAL_REQUIRED",
        "Send the recipient payment link. The recipient must accept and approve payment.",
        403,
      );
    if (o.method === "cash" && b.action !== "retry") {
      check(
        actor === o.customerId,
        "FORBIDDEN",
        "Only the payer may confirm cash payment.",
        403,
      );
      check(
        ["delivered", "returned"].includes(o.stage),
        "NOT_DUE",
        "Cash is collected after cargo handover.",
      );
      check(
        o.cashDeclaration,
        "CASH_NOT_RECORDED",
        "The driver must record cash received first.",
      );
      if (o.payment.status === "paid") return o;
      check(
        b.action === "confirm-cash",
        "CASH_CONFIRM_REQUIRED",
        "Confirm the exact cash amount received by the driver.",
      );
      this.paid(o, o.payment.attempts.at(-1));
      this.record(actor, "cash.confirmed", id, { amount: o.quote.total });
      return o;
    }
    if (b.action === "retry" && b.method === "cash")
      check(
        !(o.financial.disbursed > 0) &&
          !this.state.withdrawals.some(
            (w) =>
              ["requested", "approved", "processing", "failed"].includes(
                w.status,
              ) && w.orderIds.includes(id),
          ),
        "EARNINGS_RESERVED",
        "Resolve the driver withdrawal before changing collection to cash.",
      );
    if (b.action === "retry" && b.method === "external_wallet") {
      check(
        String(b.provider || o.cargoPlan?.externalWalletName || "").trim()
          .length >= 2,
        "PROVIDER_REQUIRED",
        "Name the external wallet provider.",
      );
      if (o.cargoPlan)
        o.cargoPlan.externalWalletName = String(
          b.provider || o.cargoPlan.externalWalletName,
        ).slice(0, 50);
    }
    check(
      !(o.cargoPlan?.payer === "recipient" && b.method === "wallet"),
      "PAYER_METHOD_INVALID",
      "Choose the recipient’s external payment method.",
    );
    try {
      return super.payment(actor, id, b);
    } catch (e) {
      if (e.code === "INSUFFICIENT_FUNDS" && o.method === "wallet") {
        o.payment.status = "failed";
        o.payment.message = e.message;
        const a = o.payment.attempts.at(-1);
        if (a) {
          a.status = "failed";
          a.message = e.message;
          a.resolvedAt = now();
        }
        if (o.driverId)
          this.notice(
            o.driverId,
            "Payment failed",
            `${o.id}: ${e.message}`,
            o.id,
          );
        this.record(actor, "payment.wallet_failed", id, {});
        return o;
      }
      throw e;
    }
  }
  cargoAction(actor, id, b) {
    const o = this.order(id, actor);
    check(
      actor === o.customerId || actor === o.driverId,
      "FORBIDDEN",
      "This action is restricted to this order’s customer and assigned driver.",
      403,
    );
    if (b.action === "message") {
      check(
        typeof b.key === "string" && b.key.length >= 8,
        "KEY_REQUIRED",
        "A message reference is required.",
      );
      o.messages ??= [];
      const previous = o.messages.find((m) => m.id === b.key);
      if (previous) return previous;
      check(
        String(b.text || "").trim().length > 0 && String(b.text).length <= 500,
        "MESSAGE_INVALID",
        "Write a message of up to 500 characters.",
      );
      const m = {
        id: b.key,
        from: actor,
        text: String(b.text).trim(),
        at: now(),
      };
      o.messages.push(m);
      this.record(actor, "order.message", id, { messageId: m.id });
      return m;
    }
    if (b.action === "unpair") {
      check(
        actor === o.customerId && o.stage === "searching",
        "PAIR_RELEASE_UNAVAILABLE",
        "Only the customer can switch matching before assignment.",
      );
      o.preferredDriverId = null;
      this.record(actor, "pair.released", id, {});
      return o;
    }
    if (b.action === "cash-received") {
      check(
        actor === o.driverId && o.method === "cash",
        "FORBIDDEN",
        "Only the assigned driver records cash collection.",
        403,
      );
      check(
        ["delivered", "returned"].includes(o.stage),
        "NOT_DUE",
        "Finish handover before recording cash.",
      );
      check(
        b.amount === o.quote.total,
        "CASH_AMOUNT_MISMATCH",
        "The cash amount must match the agreed transport total. Report an issue for a different amount.",
      );
      if (!o.cashDeclaration) {
        o.cashDeclaration = { amount: b.amount, at: now() };
        this.record(actor, "cash.declared", id, { amount: b.amount });
      }
      return o;
    }
    if (b.action === "failed-stop") {
      check(
        actor === o.driverId &&
          o.cargoPlan &&
          ["at_destination", "offloading"].includes(o.stage),
        "STAGE_CONFLICT",
        "Report a failed handover at the current destination.",
      );
      check(
        String(b.reason || "").trim().length >= 5,
        "REASON_REQUIRED",
        "Explain why this stop cannot be delivered.",
      );
      const stop = o.cargoPlan.stops[o.currentStop];
      stop.status = "failed";
      stop.reason = String(b.reason).slice(0, 256);
      super.issue(actor, id, {
        message: `Stop ${o.currentStop + 1}: ${stop.reason}`,
      });
      this.record(actor, "cargo.stop_failed", id, { stop: stop.id });
      return o;
    }
    if (b.action === "share") {
      check(
        actor === o.customerId,
        "FORBIDDEN",
        "Only the customer can share tracking.",
        403,
      );
      const t = { token: uid(), orderId: id, expires: Date.now() + 86400000 };
      this.state.trackingLinks.push(t);
      this.record(actor, "tracking.shared", id, {});
      return { path: "/track/" + t.token, expires: t.expires };
    }
    if (b.action === "revoke-share") {
      check(
        actor === o.customerId,
        "FORBIDDEN",
        "Only the customer can revoke sharing.",
        403,
      );
      for (const t of this.state.trackingLinks.filter((t) => t.orderId === id))
        t.revoked = true;
      this.record(actor, "tracking.revoked", id, {});
      return { ok: true };
    }
    throw new DomainError(
      "ACTION_INVALID",
      "Choose a supported cargo action.",
      422,
    );
  }
  mobile(actor, action, b) {
    if (action === "pair") return this.pair(actor, b);
    return super.mobile(actor, action, b);
  }
  tracking(token) {
    const t = this.state.trackingLinks.find(
      (t) => t.token === token && !t.revoked && t.expires > Date.now(),
    );
    check(t, "LINK_EXPIRED", "This tracking link expired or was revoked.", 404);
    const o = this.order(t.orderId, "admin");
    const d = this.state.profiles.find((p) => p.id === o.driverId);
    return {
      id: o.id,
      stage: o.stage,
      pickup: o.quote.pickup.name,
      destination: o.quote.destination.name,
      stops: o.cargoPlan?.stops.map((s) => ({
        name: s.place.name,
        status: s.status,
      })),
      driver: d
        ? { name: d.name.split(" ")[0], vehicle: d.vehicle, plate: d.plate }
        : null,
      timeline: o.timeline.map(({ stage, at }) => ({ stage, at })),
      tracking: "Prototype: driver GPS and ETA are simulated.",
    };
  }
  recipientPayment(token, b) {
    const link = this.state.recipientLinks.find(
      (l) => l.token === token && !l.revoked && l.expires > Date.now(),
    );
    check(
      link,
      "LINK_EXPIRED",
      "This recipient payment link has expired.",
      404,
    );
    const o = this.order(link.orderId, "admin");
    if (!b)
      return {
        id: o.id,
        amount: o.quote.total,
        method: o.method,
        status: o.payment.status,
        stage: o.stage,
        accepted: link.accepted,
        refunded: o.financial.refunded,
        reference: o.payment.reference,
      };
    if (b.action === "accept") {
      link.accepted = true;
      link.acceptedAt = now();
      this.record("recipient", "payer.accepted", o.id, {});
      return this.recipientPayment(token);
    }
    check(
      link.accepted,
      "PAYER_ACCEPTANCE_REQUIRED",
      "Accept the transport payment request first.",
      403,
    );
    this.recipientContext = true;
    try {
      this.payment(o.customerId, o.id, b);
      return this.recipientPayment(token);
    } finally {
      this.recipientContext = false;
    }
  }
  adminAction(actor, action, b) {
    if (action !== "cargo") return super.adminAction(actor, action, b);
    this.permit(actor, "orders");
    const staff = this.staff(actor);
    check(
      this.can(staff.id, "cargo.supervise"),
      "FORBIDDEN",
      "An operations supervisor must resolve cargo handovers.",
      403,
    );
    const o = this.order(b.id, "admin");
    check(
      String(b.reason || "").trim().length >= 5,
      "REASON_REQUIRED",
      "Record an operational reason.",
    );
    if (b.action === "pin-override") {
      const stop = o.cargoPlan?.stops[o.currentStop];
      check(
        stop && o.stage === "offloading",
        "STAGE_CONFLICT",
        "Review handover at the current stop.",
      );
      stop.pinRequired = false;
      stop.overrideBy = staff.id;
      stop.overrideReason = b.reason;
    } else if (b.action === "skip-failed") {
      const stop = o.cargoPlan?.stops[o.currentStop];
      check(
        stop?.status === "failed" &&
          o.currentStop < o.cargoPlan.stops.length - 1,
        "STAGE_CONFLICT",
        "Only a failed intermediate stop can be skipped.",
      );
      o.currentStop++;
      this.update(
        o,
        "in_transit",
        "Supervisor approved proceeding; failed cargo remains in custody.",
      );
    } else if (b.action === "return") {
      check(
        o.cargoPlan &&
          ["loading", "in_transit", "at_destination", "offloading"].includes(
            o.stage,
          ),
        "STAGE_CONFLICT",
        "A return requires cargo in custody.",
      );
      o.return = {
        status: "returning",
        reason: b.reason,
        authorizedBy: staff.id,
      };
      this.update(
        o,
        "returning",
        "Supervisor authorized return to pickup. No extra fee added.",
      );
    } else if (b.action === "returned") {
      check(
        o.stage === "returning" && b.confirmed === true,
        "HANDOVER_REQUIRED",
        "Confirm cargo returned to the sender.",
      );
      o.return.status = "returned";
      o.return.completedAt = now();
      for (const stop of o.cargoPlan.stops.filter(
        (s) => s.status !== "delivered",
      ))
        stop.status = "returned";
      this.update(
        o,
        "returned",
        "Cargo returned to sender after supervisor review.",
      );
      o.financial.payoutStatus = "scheduled";
      this.attempt(o, "success");
    } else
      throw new DomainError(
        "ACTION_INVALID",
        "Choose a supported cargo operation.",
        422,
      );
    this.record(staff.id, "cargo." + b.action, o.id, { reason: b.reason });
    return o;
  }
  adminCash(actor, b) {
    this.permit(actor, "finance");
    const o = this.order(b.id, "admin");
    check(
      o.method === "cash" && o.payment.status === "paid" && o.financial.cash,
      "CASH_NOT_COLLECTED",
      "Confirm cash collection first.",
    );
    check(
      String(b.reason || "").trim().length >= 5,
      "REASON_REQUIRED",
      "Record the remittance evidence.",
    );
    if (o.financial.cash.remitted) return o;
    const amount = o.financial.cash.feeDue;
    const source = "driverCash:" + o.driverId;
    check(
      this.state.accounts[source] >= amount,
      "INSUFFICIENT_FUNDS",
      "The driver cash account is short.",
    );
    this.state.accounts[source] -= amount;
    this.state.accounts.settlement += amount;
    o.financial.cash.remitted = amount;
    this.post("cash.fee_remittance", amount, source, "settlement", o.id);
    this.record(this.staff(actor).id, "cash.remitted", o.id, {
      reason: b.reason,
    });
    return o;
  }
}
