# Rebuild guide

## Product baseline

LoadMaster is a cargo marketplace for Uganda with customer booking, verified drivers and vehicles, dispatch, trip tracking, payment records and administrator operations. The removed implementation was a prototype: payments, payouts, GPS and OTP were simulated. Read the dated audits as evidence and validate requirements before treating them as production commitments.

## Core journeys

- Customer: sign up/sign in and recovery; select pickup and destination; choose truck and agreed price; request immediately or schedule separately; follow assignment and delivery; view trip history, receipts, payment status, profile and support. Recipient and cargo details were optional in the latest prototype.
- Driver: onboarding, document and vehicle submission, verification, availability, incoming requests, acceptance, pickup and delivery progress, completion, earnings, cash fees due, payouts, profile and support.
- Administrator: customers, drivers, verification, trips, reporting and cargo payment operations. Expanded staff identity, authorization, audit logs, live-driver oversight, withdrawal approvals, reconciliation and rewards require separate implementation; see the preserved coverage inventory.

## Rules to carry forward for review

- Historical truck categories: Small (up to 1 tonne), Small–Medium (1–3), Medium (3–7), Large (7–12), Extra Large (12+). Two candidate capacity sets existed; confirm boundaries and vehicle-registration rules before implementation.
- Larger truck categories could receive requests for smaller categories. Smaller trucks must not receive jobs beyond capacity. Drivers reviewed route, requested category and agreed fare before acceptance.
- Immediate booking followed route → truck/price → request. Scheduling was separate.
- Phase 1 payment choices were Cash, MTN and Airtel. Cards and bank payments were later-phase previews.
- The demo platform fee defaulted to 15%, captured per completed trip. Fees were rounded to a whole currency amount, and driver earning was fare minus fee. Recovery of outstanding dues was capped at the current earning. Confirm settlement timing, rounding, refunds and reconciliation against the payment strategy before rebuilding.
- Preserve separate customer collection, platform cash receivable, driver earning and payout records. Historical wallet records were not backfilled into the new payment lifecycle.
- Customer and driver Home supported hiding balances and collapsing cards, stored per account and role on the device.
- Proposed admin roles were Super Admin, Admin, Team Lead, Field Agent and Customer Care. Resolve the documented permission conflicts. Enforce permissions in the API as well as navigation; revoke affected sessions after role changes or deactivation; preserve before/after audit evidence without credentials.

## Suggested rebuild order

1. Resolve proposal conflicts, permissions, truck capacities, cargo scope, dispatch rules and payment acceptance criteria using the retained reports and Figma inventories.
2. Choose the new architecture, platform targets and supported dependency versions. The old stack was React/Vite for web, Express/PostgreSQL for the API and Expo/React Native for native; these are historical context, not constraints.
3. Design identity, authorization, customer/driver/vehicle records, quotes, bookings, dispatch, trip events, payment ledger, settlement and audit models. No executable schema or migrations are retained.
4. Build a complete booking-to-delivery path with explicit loading, empty, offline, cancellation and failure states, then add administration and settlement workflows.
5. Validate permissions and session revocation, capacity matching, concurrent acceptance, trip transitions, duplicate payment protection, fee calculation, cash dues, reconciliation, payouts and account isolation with meaningful tests.
6. Review mobile layouts and accessibility against the screenshot evidence and Figma references. Verify native builds on each selected platform before accepting the new implementation.

## Repository reset

Preserved: dated audits and screenshot evidence, Figma JSON handoff records, extracted proposal text and coverage details, historical native setup notes and its license, this guide, README and Git metadata.

Removed: web/native/API source, tests, dependency manifests and lockfiles, installed dependencies, generated iOS/Android projects and caches, build outputs, implementation assets and design-generation code, environment files and tooling/deployment configuration. No external database, hosted service or remote deployment was changed. Existing reports retain their original text and historical links to removed files.

There are no build, lint or typecheck commands in the reset repository. Establish new checks with the new implementation. Do not reuse old credentials or assume historical dependency versions and setup instructions remain suitable.
