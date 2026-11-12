# Cargo payments demo improvements

Completed 2 November 2026. Scope: customer and driver cargo apps and admin payment operations. This remains a test prototype with simulated GPS, payments, refunds, reconciliation and payouts.

## Implemented

- Customer booking has explicit MTN/Airtel saved-account selection and permanent Cash selection. Cards and bank/RTGS are labelled Phase 3. Incomplete cargo drafts cannot submit from the payment screen.
- Fare estimate copy identifies fixed truck-tier demo pricing rather than claiming measured GPS-distance pricing.
- Exact selected pickup/drop-off coordinates persist with trips and are registered for maps on separate clients.
- Completion requires arrival and records one payment obligation per delivery, inside a database transaction. Delivery, collection and payout statuses are separate.
- Cash completion requires driver confirmation of both receipt and delivery. It records retained cash earnings and a per-trip platform due without adding a second digital earning.
- Digital completion automatically creates a simulated pending approval request, plus a scheduled driver earning. Previous cash dues are recovered from that earning with per-trip recovery records.
- Customer payment history supports simulated approval, timeout, insufficient funds, retry and switching to a saved account with the other operator. Settled payments cannot be retried. Payment reference remains stable.
- Driver earnings show scheduled balances, fee breakdowns, per-trip due status and payout status. Customers do not see the platform fee or driver earnings; drivers do not see customer payment-account details.
- Phase 1 payout language describes an office T+N cycle, without inventing an approved cadence. The old driver withdrawal route now explains Phase 2 instead of performing an immediate withdrawal.
- Cash dues can be settled through a clearly labelled simulated Mobile Money action.
- Admin Cargo payments provides date/method/status/search filters, filtered metrics, reconciliation CSV export, manual-match marking, audit history and simulated scheduled payouts.
- Confirmed digital collections can be refunded with a required reason to the original rail/account representation. Driver balance adjustments and recovered cash dues are reversed consistently. No customer-wallet money is manufactured by a rail refund.
- Admin can reduce an unpaid digital fare before payout with a required reason. Fare, commission, driver earning and history update together; the outstanding demo request is invalidated and requires retry.
- Fee rate is configurable with DEMO_PLATFORM_FEE_RATE and stored per payment. Driver confirmation reads the backend configuration.
- Duplicate completion, approval, refund and payout actions are guarded/idempotent.
- Driver assignment now checks driver role, verification, online state, compatible truck tier and an existing active delivery. Declined requests are excluded from subsequent offers.
- Tracking updates reject backward/terminal transitions. The animation's near-destination event is sent once and the final arrival waits for it.
- Fixed undefined admin toast calls and PostgreSQL customer-statistic aliases. Added phone-frame safe spacing for stacked screens and the earnings header. Unassigned customer requests no longer show an invented assigned driver.
- Legacy wallet refunds are disabled in favor of the coherent cargo-payment flow. Negative top-up/withdrawal amounts are rejected.

## Where to review

- Customer: `/customer/request/payment`, `/customer/payments`, completed trip details or tracking receipt link.
- Driver: `/driver/trip/complete`, `/driver/earnings`, `/driver/payments`, `/driver/earnings/cash-due`.
- Admin: `/admin/payments`; existing `/admin/transactions` remains a legacy wallet ledger.

## Verification

- `npm run build`: passed. Existing large-bundle warning remains.
- `npm run lint`: passed with warnings. Most are pre-existing React refresh, effect and unused-code warnings; the new polling/identity-reset effects also trigger advisory set-state-in-effect warnings.
- `git diff --check`: passed after whitespace cleanup.
- `npm run test:payments`: passed against a temporary schema in local PostgreSQL, removed afterward. Covers cash balances/dues, exact coordinates, decline exclusions, request lifecycle and account switching, concurrent duplicate completion/approval/payout, original-rail refund, due recovery/restoration/settlement, active-trip guard, arrival gate, negative amounts, PostgreSQL statistics and reasoned fare correction.
- Chrome checks with synthetic accounts in an isolated preview: admin payment records and simulated approval updated visibly; customer receipts hid the driver split; MTN/Airtel/Cash booking options rendered; driver scheduled earnings and dues rendered. Phone-frame screenshot inspection caught an overlapping title and the safe spacing was corrected and rechecked.
- Browser checks do not constitute exhaustive device/accessibility QA. Map provider style warnings remain, and editing shared context during Vite HMR produced a transient refresh error that cleared on full navigation/reload.

## Assumptions and remaining scope

- Demo policy: verified digital delivery earnings are scheduled even when the customer has not paid. No automatic customer booking block or credit limit is imposed yet. Leadership should decide exposure limits, collections rules and funding before development.
- T+N cadence, cash-due threshold/grace restrictions, liability/claims policy and large-load deposits are still decisions, not implemented policy. Phase 2 on-demand payout is explanatory future scope.
- GPS verification remains simulated. Proof of pickup/delivery photos, recipient OTP/signature, cargo quantity/condition checks, partial delivery and non-receipt disputes need separate cargo workflows.
- Fare corrections are deliberately limited to reducing unpaid digital fares before payout. Paid fare changes use a full refund; partial refunds, cash fare adjustments, payout-batch reversals and dedicated driver adjustment notifications remain future work.
- The manual reconciliation action records an operator's demo match. It does not parse a provider settlement import or run nightly reconciliation.
- Payment timestamps currently display stored UTC. The database uses second-resolution text timestamps; production design should use explicit timezone-aware fields.
- Existing trips/ledger entries are not retroactively migrated into new payment records. Complete a new delivery to test the new lifecycle. Historical wallet features remain separate experimental screens.
- Existing simplified authentication and demo credentials remain. This patch does not claim production security, live provider integration, real document uploads, real password recovery, B2B PDF/email invoicing, or native app builds.
- Existing workspace edits were preserved. No deployment, provider onboarding, external messages or real money movement occurred.
