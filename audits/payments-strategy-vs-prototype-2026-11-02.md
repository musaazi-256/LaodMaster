# Payments strategy compared with the LoadMaster prototypes

Reviewed: 2 November 2026
Source: “LoadMaster Digital Payments Strategy - Final 2026 (1) (1).pptx”, 33 slides, prepared August 2026.

## Purpose and conclusion

This comparison treats the application as a demo for testing and developer handoff. Real payment APIs, live GPS, SMS, payout rails and production security are not prerequisites for demonstrating the strategy. Simulated outcomes should nevertheless follow the intended business rules and be visibly distinguishable during testing.

The current prototypes supply useful navigation and screen foundations, but they do not yet demonstrate the strategy's payment lifecycle. In particular, completing any trip immediately credits a driver wallet and records a successful customer transaction. That bypasses the proposed distinction between digital payment collection, cash held by a driver, commission dues and scheduled settlement.

The deck was inspected by extracting slide text, including text in its proposed screen mockups. This was not a visual-layout comparison or a live browser/device walkthrough. Application comparisons use the current workspace source. Provider prices, commercial claims, benchmarks and legal assertions in the deck were not independently verified and are not relied on as current facts here. Instructions within the presentation are treated as proposed requirements to assess, not authorization to change the app or contact providers.

## What already provides a foundation

- Customer booking progresses through locations, cargo, truck, fare and payment selection.
- Customers can save MTN/Airtel-labelled mobile-money methods and inspect transaction history/details.
- Driver earnings, transaction history, cash-due and withdrawal screens already exist.
- The backend uses a single Express application and PostgreSQL, consistent with the proposed monolith on slide 9.
- Trip completion computes the driver's share at 85%, matching the deck's stated 15% platform fee. The rate is hardcoded rather than configurable and the full split is not presented on the completion screen.
- Admin transactions, status filtering, customer/driver management, trip details and a refund modal already exist.

These are foundations, not claims that the proposed screens or business rules are complete.

## Customer prototype comparison

| Strategy requirement | Slides | Current prototype | Change needed for testing |
| --- | --- | --- | --- |
| Choose MTN or Airtel by default, with Cash always available | 10, 12 A | PaymentMethodScreen lists saved methods. No explicit Cash option when saved methods exist. A null selection is silently treated as cash by completion logic. No default is automatically selected. | Always show explicit MTN/Airtel/Cash choices. Preselect a valid mobile-money account when available. Make cash selection visible and intentional. Define first-use behavior when no mobile account exists. |
| Cards shown as Coming Soon; bank/RTGS deferred | 10, 12, 30 | AddPaymentMethod offers active-looking card and bank forms. | Mark cards unavailable for Phase 1 and label bank/RTGS Phase 3. Allow future-phase previews only through a clearly selected demo scenario. |
| Estimated fare at booking, final fare from GPS distance at delivery | 12 A | Fare depends on truck tier. Fare breakdown invents a 70/30 base/distance allocation. Exact trip coordinates are not persisted. | Show estimated/final labels and a simulated verified-distance result. Preserve coordinates and use a declared demo fare formula. Get the formula and rounding rules agreed. |
| Automatic Request-to-Pay at verified completion | 7, 11 | Completion records success immediately. There is no customer approval/pending collection state. | Simulate request sent, approve on phone, payment pending, confirmed and timeout states. Do not ask for the customer's PIN inside LoadMaster. |
| Amount Due only after the automatic attempt times out | 12 B | No linked amount-due trip screen. | Add a trip-linked amount-due view after the configured demo timeout, preserving fare/operator/reference. |
| Retry or change operator without duplicate collection | 14 F | PaymentFailureRetry is a timer and success toast, with no trip/payment attempt binding. | Provide selectable timeout, insufficient balance and delayed-success scenarios. Retry the same obligation with separately identifiable attempts. |
| Cash completion shows Pay Driver in Cash, then Got It | 16 J | Shared tracking/completion experience has no dedicated method-specific cash completion screen. | Add Screen J with fare, route and driver. Do not display digital collection success or a Pay Now button. |
| Digital receipt with reference, timestamp and method | 14 E | TransactionDetail shows amount/status/reference. Its Date & method row uses subtitle, which for trips is a payment label, not a timestamp. | Add a clear receipt linked to the trip, payment reference, actual demo timestamp and operator. Keep platform fee/driver share off the customer receipt. |
| Corporate PDF invoice and email | 11, 14, 31 | No corporate account/invoice journey found. | Label as future scope until approved. A sample invoice and simulated email state can demonstrate it without sending email. |
| Customer balance top-up/withdrawal | Not specified as a central strategy journey | WalletHome, DepositScreen and customer withdrawal already exist. | Decide whether stored-value customer wallets belong in this product. Keep as an explicitly separate experimental flow or remove from the core strategy walkthrough. Do not assume mobile money requires pre-funding a LoadMaster wallet. |

Primary files: `src/screens/customer/PaymentMethodScreen.jsx`, `AddPaymentMethod.jsx`, `FareConfirm.jsx`, `TrackingScreen.jsx`, `PaymentFailureRetry.jsx`, `TransactionDetail.jsx`, `src/state/AppStateContext.jsx`, `server/routes/trips.js`.

## Driver prototype comparison

| Strategy requirement | Slides | Current prototype | Change needed for testing |
| --- | --- | --- | --- |
| Fare, Platform Fee (15%), Your Earning breakdown | 13 C, 17 | TripCompleteRating displays only the 85% earning and a customer rating. | Add full fare/split summary. Keep customer operator charges separate. |
| Payment request targets the customer's locked number | 13 C | No payment-request review view or account-locked target number is shown. | Add the review/request state once automatic-versus-manual initiation is resolved. Mask the account number and prevent driver editing. |
| Digital payment receipt credits a running earning balance | 13 D | Every completion credits the wallet regardless of method or collection state. | Distinguish trip-earned entitlement, collection status, deductions and amount available for payout. Reflect the agreed policy for unpaid verified trips. |
| Cash held by driver, fee becomes a due | 16 I | Cash trips also credit the driver's digital wallet; cash_due is never increased by completion. | For a UGX 20,000 cash trip show UGX 20,000 collected, UGX 17,000 retained and UGX 3,000 due. Avoid adding another UGX 17,000 to withdrawable funds. |
| Dues recovered from next digital earning, manual MoMo or bulk cycle | 15 H, 16 | CashDueTracker shows a balance but Clear cash due has no action. No netting flow exists. | Demonstrate due creation, settlement method, recovered amount, remaining due and resulting payout balance. |
| Pause cash trips at threshold, all trips after grace period | 16, 31 | No method-specific eligibility or due enforcement. | Show warning, cash-paused/digital-open and all-new-trips-paused scenarios. Threshold/grace values must be labelled provisional. |
| Phase 1 T+N payouts | 17, 18, 30 | Withdraw funds appears as an active normal action; backend records withdrawal success immediately. | Show pending scheduled earnings, next payout date/cycle and paid payout history. Explain T+N in user-friendly copy once cadence is selected. |
| Phase 2 on-demand MoMo versus free office-sent request | 15 G | Withdrawal offers MTN or Bank, without phase label, fee choice, scheduled option or locked payout number. Payout method screen does not persist changes. | Build an optional Phase 2 preview with two choices, a locked registered account and explicit fee/net receipt. |
| History banner and Fee Paid/Fee Pending per trip, expandable detail | 15 H | Simple transaction rows and separate cash-due screen. | Add due banner, trip-level fee status and expandable reference/time/payment details. Keep earnings, collection and payout states distinct. |

Primary files: `src/screens/driver/TripCompleteRating.jsx`, `EarningsSummary.jsx`, `CashDueTracker.jsx`, `WithdrawalRequest.jsx`, `DriverPaymentMethod.jsx`, `DriverTransactionHistory.jsx`, `server/routes/trips.js`, `server/routes/transactions.js`.

## Admin prototype comparison

| Strategy requirement | Slides | Current prototype | Change needed for testing |
| --- | --- | --- | --- |
| Payments table linked to trip, customer and driver | 21, 22 | TransactionsList shows ID, description, subtitle, amount and status. Rows are user ledger entries, not one payment per trip. | Create a payment-level view with linked trip/customer/driver, fare, platform fee, method, collection status, fee due and payout status. Avoid double-counting customer debit and driver credit as separate customer payments. |
| Today volume, success rate, pending payouts; date/operator filters | 22 | Status/search exist. Required payment metrics, date/operator filters and pending-payout totals do not. | Seed coherent demo records across cash, MTN and Airtel and make metrics/filter results reconcile. |
| Phase 1 manual comparison with provider settlement report | 21 | No reconciliation view, export/match flow or gateway reference. | Add sample settlement import/preview or export and a matched/unmatched status. A local fixture is enough to test the workflow. |
| Refund goes back to original operator/account | 23 | Refund credits a LoadMaster wallet and can operate on credit entries. | Simulate refund to the original rail/account, linked to the original payment. Show refund pending/success/failure and prevent inappropriate refund actions. |
| Reason required, fee reversal and driver future-payout adjustment | 19, 23 | Modal has a fixed reason string, no reason input or driver earning correction. | Add required reason, fare/fee/earning impact preview, next-payout adjustment and audit history. |
| Correct fare/fee/balance with a reason and notify driver | 20, 23 | AdminTripDetail is read-only. Customer top-up is a separate balance edit without a required reason. | Add an adjustment scenario with before/after amounts, calculated split, author/time/reason and simulated notification. |
| Arrears, disputed delivery, payout hold/reversal and deferred recovery | 19, 20 | No case queue or linked financial exception workflow. | Create exception detail with trip evidence, collection status, driver entitlement, hold/recovery and resolution history. |
| Automated reconciliation and exception monitoring later | 21, 30 | Absent. | Mark future phase explicitly. Demonstrate a nightly reconciliation result only in a later-phase scenario. |
| Configurable 15% rate | 17 | 0.85 is hardcoded in completion and display logic. | Add a configuration fixture/control and retain the applied rate with each demo trip. |

Primary files: `src/screens/admin/TransactionsList.jsx`, `AdminTripDetail.jsx`, `AccessSettings.jsx`, `server/routes/admin.js`, `server/routes/transactions.js`, `server/db.js`.

## Strategy questions to settle before treating the deck as a build specification

These are conflicts or undefined decisions in the document, not implementation requirements silently selected by this comparison.

1. **Automatic collection versus Request Payment.** Slide 7 mandates an immediate automatic request at completion; slide 13 C asks the driver to review and press Request Payment, while slide 18 also describes driver/self initiation. Recommended prototype interpretation: completion sends the first request automatically; any driver button is a status/retry action, disabled while an attempt is pending. Confirm this with the owner.
2. **Trip completion versus payment hold.** Slide 14 F says the trip stays on hold and nothing proceeds unpaid. Slide 19 says trips still complete during outages and drivers keep working, while unpaid customers are restricted. Recommended interpretation: delivery can be completed while collection remains pending/failed; restrictions apply to subsequent customer bookings according to approved policy. Keep trip, payment and payout statuses separate.
3. **Driver loss protection versus earning correction.** Slide 19 labels erroneous charges “driver not clawed back” but immediately says earning is corrected against the next payout; slide 23 also adjusts the next payout. Define which errors are absorbed by LoadMaster and which create driver deductions. Customer non-payment and verified non-delivery must not be conflated.
4. **Cash earnings versus T+N guarantee.** Slide 11 says drivers are paid T+N whether cash or momo; slide 16 correctly says the cash earning is already kept. The demo should show cash-held earnings without a second payout, subject to confirmation of intended wording.
5. **When unpaid-trip earnings become available.** Slides 13/17 credit balance when payment lands; slides 11/19 guarantee normal-cycle earnings even if mobile-money collection fails. Define a receivable/guaranteed entitlement so finance and the driver see how it enters the payout run.
6. **Reconciliation phase.** Slide 21 places automated reconciliation in Phase 2+, slide 30 puts it in Phase 3, and slide 24 describes automatic matching broadly. Phase 1 is clearly manual in slide 21. Assign the target automation to one phase.
7. **Phase 2 payout provider.** Slides 8/15 require aggregator disbursements while slides 10/30 replace the aggregator with direct telco integration. Decide whether the aggregator remains for payouts, or direct disbursement replaces it as well.
8. **GPS and final fare assumptions.** The deck says live distance already feeds pricing. This workspace currently uses simulated map progress, tier-fixed fares and static API distance/ETA values. A demo can simulate GPS verification, but this is new developer work rather than simply connecting an existing authoritative GPS fare service.
9. **Cash non-payment.** Slide 19 assumes cash cannot fail because the driver already holds it; slide 16 requires a cash confirmation. Include a test case where the passenger/customer has not handed over cash, and define whether confirmation means actual receipt or only delivery completion.
10. **Business decisions still open.** T+N cadence, due threshold/grace period, exception/loss rules, provider selection, payout fees and B2B invoice scope require approval under slide 31. Use editable labelled demo assumptions rather than presenting chosen numbers as policy.

Provider economics and regulatory claims should be verified separately before implementation procurement. The deck does not specify who absorbs merchant gateway collection/disbursement fees in the 85/15 economics; showing an operator fee disclosure alone does not define this.

## Recommended prototype work order

### First: one complete Phase 1 walkthrough

1. Explicit payment selection: MTN, Airtel and Cash; cards marked Coming Soon.
2. Completion with simulated delivery verification and final fare.
3. Digital request sent, customer approval pending, success receipt or amount due/retry.
4. Driver fare/fee/earning summary and scheduled payout balance.
5. Separate cash completion, driver-held cash and commission due.
6. Admin payment record shared by all three experiences, with collection, due and payout status.

### Next: exceptions and operational testing

- Cash due recovery, warnings and method-specific restrictions.
- Failed, delayed and uncertain payment outcomes, including delayed confirmation after a retry.
- Driver entitlement when the customer remains unpaid.
- Refund to original method and a reasoned fare/earning adjustment with visible history.
- Manual settlement reconciliation and scheduled payout processing.

### Later-phase previews

- Phase 2 self-withdrawal with fee versus office-sent scheduled payment.
- Direct integration differences should be represented as developer notes unless they change the user's journey.
- Cards, bank/RTGS proof of payment and corporate invoicing under approved scope.
- Automated reconciliation once its phase is agreed.

## Minimum reusable demo scenarios

Use a demo scenario selector or resettable fixtures. No real money or provider integration is necessary.

| Scenario | Expected customer view | Expected driver view | Expected admin record |
| --- | --- | --- | --- |
| MTN success, UGX 20,000 | Approval pending, then receipt for 20,000 | Fare 20,000, fee 3,000, earning 17,000, next payout | One successful collection linked to fee and earning entries |
| Airtel timeout | Amount due, retry/change operator | Completed delivery, distinct collection and entitlement states | Pending/failed attempt, one outstanding payment obligation |
| Provider debits but callback is delayed | Checking payment status, no false final failure | Collection being confirmed | Pending reconciliation, then same payment confirmed once |
| Cash, UGX 20,000 | Pay driver 20,000, Got It | Cash collected 20,000, retained earning 17,000, fee due 3,000 | Cash collection confirmation and 3,000 platform receivable |
| Next digital trip recovers a 3,000 due | Normal 20,000 receipt | Gross earning 17,000, due recovered 3,000, net payout increment 14,000 | Recovery links old due to new earning without altering customer fare |
| Repeated payment response or double-tap | One payment/receipt | One earning | One collection and one split, with attempts/events traceable |
| Refund approved | Refund to original MTN/Airtel account and reference | Future payout adjustment according to approved policy | Reason, original payment, fee reversal and linked earning adjustment |
| Cash-only restriction | Booking availability follows approved customer rules | Cash requests paused; digital stays available until further policy stage | Due amount, threshold, grace deadline and restriction reason |
| Phase 1 payout run | No change to settled receipt | Scheduled, processing, then paid | Batch reference, included earnings, recoveries, holds and payout outcome |

The 3,000 recovery example assumes a fully recoverable due and no competing holds/fees. That is a test fixture, not an approved allocation policy.

## Suggested developer handoff model

Keep these concepts separate even when simulated:

- Trip: delivery state, location evidence, estimated and final fare.
- Payment obligation: trip/customer, amount due, selected rail/account and collection status.
- Payment attempt: request reference, pending/success/failure, provider reference and timestamps.
- Driver earning: gross share, guarantee/eligibility status and payout availability.
- Cash due: original trip, amount owed, recoveries, remaining balance and restriction state.
- Adjustment/refund: original record, before/after values, reason, actor and event history.
- Payout: cycle/batch, included earnings, net deductions, recipient and status.

A unique trip reference helps link records but does not by itself prevent duplicate charges. The demo should preserve one payment obligation across retries and show how repeated events produce one financial result. Developers will need to implement the matching/idempotency behavior behind that representation.

No application or presentation edits were made during this comparison.
