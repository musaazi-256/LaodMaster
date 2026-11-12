import { chromium, expect } from "@playwright/test";
import { createServer } from "../services/demo/server.mjs";
import { CargoStore } from "../services/demo/cargo.mjs";
import { mkdirSync } from "node:fs";
const store = new CargoStore();
const server = createServer(store);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const service = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--no-sandbox"],
});
const errors = [];
const out = process.argv[2] || "audits/v2";
mkdirSync(out, { recursive: true });
try {
  const make = async (role, port) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 1,
    });
    await context.addInitScript(
      ({ role, service }) => {
        localStorage.setItem(
          "loadmaster-" + role,
          JSON.stringify({ account: role + "-1", url: service }),
        );
      },
      { role, service },
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(role + ": " + e.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /Unexpected text node|Text strings must|Invalid hook|Cannot update a component|Uncaught/.test(
          message.text(),
        )
      )
        errors.push(role + ": " + message.text());
    });
    await page.goto(`http://localhost:${port}`);
    await page
      .getByRole("button", { name: "Explore with a demo account", exact: true })
      .click();
    await page
      .getByText(role === "customer" ? "A truck for" : "Your next move", {
        exact: false,
      })
      .first()
      .waitFor({ timeout: 120000 });
    return { page, context };
  };
  const { page: customer, context: customerContext } = await make(
    "customer",
    Number(process.env.CUSTOMER_PORT || 8091),
  );
  const { page: driver, context: driverContext } = await make(
    "driver",
    Number(process.env.DRIVER_PORT || 8092),
  );
  await customer.screenshot({ path: out + "/customer-home.png" });
  await expect(
    customer.getByRole("button", { name: "Previous artwork", exact: true }),
  ).toBeDisabled();
  await customer
    .getByRole("button", { name: "Next artwork", exact: true })
    .click();
  await expect(
    customer.getByRole("button", {
      name: "Show artwork 2: Household moves",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    customer.getByText("Household moves", { exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await customer.screenshot({ path: out + "/home-household-slide.png" });
  await customer
    .getByRole("button", { name: "Next artwork", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Next artwork", exact: true }),
  ).toBeDisabled();
  await expect(
    customer.getByText("Business deliveries", { exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await customer.screenshot({ path: out + "/home-business-slide.png" });
  await customer
    .getByRole("button", {
      name: "Show artwork 1: Everyday cargo",
      exact: true,
    })
    .click();

  await driver.screenshot({ path: out + "/driver-home.png" });
  await driver
    .getByRole("switch", { name: "Available for new orders" })
    .click();
  await expect(
    driver.getByText("You’re online", { exact: true }),
  ).toBeVisible();
  // Home entry points retain explicit intent before returning to the standard flow.
  await customer
    .getByRole("button", { name: "Order again", exact: true })
    .click();
  await expect(
    customer.getByText("No past trips yet", { exact: true }),
  ).toBeVisible();
  await customer.getByRole("button", { name: "Back", exact: true }).click();
  await customer
    .getByRole("button", { name: "Choose a truck", exact: true })
    .click();
  await customer.getByRole("radio").last().click();
  await customer
    .getByRole("button", { name: "Continue to locations", exact: true })
    .click();
  await expect(
    customer.getByRole("button", {
      name: "Choose pickup location",
      exact: true,
    }),
  ).toBeVisible();
  await customer.getByRole("button", { name: "Back", exact: true }).click();
  await customer.getByRole("button", { name: "Back", exact: true }).click();
  await customer
    .getByRole("button", { name: "Match a driver", exact: true })
    .click();
  await customer
    .getByLabel("Driver number or ID", { exact: true })
    .fill("unknown-driver");
  await customer
    .getByRole("button", { name: "Check driver & continue", exact: true })
    .click();
  await expect(
    customer.getByText("Check the driver’s short number.", { exact: false }),
  ).toBeVisible();
  await customer
    .getByLabel("Driver number or ID", { exact: true })
    .fill("driver-1");
  await customer
    .getByRole("button", { name: "Check driver & continue", exact: true })
    .click();
  await expect(
    customer.getByRole("button", {
      name: "Choose pickup location",
      exact: true,
    }),
  ).toBeVisible();
  await customer.getByRole("button", { name: "Back", exact: true }).click();
  await customer.getByRole("button", { name: "Back", exact: true }).click();
  await customer
    .getByRole("button", { name: "Order a cargo truck", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Choose pickup location", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Select Ntinda Shopping Centre", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Choose destination", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Select Nakawa Market", exact: true })
    .click();
  await customer.screenshot({
    path: out + "/figma-order-locations-web.png",
  });
  await customer
    .getByRole("button", { name: "Continue to truck selection", exact: true })
    .click();
  await customer.getByRole("button", { name: "Add at pickup" }).click();
  await customer
    .getByRole("button", { name: "Add destination", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Cargo & contacts", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Edit cargo item 1", exact: true })
    .click();
  await customer
    .getByLabel("Item 1 description", { exact: true })
    .fill("Furniture boxes");
  await customer.getByRole("button", { name: "Done", exact: true }).click();
  await customer
    .getByRole("button", { name: "Add cargo item", exact: true })
    .click();
  await customer
    .getByLabel("Item 2 description", { exact: true })
    .fill("Office stock");
  await customer
    .getByRole("radio", { name: "Item 2 to stop 2", exact: true })
    .click();
  await customer.getByRole("button", { name: "Done", exact: true }).click();
  for (const i of [1, 2])
    await customer
      .getByRole("button", {
        name: `Use me as recipient at stop ${i}`,
        exact: true,
      })
      .click();
  await customer
    .getByRole("switch", {
      name: "Require handover PIN at stop 1",
      exact: true,
    })
    .click();
  await customer.screenshot({ path: out + "/cargo-contacts-web.png" });
  await customer
    .getByRole("button", { name: "Payment & pairing", exact: true })
    .click();
  store.adminAction("admin", "payment-method", {
    method: "mtn",
    enabled: false,
  });
  await expect(
    customer.getByRole("radio", { name: "MTN Mobile Money", exact: true }),
  ).toHaveCount(0, { timeout: 15000 });
  await customer
    .getByRole("radio", { name: "Airtel Money", exact: true })
    .click();
  await customer
    .getByLabel("Driver short number", { exact: true })
    .fill("2001");
  await customer
    .getByRole("button", { name: "Check driver number", exact: true })
    .click();
  await expect(
    customer.getByText(/Awaiting driver consent after ordering/),
  ).toBeVisible();
  await customer
    .getByRole("button", { name: "Review order", exact: true })
    .click();
  await customer
    .getByRole("switch", {
      name: "Accept cargo service acknowledgement",
      exact: true,
    })
    .click();
  await customer.screenshot({ path: out + "/cargo-review-web.png" });
  await customer
    .getByRole("button", { name: "Order a truck", exact: true })
    .click();
  await expect(
    customer.getByText("Awaiting your paired driver", { exact: true }),
  ).toBeVisible();
  store.adminAction("admin", "payment-method", {
    method: "mtn",
    enabled: true,
  });

  await customer
    .getByRole("button", { name: "Cancel order", exact: true })
    .click();
  await expect(
    customer.getByText("Are you sure?", { exact: true }),
  ).toBeVisible();
  await customer.screenshot({
    path: out + "/cancel-confirmation-sheet.png",
  });
  await customer
    .getByRole("button", { name: "Cancel order", exact: true })
    .last()
    .click();
  await expect(
    customer.getByText("What went wrong?", { exact: true }),
  ).toBeVisible();
  await expect(
    customer.getByRole("button", { name: "Confirm cancellation", exact: true }),
  ).toBeEnabled();
  await customer
    .getByRole("radio", { name: "Long pickup time", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Confirm cancellation", exact: true }),
  ).toBeEnabled();
  await customer.screenshot({ path: out + "/cancel-reasons-sheet.png" });
  await customer
    .getByRole("button", { name: "Close reasons list", exact: true })
    .click();
  await driver.getByRole("button", { name: /New cargo request/ }).click();
  await expect(
    driver.getByText("A new cargo request", { exact: true }),
  ).toBeVisible();
  await driver.screenshot({ path: out + "/driver-request.png" });
  await driver
    .getByRole("button", { name: "Accept this order", exact: true })
    .click();
  await expect(
    customer
      .getByText("Driver assigned", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible({ timeout: 12000 });
  for (const name of [
    "Head to pickup",
    "Arrived at pickup",
    "Start loading",
    "Loading complete · Start delivery",
    "Arrived at destination",
    "Start offloading",
  ]) {
    await driver.getByRole("button", { name, exact: true }).click();
  }
  const codeText = await customer.getByText(/Demo handover code:/).innerText();
  await driver
    .getByLabel("Recipient handover PIN", { exact: true })
    .fill(codeText.match(/\d{4}/)[0]);
  await driver
    .getByRole("switch", {
      name: "Cargo handed over to recipient",
      exact: true,
    })
    .click();
  await driver
    .getByRole("button", { name: "Confirm delivery complete", exact: true })
    .click();
  await driver
    .getByRole("button", { name: "Arrived at destination", exact: true })
    .click();
  await driver
    .getByRole("button", { name: "Start offloading", exact: true })
    .click();
  await driver
    .getByRole("switch", {
      name: "Cargo handed over to recipient",
      exact: true,
    })
    .click();
  await driver
    .getByRole("button", { name: "Confirm delivery complete", exact: true })
    .click();

  await expect(
    customer.getByText("Ready to approve?", { exact: true }),
  ).toBeVisible();
  await customer
    .getByRole("button", { name: "DEMO OUTCOME CONTROLS", exact: false })
    .click();
  await customer
    .getByRole("radio")
    .filter({ hasText: "Debited · confirmation delayed" })
    .click();
  await customer
    .getByRole("button", { name: "Approve demo payment", exact: true })
    .click();
  await expect(
    customer.getByText("Checking your payment", { exact: true }),
  ).toBeVisible();
  await customer.screenshot({ path: out + "/payment-uncertain.png" });
  await customer
    .getByRole("button", { name: "Check payment status", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "View receipt", exact: true })
    .click();
  await expect(
    customer
      .locator("#root")
      .getByRole("heading", { name: "Payment confirmed", exact: true }),
  ).toBeVisible();
  await customer.screenshot({ path: out + "/payment-receipt.png" });
  await customer.reload();
  await customer.getByText("Hello, Alex", { exact: false }).waitFor();
  await expect(
    customer.getByText("Recent activity", { exact: true }),
  ).toBeVisible();
  await customer
    .getByRole("button", { name: "Order again", exact: true })
    .click();
  await customer
    .getByRole("button", { name: /Repeat trip/ })
    .first()
    .click();
  await expect(
    customer.getByRole("button", {
      name: "Choose pickup location",
      exact: true,
    }),
  ).toContainText("Ntinda");
  await customer
    .getByRole("button", { name: "Choose destination", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Select Acacia Mall", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Continue to truck selection", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Acacia Mall", exact: true }),
  ).toBeVisible();

  await customer.screenshot({ path: out + "/repeat-trip-review.png" });
  await customer.reload();
  const admin = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  admin.on("pageerror", (e) => errors.push("admin: " + e.message));
  await admin.goto(service + "/operations");
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    admin.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await admin.getByRole("link", { name: "Collections", exact: true }).click();
  await admin
    .getByRole("button", { name: /Open LM-/ })
    .first()
    .click();
  await admin.getByRole("tab", { name: "Payments & actions" }).click();
  await admin
    .getByRole("button", { name: "Issue refund", exact: true })
    .click();
  const refund = admin.getByRole("dialog", {
    name: "Refund customer",
    exact: true,
  });
  await refund.getByLabel("Amount (UGX)").fill("12000");
  await refund
    .getByLabel("Reason (required)")
    .fill("Loading help not provided");
  await refund
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(
    admin.getByText("Loading help not provided", { exact: true }),
  ).toBeVisible();
  await expect(refund).not.toBeVisible();
  if (await admin.getByRole("dialog").count())
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click();
  await admin.getByRole("link", { name: "Dashboard", exact: true }).click();
  await admin.screenshot({ path: out + "/admin-operations.png" });
  for (const [label, heading] of [
    ["Drivers", "Drivers"],
    ["Transfers & ledger", "Transfers & ledger"],
    ["Support", "Support"],
    ["Staff & roles", "Staff & roles"],
    ["Reports", "Reports"],
  ]) {
    await admin.getByRole("link", { name: label, exact: true }).click();
    await expect(
      admin.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await admin.screenshot({ path: out + "/admin-reports.png" });
  for (const label of [
    "Trips",
    "Customers",
    "Collections",
    "Driver payouts",
    "Reconciliation",
    "Payment methods",
    "Referrals & cashbacks",
    "Audit trail",
    "Settings",
  ]) {
    await admin.getByRole("link", { name: label, exact: true }).click();
    await expect(admin.locator("main h1")).toBeVisible();
    await expect(
      admin.getByText("Something went wrong", { exact: true }),
    ).not.toBeVisible();
  }

  // Exercise cash confirmation and remittance against the same connected UI.
  const cashQuote = store.quote("customer-1", {
    pickupId: "ntinda",
    truckId: "small",
    loading: 0,
    stops: [{ id: "cash-stop", placeId: "nakawa", helpers: 0 }],
  });
  const cashOrder = store.create(
    "customer-1",
    {
      quoteId: cashQuote.id,
      method: "cash",
      cargoPlan: {
        sender: { name: "Demo Sender", phone: "+256700000001" },
        items: [
          {
            description: "Cash demonstration cargo",
            quantity: 1,
            weightKg: 1,
            stopId: "cash-stop",
          },
        ],
        stops: [
          {
            id: "cash-stop",
            recipient: { name: "Demo Recipient", phone: "+256700000002" },
          },
        ],
        payer: "customer",
        termsAccepted: true,
      },
    },
    "cash-ui-order-reference",
  );
  store.accept("driver-1", cashOrder.id);
  for (const stage of [
    "to_pickup",
    "at_pickup",
    "loading",
    "in_transit",
    "at_destination",
    "offloading",
    "delivered",
  ])
    store.advance("driver-1", cashOrder.id, { stage, confirmed: true });
  store.cargoAction("driver-1", cashOrder.id, {
    action: "cash-received",
    amount: cashQuote.total,
  });
  await customer.reload();
  await customer
    .getByRole("button", { name: "View order " + cashOrder.id, exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
  await customer
    .getByRole("switch", {
      name: "I handed the agreed cash amount to the driver",
      exact: true,
    })
    .click();
  await customer
    .getByRole("button", { name: "Confirm cash payment", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "View receipt", exact: true })
    .click();
  await expect(
    customer
      .locator("#root")
      .getByRole("heading", { name: "Payment confirmed", exact: true }),
  ).toBeVisible();
  await customer.screenshot({ path: out + "/cash-receipt-web.png" });
  await admin.getByRole("link", { name: "Collections", exact: true }).click();
  await admin
    .getByRole("button", { name: "Open " + cashOrder.id, exact: true })
    .click();
  await expect(
    admin.getByText("Cash reconciliation", { exact: true }),
  ).toBeVisible();
  await admin
    .getByRole("button", {
      name: "Record platform fee remittance",
      exact: true,
    })
    .click();
  const remittance = admin.getByRole("dialog", {
    name: "Record cash fee remittance",
    exact: true,
  });
  await remittance
    .getByLabel("Reason (required)")
    .fill("Verified demo cash deposit reference CASH-001");
  await remittance
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(remittance).not.toBeVisible();
  await expect(
    admin.getByRole("button", {
      name: "Record platform fee remittance",
      exact: true,
    }),
  ).not.toBeVisible();
  await admin.screenshot({ path: out + "/cash-admin-reconciliation.png" });
  if (store.state.accounts["driverCash:driver-1"] !== 0)
    throw new Error(
      "Cash remittance must settle the driver-held platform amount",
    );
  console.log(
    "Connected UI walkthrough passed: paired two-stop cargo → recipient PIN → delivery → delayed payment recovery → partial refund → cash confirmation → admin remittance.",
  );
  await customerContext.close();
  await driverContext.close();
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
