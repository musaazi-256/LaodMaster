Payment flow review completed on 12 November 2026.

The review passed 98 regression tests and 12 connected payment scenarios across the customer app, driver app and admin portal. Type checking, linting and the admin production build passed. The connected walkthrough recorded zero browser console errors, zero uncaught page errors and zero failed requests to the demo API. Every ledger entry balanced.

The targeted browser walkthrough creates booking and delivery fixtures through the HTTP API, then uses the customer payment screens, driver withdrawal form, office approval, finance payment form and reconciliation import screens. It uses an isolated in-memory service and fresh mobile previews. The broader UI walkthrough also passed paired-driver booking, multi-stop recipient-PIN handover, delivery, delayed payment recovery, partial refund, cash confirmation and office commission remittance.

| Scenario | Verified result |
| --- | --- |
| Insufficient mobile-money funds | A failed attempt preserves the app-wallet balance and creates no collection entry. |
| Retry and delayed confirmation | The original trip retains its attempts. Finance confirms the existing debit from a matching report and the customer receipt updates. |
| Card decline and mobile-money timeout | The customer can change methods, check an uncertain result, and complete the trip with one successful collection. |
| Insufficient app-wallet funds | The payment opens the actual wallet top-up, retains the trip context, and retries after funding. The wallet is debited once. |
| Driver withdrawal | The driver enters an amount and destination. Office approval leaves a separate payment step for finance. |
| Failed payout and pending retry | One withdrawal retains its attempts. A confirmed failure can retry. Pending transfers reserve funding and require resolution. |
| Payout charge | A UGX 10,000 withdrawal with a UGX 500 driver-paid charge produces UGX 9,500 at the destination and one fee posting. Platform-paid charges are covered by separate regression cases. |
| Provider reconciliation | Incoming collections, outgoing payouts and outgoing refunds have separate report scopes and source links. Payout matching compares net amount and charge. |
| Duplicate, unexpected and mismatched rows | Reports flag discrepancies. Missing provider rows show expected amounts and charges while their provider values remain blank. Matching pending records offer a reasoned confirmation action. Reimporting compares current records while earlier reports retain their history. |
| Cash | Driver declaration and payer confirmation record the cash and commission due. Cash stays outside external-provider reports. |
| Refund | The original payment rail receives the refund, the app wallet retains its balance, and the customer receipt shows the refund reference and reason. |
| Persistence and repeat actions | Reserved funds survive service restarts. Replayed reconciliation and payout actions produce one disbursement and one charge. Reserved clearing accounts are viewable and protected from manual transfers. |

The fixes connect reconciliation to the existing payment records and withdrawal workflow. The trip screen links to driver withdrawals, and the driver's available amount comes from the same eligibility calculation used by the service. Withdrawal form hints explain amounts and destinations. The finance form previews the charge and net receipt. The portal includes expandable payout and reconciliation guides, with keyboard-accessible help for fees, references and comparison results.

To repeat the connected walkthrough, start fresh customer and driver previews in separate terminals. The following example uses ports 8093 and 8094.

```sh
cd apps/customer
env -u CI npx expo start --web --port 8093 --clear --offline
```

```sh
cd apps/driver
env -u CI npx expo start --web --port 8094 --clear --offline
```

Run the check from the repository root.

```sh
CUSTOMER_PORT=8093 DRIVER_PORT=8094 npm run test:payments
```

The command builds the admin portal and runs `scripts/payments-check.mjs`. Its default output directory is `/tmp/loadmaster-payment-review`, including `results.json`, console and API error logs, and customer, driver and reconciliation screenshots. The default preview ports are 8091 and 8092 when environment overrides are omitted. Restart previews running in CI mode after source changes because CI mode disables file watching.

For manual reconciliation, choose the report type, provider and UTC date range, then paste CSV rows. Collections and refunds use their payment amount. Payouts use the net amount received and the provider charge.

```csv
reference,amount,fee
airtel-transfer-reference,9500,500
```

Open the linked source record when investigating an exception. Verify provider evidence and enter a reason before confirming an awaiting result. Pending records initiated before the report period remain available for comparison. Reimport the report after a correction to obtain a fresh comparison.

Live PIN prompts, SMS, provider callbacks and external disbursements remain simulated. Finance enters provider charges. The older general UI smoke was updated for the current item editor, automatic payment navigation, receipt confirmation and portal labels. Its broader booking-to-remittance journey passed.

To rerun the broader UI walkthrough against the same previews, use the following command. The screenshots go to the specified temporary directory.

```sh
CUSTOMER_PORT=8093 DRIVER_PORT=8094 node scripts/ui-smoke.mjs /tmp/loadmaster-complete-ui
```
