import test from "node:test";
import assert from "node:assert/strict";
import { PlatformStore } from "../services/demo/platform.mjs";
const code = (c) => (e) => e.code === c;
const login = (s, role = "customer", identifier = "alex@example.test") =>
  s.auth("login", { role, identifier, password: "DemoCargo2026!" });
const create = (s, customer = "customer-1") =>
  s.create(
    customer,
    {
      quoteId: s.quote(customer, {
        pickupId: "ntinda",
        destinationId: "nakawa",
        truckId: "small",
        loading: 1,
      }).id,
      method: "mtn",
    },
    "full-order-key-" + customer,
  );
function delivered(s) {
  const o = create(s);
  s.availability("driver-1", { online: true });
  s.accept("driver-1", o.id);
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
    "delivered",
  ])
    s.advance("driver-1", o.id, { stage, confirmed: true });
  return o;
}
const paid = (s, o) =>
  s.payment(o.customerId, o.id, { action: "approve", scenario: "success" });
test("sign in, registration OTP, expiry/cooldown and password reset are connected and revoke old sessions", () => {
  const s = new PlatformStore();
  const session = login(s);
  assert.equal(s.resolveToken(session.token), "customer-1");
  assert.equal(session.profile.passwordHash, undefined);
  assert.throws(
    () => login(s, "customer", "missing"),
    code("CREDENTIALS_INVALID"),
  );
  const reg = s.auth("register", {
    role: "driver",
    name: "Demo New Driver",
    phone: "+256700123456",
    email: "new@example.test",
    password: "NewDriver2026!",
  });
  assert.ok(reg.challenge);
  assert.throws(
    () => s.auth("verify", { challenge: reg.challenge, code: "000000" }),
    code("CODE_INCORRECT"),
  );
  assert.throws(
    () => s.auth("resend", { challenge: reg.challenge }),
    code("RESEND_COOLDOWN"),
  );
  const verified = s.auth("verify", {
    challenge: reg.challenge,
    code: reg.demoCode,
  });
  assert.equal(verified.profile.verified, false);
  assert.equal(verified.profile.phoneVerified, true);
  const reset = s.auth("recover", { identifier: "alex@example.test" });
  s.auth("verify", {
    challenge: reset.challenge,
    code: reset.demoCode,
    password: "Changed2026!",
  });
  assert.throws(() => s.resolveToken(session.token), code("SESSION_EXPIRED"));
  assert.equal(
    s.auth("login", {
      role: "customer",
      identifier: "alex@example.test",
      password: "Changed2026!",
    }).account,
    "customer-1",
  );
});
test("staff sessions enforce role scope in API and snapshot, including financial redaction", () => {
  const s = new PlatformStore();
  create(s);
  const field = login(s, "staff", "peter@loadmaster.test");
  assert.throws(() => s.permit(field.account, "finance"), code("FORBIDDEN"));
  assert.equal(s.adminSnapshot(field.account).orders.length, 0);
  const care = login(s, "staff", "joan@loadmaster.test");
  const snapshot = s.adminSnapshot(care.account);
  assert.equal(snapshot.orders[0].quote.total, undefined);
  assert.equal(snapshot.orders[0].financial, undefined);
  assert.equal(snapshot.people[0].passwordHash, undefined);
  assert.equal(snapshot.people[0].paymentMethods, undefined);
  assert.throws(
    () =>
      s.adminAction(care.account, "user", {
        id: "driver-1",
        status: "suspended",
        reason: "No permission to suspend",
      }),
    code("FORBIDDEN"),
  );
});
test("driver document submission, rejection, resubmission and approval control eligibility", () => {
  const s = new PlatformStore();
  const reg = s.auth("register", {
    role: "driver",
    name: "Demo Applicant",
    phone: "+256700123457",
    password: "NewDriver2026!",
  });
  const id = s.auth("verify", {
    challenge: reg.challenge,
    code: reg.demoCode,
  }).account;
  s.mobile(id, "vehicle", {
    truckId: "medium",
    vehicle: "Canter demo",
    plate: "UBB 111 A",
  });
  assert.throws(
    () => s.availability(id, { online: true }),
    code("VERIFICATION_REQUIRED"),
  );
  const content =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD2kAAAAASUVORK5CYII=";
  for (const name of [
    "Driver licence",
    "Identity document",
    "Vehicle registration",
    "Third-party insurance",
  ]) {
    const d = s.mobile(id, "document", { name, content, fileName: "demo.png" });
    s.adminAction("admin", "document", {
      account: id,
      id: d.id,
      status: "approved",
      reason: "Synthetic evidence reviewed",
    });
  }
  s.adminAction("admin", "user", {
    id,
    verify: true,
    reason: "All required records approved",
  });
  s.availability(id, { online: true });
  assert.equal(s.profile(id).verified, true);
  const d = s.profile(id).documents[0];
  s.adminAction("admin", "document", {
    account: id,
    id: d.id,
    status: "rejected",
    reason: "Please resubmit a clearer demo photo",
  });
  assert.equal(s.profile(id).online, false);
  assert.equal(s.profile(id).verified, false);
  assert.equal(s.snapshot(id).profile.documents[0].content, undefined);
});
test("staff cap, access changes and first-login credentials work without exposing hashes in audit", () => {
  const s = new PlatformStore();
  const original = login(s, "staff", "daniel@loadmaster.test");
  const invited = s.adminAction("admin", "staff", {
    mode: "create",
    name: "Second Owner",
    email: "owner2@example.test",
    phone: "+256700999999",
    role: "Super Admin",
  });
  assert.equal(invited.demoTemporaryPassword, "Welcome2026!");
  assert.throws(
    () =>
      s.adminAction("admin", "staff", {
        mode: "create",
        name: "Third Owner",
        email: "owner3@example.test",
        phone: "+256700999998",
        role: "Super Admin",
      }),
    code("SUPER_ADMIN_LIMIT"),
  );
  s.adminAction("admin", "staff", {
    id: "staff-2",
    role: "Customer Care",
    status: "active",
    reason: "Reduce finance permissions",
  });
  assert.throws(() => s.resolveToken(original.token), code("SESSION_EXPIRED"));
  const setup = s.auth("login", {
    role: "staff",
    identifier: "owner2@example.test",
    password: "Welcome2026!",
  });
  assert.equal(setup.forceReset, true);
  const result = s.auth("verify", {
    challenge: setup.challenge,
    code: setup.demoCode,
    password: "OwnerChanged2026!",
  });
  assert.ok(result.token);
  assert.ok(!JSON.stringify(s.state.audit).includes("passwordHash"));
});
test("fund transfers are balanced, idempotent and uncertain outcomes require explicit resolution", () => {
  const s = new PlatformStore();
  const b = {
    source: "platform",
    destination: "customer-1",
    amount: 20000,
    key: "transfer-demo-ref",
    reason: "Approved prototype adjustment",
  };
  s.adminAction("admin", "transfer", b);
  s.adminAction("admin", "transfer", b);
  assert.equal(s.state.accounts["customer-1"], 20000);
  assert.equal(s.state.accounts.platform, 4980000);
  const pending = s.adminAction("admin", "transfer", {
    ...b,
    key: "pending-transfer-ref",
    outcome: "pending",
  });
  assert.equal(s.state.accounts["customer-1"], 20000);
  s.adminAction("admin", "transfer", {
    mode: "resolve",
    id: pending.id,
    reason: "Provider confirms demo success",
  });
  assert.equal(s.state.accounts["customer-1"], 40000);
  for (const l of s.state.ledger)
    assert.equal(
      l.entries.reduce((n, e) => n + e.amount, 0),
      0,
    );
  assert.throws(
    () =>
      s.adminAction("admin", "transfer", {
        ...b,
        key: "too-much-ref",
        amount: 99999999,
      }),
    code("INSUFFICIENT_FUNDS"),
  );
});
test("pending refund does not change balances until resolution; customer and driver views agree", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const initial = s.state.accounts.settlement;
  const b = {
    action: "refund",
    amount: 12000,
    reason: "Loading help not provided",
    key: "refund-demo-ref",
    outcome: "pending",
  };
  s.admin(o.id, b);
  assert.equal(o.financial.refunded, 0);
  assert.equal(s.state.accounts.settlement, initial);
  assert.throws(
    () => s.admin(o.id, { ...b, key: "duplicate-pending" }),
    code("OPERATION_PENDING"),
  );
  s.admin(o.id, { action: "resolve-operation", operationId: b.key });
  assert.equal(o.financial.refunded, 12000);
  assert.equal(s.snapshot("customer-1").orders[0].financial.refunded, 12000);
  assert.equal(s.snapshot("driver-1").orders[0].financial.refunded, 12000);
  assert.equal(s.state.accounts.settlement, initial - 12000);
});
test("driver payout request is separate from collection; approved unpaid delivery uses reserve once", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  const w = s.mobile("driver-1", "withdrawal", {});
  assert.throws(
    () => s.mobile("driver-1", "withdrawal", {}),
    code("REQUEST_EXISTS"),
  );
  s.adminAction("admin", "withdrawal", {
    id: w.id,
    status: "approved",
    reason: "Verified delivery guarantee approved",
  });
  assert.equal(w.status, "approved");
  assert.equal(o.financial.payoutStatus, "scheduled");
  s.adminAction("admin", "withdrawal", {
    id: w.id,
    status: "pay",
    outcome: "success",
    key: "finance-payment-test",
    reference: "provider-payment-test",
    reason: "Finance sent mobile money",
  });
  assert.equal(o.financial.payoutStatus, "paid");
  assert.equal(o.payment.status, "awaiting_approval");
  const destination = `external:${w.provider}:${w.destination}`;
  assert.equal(s.state.accounts[destination], o.financial.earning);
  paid(s, o);
  assert.equal(s.state.accounts[destination], o.financial.earning);
  assert.equal(s.snapshot("driver-1").withdrawals[0].status, "paid");
});
test("reconciliation flags matched, duplicate, missing, mismatch and unexpected references", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const result = s.adminAction("admin", "reconcile", {
    rows: [
      { reference: o.payment.reference, amount: o.quote.total + 1 },
      { reference: o.payment.reference, amount: o.quote.total },
      { reference: "unknown-provider-ref", amount: 1000 },
    ],
  });
  assert.deepEqual(
    result.rows.map((r) => r.status),
    ["amount_mismatch", "duplicate", "unexpected"],
  );
  const missing = s.adminAction("admin", "reconcile", { rows: [] });
  assert.equal(missing.rows[0].status, "missing");
  const matched = s.adminAction("admin", "reconcile", {
    rows: [{ reference: o.payment.reference, amount: o.quote.total }],
  });
  assert.equal(matched.rows[0].status, "matched");
});
test("saved places, payment methods, rating, support replies and notifications persist in snapshots", () => {
  const s = new PlatformStore();
  s.mobile("customer-1", "place", { placeId: "ntinda", label: "My shop" });
  s.mobile("customer-1", "methods", {
    kind: "card",
    label: "My demo card",
    isDefault: true,
  });
  const ticket = s.mobile("customer-1", "ticket", {
    subject: "Demo help",
    message: "Please clarify loading fees",
  });
  s.adminAction("admin", "support", {
    id: ticket.id,
    reply: "Handling is itemized at each end.",
    status: "resolved",
  });
  const snapshot = s.snapshot("customer-1");
  assert.equal(snapshot.savedPlaces[0].label, "My shop");
  assert.equal(snapshot.profile.paymentMethods.at(-1).last4, "4242");
  assert.equal(snapshot.tickets[0].replies.length, 1);
  assert.equal(snapshot.notifications[0].title, "Support replied");
  s.mobile("customer-1", "notification", {});
  assert.equal(s.snapshot("customer-1").notifications[0].read, true);
  const o = delivered(s);
  s.mobile("customer-1", "rating", {
    orderId: o.id,
    rating: 4,
    review: "Helpful driver",
  });
  assert.equal(o.rating, 4);
});

test("staff document uploads preserve actor attribution and removal is restricted to Super Admin", () => {
  const s = new PlatformStore();
  const content =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD2kAAAAASUVORK5CYII=";
  const payload = {
    account: "driver-1",
    name: "Identity document",
    content,
    fileName: "demo.png",
    reason: "Evidence supplied by driver",
  };
  // Customer Care may upload driver documents (Account Management spec 3.1).
  s.adminAction("staff-5", "upload", payload);
  assert.equal(s.state.audit.at(-1).actor, "staff-5");
  const doc = s.adminAction("staff-4", "upload", payload);
  assert.equal(s.state.audit.at(-1).actor, "staff-4");
  assert.equal(s.profile("driver-1").verified, false);
  assert.throws(
    () =>
      s.adminAction("staff-2", "document", {
        account: "driver-1",
        id: doc.id,
        status: "removed",
        reason: "Remove synthetic evidence",
      }),
    code("FORBIDDEN"),
  );
  s.adminAction("staff-1", "document", {
    account: "driver-1",
    id: doc.id,
    status: "removed",
    reason: "Remove synthetic evidence",
  });
  const removed = s.profile("driver-1").documents.find((d) => d.id === doc.id);
  assert.equal(removed.status, "removed");
  assert.equal(removed.content, undefined);
});

test("wallet top-ups use real demo balances, balanced journals and idempotent pending resolution", () => {
  const s = new PlatformStore();
  const initial = s.snapshot("customer-1").adjustmentBalance;
  const b = {
    key: "topup-success-001",
    amount: 50000,
    method: "mtn",
    outcome: "success",
  };
  s.mobile("customer-1", "wallet", b);
  s.mobile("customer-1", "wallet", b);
  assert.equal(s.snapshot("customer-1").adjustmentBalance, initial + 50000);
  const entries = s.state.ledger.filter((j) => j.reference === b.key);
  assert.equal(entries.length, 1);
  assert.equal(
    entries[0].entries.reduce((sum, e) => sum + e.amount, 0),
    0,
  );
  s.mobile("customer-1", "wallet", {
    ...b,
    key: "topup-failed-002",
    outcome: "failed",
  });
  assert.equal(s.snapshot("customer-1").adjustmentBalance, initial + 50000);
  const pending = { ...b, key: "topup-pending-003", outcome: "pending" };
  s.mobile("customer-1", "wallet", pending);
  assert.equal(s.snapshot("customer-1").adjustmentBalance, initial + 50000);
  assert.throws(
    () =>
      s.mobile("customer-1", "wallet", { ...b, key: "topup-duplicate-004" }),
    code("TOPUP_PENDING"),
  );
  assert.throws(
    () => s.mobile("customer-2", "wallet", { key: pending.key, resolve: true }),
    code("NOT_FOUND"),
  );
  s.mobile("customer-1", "wallet", { key: pending.key, resolve: true });
  s.mobile("customer-1", "wallet", { key: pending.key, resolve: true });
  assert.equal(s.snapshot("customer-1").adjustmentBalance, initial + 100000);
  assert.equal(s.snapshot("customer-2").walletTopups.length, 0);
  assert.throws(() => s.mobile("driver-1", "wallet", b), code("FORBIDDEN"));
  assert.throws(
    () =>
      s.mobile("customer-1", "wallet", {
        ...b,
        key: "topup-invalid-005",
        amount: -1,
      }),
    code("AMOUNT_INVALID"),
  );
  assert.throws(
    () => s.mobile("customer-1", "wallet", { ...b, amount: 2 }),
    code("KEY_REUSED"),
  );
});

test("provider reconciliation includes wallet funding and preserves unknown top-up state", () => {
  const s = new PlatformStore();
  const t = s.mobile("customer-1", "wallet", {
    key: "reconcile-wallet-funding",
    method: "mtn",
    amount: 10000,
    outcome: "pending",
  });
  const rows = [{ reference: t.id, amount: t.amount }];
  const pending = s.adminAction("admin", "reconcile", { rows }).rows[0];
  assert.equal(pending.status, "confirmation_pending");
  assert.equal(pending.kind, "wallet_topup");
  assert.equal(pending.account, "customer-1");
  assert.equal(s.state.walletTopups[0].status, "pending");
  s.mobile("customer-1", "wallet", { key: t.id, resolve: true });
  assert.equal(
    s.adminAction("admin", "reconcile", { rows }).rows[0].status,
    "matched",
  );
});

test("driver can withdraw a partial amount, office approves and finance pays once", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const start = s.state.accounts.settlement;
  const body = {
    amount: 1000,
    method: "airtel",
    destination: "+256700123456",
    key: "partial-withdrawal-test",
  };
  const w = s.mobile("driver-1", "withdrawal", body);
  assert.equal(s.mobile("driver-1", "withdrawal", body).id, w.id);
  assert.equal(w.amount, 1000);
  assert.throws(
    () =>
      s.adminAction("admin", "withdrawal", {
        id: w.id,
        status: "pay",
        outcome: "success",
        key: "pay-before-approval",
        reference: "early-ref",
        reason: "Finance request",
      }),
    code("REQUEST_UNAVAILABLE"),
  );
  s.adminAction("admin", "withdrawal", {
    id: w.id,
    status: "approved",
    reason: "Office checked details",
  });
  assert.equal(s.state.accounts.settlement, start);
  assert.equal(o.financial.disbursed, undefined);
  assert.throws(
    () =>
      s.admin(o.id, {
        action: "payout",
        amount: o.financial.earning,
        key: "bypass-reserved-trip",
        reason: "Pay outside request",
      }),
    code("EARNINGS_RESERVED"),
  );
  const payment = {
    id: w.id,
    status: "pay",
    outcome: "success",
    key: "partial-pay-attempt",
    reference: "airtel-ref-1000",
    reason: "Finance confirmed transfer",
  };
  s.adminAction("admin", "withdrawal", payment);
  s.adminAction("admin", "withdrawal", payment);
  assert.equal(s.state.accounts.settlement, start - 1000);
  assert.equal(o.financial.disbursed, 1000);
  assert.equal(o.financial.payoutStatus, "scheduled");
  assert.equal(w.attempts.length, 1);
  assert.equal(s.state.accounts["external:airtel:+256700123456"], 1000);
  const next = s.mobile("driver-1", "withdrawal", {
    amount: o.financial.earning - 1000,
    method: "mtn",
    destination: "+256700654321",
    key: "remaining-withdrawal",
  });
  s.adminAction("admin", "withdrawal", {
    id: next.id,
    status: "approved",
    reason: "Remaining balance checked",
  });
  s.adminAction("admin", "withdrawal", {
    id: next.id,
    status: "pay",
    outcome: "success",
    key: "remaining-pay-attempt",
    reference: "mtn-ref-remainder",
    reason: "Finance confirmed remainder",
  });
  assert.equal(o.financial.payoutStatus, "paid");
  assert.equal(o.financial.disbursed, o.financial.earning);
  assert.equal(s.state.accounts.settlement, start - o.financial.earning);
  assert.throws(
    () => s.mobile("driver-1", "withdrawal", {}),
    code("NO_EARNINGS"),
  );
});

test("failed payout retries preserve funds and pending payouts require resolution", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const start = s.state.accounts.settlement;
  const w = s.mobile("driver-1", "withdrawal", {
    amount: 1000,
    method: "external_wallet",
    provider: "Example Pay",
    destination: "driver-account-1",
  });
  const step = (b) =>
    s.adminAction("admin", "withdrawal", {
      id: w.id,
      reason: "Finance result checked",
      ...b,
    });
  step({ status: "approved" });
  step({ status: "pay", key: "failed-attempt-key", outcome: "failed" });
  assert.equal(s.state.accounts.settlement, start);
  step({ status: "pay", key: "pending-attempt-key", outcome: "pending" });
  assert.equal(w.status, "processing");
  assert.throws(
    () => step({ status: "rejected" }),
    code("REQUEST_UNAVAILABLE"),
  );
  assert.throws(
    () =>
      step({
        status: "pay",
        key: "unsafe-retry-key",
        outcome: "success",
        reference: "unsafe-retry-ref",
      }),
    code("REQUEST_UNAVAILABLE"),
  );
  assert.equal(s.state.accounts.settlement, start - 1000);
  assert.equal(s.state.accounts["withdrawalClearing:" + w.id], 1000);
  step({ status: "resolve", outcome: "failed" });
  assert.equal(s.state.accounts.settlement, start);
  assert.equal(s.state.accounts["withdrawalClearing:" + w.id], 0);
  step({ status: "pay", key: "second-pending-attempt", outcome: "pending" });
  step({
    status: "resolve",
    outcome: "success",
    reference: "provider-delayed-ref",
  });
  assert.equal(w.status, "paid");
  assert.equal(w.attempts.length, 3);
  assert.equal(w.attempts[1].status, "failed");
  assert.equal(w.attempts[2].status, "paid");
  assert.equal(s.state.accounts.settlement, start - 1000);
});

test("withdrawals validate amounts and destinations and rejection releases reserved earnings", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  for (const amount of [0, -1, 0.5, o.financial.earning + 1])
    assert.throws(
      () => s.mobile("driver-1", "withdrawal", { amount }),
      code("AMOUNT_INVALID"),
    );
  assert.throws(
    () =>
      s.mobile("driver-1", "withdrawal", {
        amount: 1000,
        destination: "invalid",
      }),
    code("DESTINATION_INVALID"),
  );
  const w = s.mobile("driver-1", "withdrawal", { amount: 1000 });
  assert.throws(
    () =>
      s.adminAction("staff-3", "withdrawal", {
        id: w.id,
        status: "approved",
        reason: "Attempt without finance access",
      }),
    code("FORBIDDEN"),
  );
  s.adminAction("admin", "withdrawal", {
    id: w.id,
    status: "rejected",
    reason: "Driver requested correction",
  });
  assert.equal(
    s.mobile("driver-1", "withdrawal", { amount: o.financial.earning }).amount,
    o.financial.earning,
  );
});

test("withdrawal charges split gross, driver receipt and provider fee exactly once", () => {
  for (const feePayer of ["driver", "platform"]) {
    const s = new PlatformStore();
    const o = delivered(s);
    paid(s, o);
    const settlement = s.state.accounts.settlement;
    const platform = s.state.accounts.platform;
    const w = s.mobile("driver-1", "withdrawal", {
      amount: 10000,
      method: "airtel",
      destination: "+256700123456",
    });
    s.adminAction("admin", "withdrawal", {
      id: w.id,
      status: "approved",
      reason: "Office approved payout",
    });
    const payment = {
      id: w.id,
      status: "pay",
      outcome: "success",
      key: "fee-payment-attempt",
      reference: "fee-provider-reference",
      fee: 500,
      feePayer,
      reason: "Finance confirmed provider charge",
    };
    s.adminAction("admin", "withdrawal", payment);
    s.adminAction("admin", "withdrawal", payment);
    assert.equal(w.fee, 500);
    assert.equal(w.netAmount, feePayer === "driver" ? 9500 : 10000);
    assert.equal(o.financial.disbursed, 10000);
    assert.equal(
      s.state.accounts["external:airtel:+256700123456"],
      w.netAmount,
    );
    assert.equal(s.state.accounts["providerFees:airtel"], 500);
    assert.equal(s.state.accounts.settlement, settlement - 10000);
    assert.equal(
      s.state.accounts.platform,
      platform - (feePayer === "platform" ? 500 : 0),
    );
    assert.equal(s.snapshot("driver-1").withdrawals[0].fee, 500);
    assert.equal(w.attempts[0].fee, 500);
    for (const l of s.state.ledger)
      assert.equal(
        l.entries.reduce((sum, e) => sum + e.amount, 0),
        0,
      );
  }
});

test("pending payout reserves platform charges, locks terms, and releases funds on failure", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const settlement = s.state.accounts.settlement;
  const platform = s.state.accounts.platform;
  const w = s.mobile("driver-1", "withdrawal", { amount: 10000 });
  const step = (b) =>
    s.adminAction("admin", "withdrawal", {
      id: w.id,
      reason: "Finance checked provider result",
      ...b,
    });
  step({ status: "approved" });
  step({
    status: "pay",
    key: "pending-fee-attempt",
    outcome: "pending",
    fee: 500,
    feePayer: "platform",
  });
  assert.equal(s.state.accounts["withdrawalClearing:" + w.id], 10500);
  assert.equal(s.state.accounts.platform, platform - 500);
  assert.throws(
    () =>
      step({
        status: "resolve",
        outcome: "success",
        reference: "fee-lock-ref",
        fee: 100,
        feePayer: "platform",
      }),
    code("FEE_LOCKED"),
  );
  step({ status: "resolve", outcome: "failed" });
  assert.equal(s.state.accounts.platform, platform);
  assert.equal(s.state.accounts.settlement, settlement);
  assert.equal(s.state.accounts["withdrawalClearing:" + w.id], 0);
  assert.equal(s.state.accounts["providerFees:mtn"], undefined);
  step({
    status: "pay",
    key: "retry-fee-attempt",
    outcome: "pending",
    fee: 200,
    feePayer: "driver",
  });
  step({
    status: "resolve",
    outcome: "success",
    reference: "final-charge-ref",
  });
  assert.equal(w.netAmount, 9800);
  assert.equal(w.fee, 200);
  assert.equal(w.attempts[0].fee, 500);
  assert.equal(w.attempts[1].fee, 200);
  assert.equal(s.state.accounts["providerFees:mtn"], 200);
  assert.equal(s.state.accounts["withdrawalClearing:" + w.id], 0);
});

test("invalid payout charges and unfunded platform charges leave the withdrawal unchanged", () => {
  const s = new PlatformStore();
  const o = delivered(s);
  paid(s, o);
  const w = s.mobile("driver-1", "withdrawal", { amount: 1000 });
  s.adminAction("admin", "withdrawal", {
    id: w.id,
    status: "approved",
    reason: "Office approved payout",
  });
  for (const fee of [-1, 0.5, 1000, NaN])
    assert.throws(
      () =>
        s.adminAction("admin", "withdrawal", {
          id: w.id,
          status: "pay",
          key: "invalid-fee-attempt",
          outcome: "success",
          reference: "invalid-fee-ref",
          reason: "Validate charge before transfer",
          fee,
          feePayer: "driver",
        }),
      code("FEE_INVALID"),
    );
  s.state.accounts.platform = 0;
  assert.throws(
    () =>
      s.adminAction("admin", "withdrawal", {
        id: w.id,
        status: "pay",
        key: "unfunded-fee-attempt",
        outcome: "success",
        reference: "unfunded-fee-ref",
        reason: "Platform charge funding missing",
        fee: 500,
        feePayer: "platform",
      }),
    code("INSUFFICIENT_FUNDS"),
  );
  assert.equal(w.status, "approved");
  assert.equal(w.fee, undefined);
  assert.equal(o.financial.disbursed, undefined);
});
