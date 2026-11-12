import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../services/demo/server.mjs";
import { Store } from "../services/demo/model.mjs";
test("HTTP: two apps share an order, competing acceptance has one winner, and payment/receipt sync across roles", async () => {
  const server = createServer(new Store());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, actor, body, key) => {
    const r = await fetch(url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer demo-${actor}`,
        "Content-Type": "application/json",
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  };
  try {
    assert.equal((await fetch(url + "/snapshot")).status, 401);
    const q = (
      await call("/quotes", "customer-1", {
        pickupId: "ntinda",
        destinationId: "nakawa",
        truckId: "small",
        loading: 1,
        offloading: 1,
      })
    ).data;
    const o = (
      await call(
        "/orders",
        "customer-1",
        { quoteId: q.id, method: "card" },
        "http-order-reference",
      )
    ).data;
    assert.equal(o.quote.total, q.total);
    assert.equal(
      (
        await call(
          "/orders",
          "customer-1",
          { quoteId: q.id, method: "card" },
          "http-order-reference",
        )
      ).data.id,
      o.id,
    );
    await Promise.all(
      ["driver-1", "driver-2"].map((id) =>
        call("/availability", id, { online: true }),
      ),
    );
    for (const id of ["driver-1", "driver-2"])
      assert.equal((await call("/snapshot", id)).data.offers[0].id, o.id);
    const results = await Promise.all(
      ["driver-1", "driver-2"].map((id) =>
        call(`/orders/${o.id}/accept`, id, {}),
      ),
    );
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    const driver = (await call("/snapshot", "customer-1")).data.orders[0]
      .driverId;
    for (const stage of [
      "to_pickup",
      "at_pickup",
      "loading",
      "in_transit",
      "at_destination",
      "offloading",
      "delivered",
    ])
      assert.equal(
        (
          await call(`/orders/${o.id}/advance`, driver, {
            stage,
            confirmed: true,
          })
        ).status,
        200,
      );
    assert.equal(
      (
        await call(`/orders/${o.id}/payment`, driver, {
          action: "approve",
          scenario: "success",
        })
      ).status,
      403,
    );
    await call(`/orders/${o.id}/payment`, "customer-1", {
      action: "approve",
      scenario: "delayed",
    });
    assert.equal(
      (await call("/snapshot", driver)).data.orders[0].payment.status,
      "unknown",
    );
    const resolved = await call(`/orders/${o.id}/payment`, "customer-1", {
      action: "resolve",
    });
    assert.equal(resolved.data.payment.status, "paid");
    const shared = (await call("/snapshot", driver)).data.orders[0];
    assert.equal(shared.payment.reference, resolved.data.payment.reference);
    assert.equal(shared.financial.payoutStatus, "scheduled");
    const forbidden = await call(`/orders/${o.id}/admin`, "customer-1", {
      action: "refund",
      amount: 1000,
      reason: "No handling supplied",
      key: "refund-http-reference",
    });
    assert.equal(forbidden.status, 404);
    const refund = await call(`/orders/${o.id}/admin`, "admin", {
      action: "refund",
      amount: 1000,
      reason: "No handling supplied",
      key: "refund-http-reference",
    });
    assert.equal(refund.data.financial.refunded, 1000);
    const admin = await call("/admin", "admin");
    assert.equal(admin.data.orders.length, 1);
    assert.ok(admin.data.audit.length > 5);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
