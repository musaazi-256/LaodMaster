# LoadMaster customer, driver and admin audit

Date: 2 November 2026 (Africa/Kampala)

## Verdict and scope

**Not ready for production.** The workspace implements a React web prototype with customer and driver phone views, an Express API, PostgreSQL storage and an admin portal. No native mobile project, app-store packaging, push service or automated test suite was found. Simulated functionality is described in backend comments, but several screens present it as completed real work.

Reviewed the route trees, shared session and polling state, every backend route group, schema and serialization, deployment configuration, and the principal customer booking/payment/tracking, driver onboarding/dispatch/delivery/earnings, and admin management/refund flows. Existing uncommitted application changes were included as found and left untouched.

This is a source and build audit with isolated route-handler probes, **not a completed live end-to-end acceptance test or penetration test**. No production data was queried or changed. No live payment, SMS, GPS, document storage, database concurrency, browser rendering, accessibility or physical-device test was completed. A loopback HTTP server attempt failed with sandbox `listen EPERM`; the probes below subsequently invoked actual route handlers directly with a stub database. These establish handler behavior, not live PostgreSQL execution.

## Verification

- `npm run build`: passed; main JavaScript 2,094.10 kB / 573.06 kB gzip, CSS 146.36 kB / 22.09 kB gzip. Build emits a chunk-size warning. Two truck PNG assets are approximately 1.75 and 1.80 MB.
- `npm run lint`: exited successfully with warnings, including a missing simulation effect dependency and many unused variables. Passing lint does not establish runtime correctness.
- No test script in package.json and no application test/spec files found.
- Isolated probes, with no authenticated user: admin customer listing returned 200; withdrawal of -50 returned 201 and issued `wallet_balance = wallet_balance - (-50)`; refund of a successful credit generated another credit and balance increment; driver verification returned 200 and issued an approval update.
- Dependencies were not checked against a current vulnerability registry; no dependency security clearance is implied.

## Findings

Severity: Critical = direct identity/privilege or monetary integrity failure; High = core flow or financial correctness failure; Medium = substantial usability, operational or reporting defect. Source locations refer to the workspace at audit time.

### F01 — Critical: caller-controlled identity and absent ownership checks

Evidence: `server/index.js:16`, `src/lib/api.js:9`, and all resource routers. The only identity mechanism trusts `x-user-id`; most operations do not even require that header. User IDs in URL/query/body choose whose profiles, trips, balances and payment details are accessed or modified. An attacker can enumerate drivers via GET /api/drivers, inspect admin customer lists, and use those IDs to act on accounts. `/auth/account` accepts the forged header as identity.

Fix: introduce server-validated sessions; derive the actor from the session; enforce ownership and role on every operation. Verify anonymous, customer-A/customer-B and driver-A/driver-B access explicitly.

### F02 — Critical: admin portal and privileged APIs are public

Evidence: `src/routes/routeGroups.jsx:189`, `server/routes/admin.js:8`, `server/routes/drivers.js:53`, `server/routes/transactions.js:53`. The admin route tree has no RequireAuth wrapper; there is no admin role in the schema. Admin data, account creation/top-ups, driver approval and refunds have no authorization checks. An unauthenticated admin listing and driver approval were confirmed with stubbed route probes.

Fix: implement admin identity, permissions and privileged-action auditing across backend and UI. Gate refunds and verification at the API, including routes outside /admin.

### F03 — Critical: production code includes passwordless demo login and wallet reseeding

Evidence: `server/routes/auth.js:32–55`. A phone ending in 712345001 or 712345002 and an omitted/empty password enters demo branches. They are not environment-gated and do not enforce the selected role against the returned account. Customer login upserts wallet_balance to 500,000 each time; subsequent logins can restore spent funds. Driver login overwrites verification/online metadata.

Fix: remove these branches from deployed auth; seed isolated demo environments separately and never reset financial state during login.

### F04 — Critical: negative withdrawals increase wallet balances

Evidence: `server/routes/transactions.js:36–47`. A truthiness check accepts negative amounts; a balance of 100 passes the check for -50, and subtracting -50 credits the wallet. Top-up also accepts negatives; monetary endpoints lack strict positive safe-integer constraints. The negative withdrawal behavior was confirmed through the actual handler with a stub database.

Fix: validate amount types and positive integer bounds in the API and schema; reject negatives, fractions, strings and excessive values before writing.

### F05 — Critical: refunds can create money from credit transactions

Evidence: `server/routes/transactions.js:53–64`, `src/screens/admin/TransactionsList.jsx:85`. Any non-refunded transaction can be refunded, including top-ups, driver earnings and previous refund credits. Every refund adds its amount to the wallet. The admin UI offers refunds for all non-refunded statuses. Refunding a credit was confirmed with the isolated handler probe.

Fix: define refundable debit types and settled states, verify funding source, prohibit refund-of-refund, and enforce a unique reversal reference and refund amount limit.

### F06 — Critical: balance and settlement operations are not atomic

Evidence: `server/routes/trips.js:96–127`, `server/routes/transactions.js:22–64`, `server/routes/admin.js:195`, `server/db.js:97`. Related statements execute independently through pool.query; no transaction API, row locking or idempotency constraint is present. Concurrent completions can both read a non-completed trip and credit it twice. Concurrent withdrawals can both pass the balance check. Failures can leave ledger rows and balances inconsistent. Completion marks the trip completed before credits/debits; a retry then exits early and cannot repair partial settlement.

Fix: use a single database transaction/client, guarded state updates, balance predicates or row locks, and unique settlement/idempotency keys. Test parallel requests and failure injection against PostgreSQL.

### F07 — High: client controls the trip price and payment reference

Evidence: `server/routes/trips.js:15–24`, `src/state/AppStateContext.jsx:182`. Fare is accepted directly from the body with only a truthiness check, including a negative value. The backend does not calculate a trusted quote, validate tier/cargo or check that the payment method belongs to the customer. An arbitrary customer's payment method can determine settlement behavior.

Fix: issue authoritative quotes bound to customer, route, tier and expiry; validate and bind payment ownership server-side.

### F08 — High: cash trips credit withdrawable earnings without commission debt

Evidence: `server/routes/trips.js:108–125`, `src/screens/driver/CashDueTracker.jsx:22`. All completions add 85% of fare to the driver's wallet, including cash trips where the driver has already received cash. No completion path increments cash_due. This can pay the driver twice and leaves the stated cash commission debt uncollected. Clear cash due has no handler.

Fix: distinguish cash settlement from platform-funded earnings, record commission receivables, and implement reconciliation and debt payment before enabling payouts.

### F09 — High: payments and payouts report success without provider confirmation

Evidence: `server/routes/transactions.js:22–49`, `server/routes/trips.js:119–126`, `src/screens/customer/PaymentFailureRetry.jsx:15`, `src/screens/customer/AddPaymentMethod.jsx:55`. Top-ups/withdrawals immediately persist success with no gateway. Card/bank entries store display metadata rather than a chargeable token. Trip completion treats a selected external method as paid without any provider interaction. Retry payment only runs a timer and success toast. This is intentional prototype simulation in comments, but not a functioning payment flow.

Fix: integrate payment/payout initiation, verified callbacks, pending/failed states, reconciliation and safe retries. Clearly identify simulation until implemented.

### F10 — High: wallet payment is unreachable through normal UI and has no funds protection

Evidence: `src/screens/customer/AddPaymentMethod.jsx:14`, `src/screens/customer/PaymentMethodScreen.jsx:35`, `server/routes/trips.js:119–121`. The UI can add momo/card/bank methods; no wallet selection is provided, while the server only deducts balance for a method of type wallet. If such a method is created directly, completion has no funds check or reservation and can drive the balance negative.

Fix: expose a deliberate wallet payment option, reserve/check funds atomically and handle insufficient balance before dispatch.

### F11 — High: driver eligibility and assignment constraints are missing

Evidence: `server/routes/trips.js:29–31,69–78`, `server/routes/drivers.js:63`, `src/state/AppStateContext.jsx:290`. Next request is the global oldest unassigned trip, regardless of tier, proximity or driver eligibility. Accept only requires an existing referenced ID: no driver role, approved documents, online status, compatible truck or existing active-trip check. One driver can accept several different trips; a customer ID can be assigned as a driver because the FK only references users. The conditional trip update does correctly prevent two drivers winning the same requested trip.

Fix: validate all eligibility rules server-side and enforce one active assignment per driver with concurrency-safe constraints.

### F12 — High: declining one request prevents seeing later queued work

Evidence: `server/routes/trips.js:29`, `src/state/AppStateContext.jsx:291–298,327`. The API always returns the oldest request. Decline only hides its ID locally, so polling keeps returning the hidden request and never offers later requests until someone takes/cancels it. Only one dismissed ID is remembered.

Fix: persist offers/declines per driver and exclude rejected/expired/ineligible requests from dispatch.

### F13 — High: trip state transitions permit invalid and contradictory states

Evidence: `server/routes/trips.js:82–104`, `src/state/AppStateContext.jsx:437`. Tracking accepts any nonempty string; cancellation can overwrite completed trips; completion also accepts cancelled assigned trips. Tracking can become completed while status remains accepted and no settlement runs. There are no transition, arrival or actor checks.

Fix: centralize a role-aware state machine; make terminal states immutable and use one authoritative completion/settlement event.

### F14 — High: selected coordinates are discarded across devices and refresh

Evidence: `src/screens/customer/RequestEntry.jsx:122`, `src/lib/geo.js:48–113`, `src/state/AppStateContext.jsx:199–205`, `server/db.js` trips schema. Geocoding coordinates live in a module Map keyed by short label. Creation persists only origin/destination labels. A separate driver browser or refreshed client reconstructs locations from a fixed place dictionary or a deterministic fabricated point. Different places with the same short label also collide. Route and destination correctness cannot be relied on.

Fix: persist explicit pickup/drop-off coordinates, full address and place identifiers in the trip; consume those exact points on every device. Clearly expose route-service failures instead of silently inventing locations.

### F15 — High: password recovery never changes a password

Evidence: `src/screens/auth/ForgotPasswordRequest.jsx:18`, `ForgotPasswordOTP.jsx:13`, `ForgotPasswordReset.jsx:20`, and `server/routes/auth.js`. Request/verification/reset only run timers and navigate; any four digits advance verification, resend is inert and reset displays success without an API call. No recovery routes exist.

Fix: implement expiring challenge issuance/verification and authorized password replacement; only show success after the backend confirms it.

### F16 — High: document verification has no uploaded evidence

Evidence: `src/screens/driver/DocumentUpload.jsx:27`, `src/state/AppStateContext.jsx:482`, `server/routes/drivers.js:30–49`. Upload takes only docType and fabricates a filename; no file is selected, transmitted or stored. Submission does not validate required documents/vehicle details. Approval sets vehicle and driver statuses together without evidence review. Editing vehicle details does not reset verification.

Fix: implement secured file storage and reviewable evidence, validate completeness, track separate review decisions and invalidate affected approvals after material changes.

### F17 — High: admin create/top-up flows call an undefined toast API after writing

Evidence: `src/components/feedback/ToastProvider.jsx:29`, `src/screens/admin/CustomersList.jsx:18,60`, `DriversList.jsx:40,83`, `CustomerDetail.jsx:19,48`. useToast returns a function, but these screens destructure addToast. Creation writes successfully, then throws TypeError before the modal closes/list refreshes. Customer top-up writes successfully, then both the success and catch paths call undefined addToast; the modal remains, making a duplicate top-up on retry plausible. Load failures also cannot show their intended notification.

Fix: use the actual toast function contract everywhere, separately handle persistence and presentation, and make monetary retries idempotent.

### F18 — High: delivery simulation repeatedly writes near-destination state

Evidence: `src/state/AppStateContext.jsx:336–399`. After 70% progress, each animation frame tests activeSimulation.currentTrackingState, which is never initialized or updated. It therefore sends tracking PATCH and two refetches every frame for the remainder of delivery, potentially hundreds of requests per trip. In-flight responses can arrive after the final arrived write and regress tracking.

Fix: emit each milestone once using a ref/state guard, cancel obsolete work, and reject backward transitions at the API.

### F19 — High: account deletion fails for accounts with related records

Evidence: `server/routes/auth.js:75`, `server/db.js` foreign keys, `src/screens/auth/AccountDeletion.jsx:28`. DELETE only removes the user, while documents, payment methods, trips and transactions reference users without cascading deletion. PostgreSQL will reject deletion for such accounts. The UI promises history/payment deletion and has no catch/finally to recover from the error.

Fix: define retention/anonymization and active-trip/balance policy, implement the operation transactionally, and show recoverable failures.

### F20 — Medium: PostgreSQL aliases silently break customer statistics

Evidence: `server/routes/admin.js:133–138,177–183`. Unquoted aliases tripCount and totalSpent are folded to lowercase by PostgreSQL; code reads camelCase properties and falls back to zero. Customers with completed trips therefore report zero in those API fields. Customer detail separately renders trips.length, including non-completed trips, under Total Trips.

Fix: quote aliases or use snake_case consistently and define metric semantics; verify a populated customer fixture against PostgreSQL.

### F21 — Medium: preferences and operational actions are decorative

Evidence: `src/screens/admin/AccessSettings.jsx:10–58`, `src/screens/customer/Settings.jsx:8`, `src/screens/driver/DriverPaymentMethod.jsx:22`, `src/screens/driver/DriverTripScreen.jsx:70`, `src/screens/customer/TrackingScreen.jsx:208,217,321`. Team members are hardcoded; Invite admin has no action; 2FA/refund-approval switches and customer privacy/notification preferences only modify local component state. Driver payout method says saved without persistence. Call/chat/rate-and-tip controls only show toasts. These should not be presented as working controls, particularly security/privacy settings.

Fix: wire each control to persisted behavior and real integrations, or visibly mark it unavailable. Do not claim an enforced security preference before enforcement exists.

### F22 — Medium: failures produce stale data, indefinite loading or stuck actions

Evidence: `src/state/AppStateContext.jsx:49–64`, `src/screens/customer/PaymentMethodScreen.jsx:21`, `src/screens/driver/DocumentUpload.jsx:27`, `TripCompleteRating.jsx:26`, `src/screens/admin/TransactionsList.jsx:24,35`, `src/screens/customer/TripRequested.jsx:30`. Polling swallows failures and supplies empty/stale data without status; several actions set busy then await without catch/finally. Cancelling a request navigates before cancellation is confirmed. Rejected operations can leave a disabled button, unhandled rejection or apparently successful navigation while server work remains active.

Fix: expose loading/error/stale status, add timeouts and recoverable retry behavior, reset busy state in finally and confirm mutations before leaving their flow.

### F23 — Medium: sessions and drafts can retain stale account state

Evidence: `src/state/AppStateContext.jsx:126–129,166–179`, `src/state/RequireAuth.jsx:12`. Route protection trusts the localStorage user and does not call /auth/me to validate a session. Logout clears auth but not requestDraft, dismissed request or simulation. Poll data is not synchronously cleared on enabled account-ID changes. In the same mounted provider, account switching can momentarily expose prior state and inherit a previous user's draft or simulation.

Fix: validate sessions on initialization and reset/cancel all account-scoped state and pending requests on identity changes.

### F24 — Medium: missing operational guardrails and costly data retrieval

Evidence: `server/routes/admin.js:84–118,130`, `server/routes/trips.js:46`, `server/db.js` schema; `src/routes/routeGroups.jsx` eager imports. Lists return full histories without API pagination; serializers issue per-row user/stat queries; frequently polled trip/transaction foreign-key and status queries lack supporting indexes. Customer and driver providers poll many endpoints every 2–5 seconds, including duplicate driver profile fetches. All screen groups and map code contribute to a large initial bundle.

Fix: add bounded pagination, joined/batched queries, measured query indexes, consolidate polling and lazy-load route groups/maps; profile on constrained mobile hardware and network.

### F25 — Medium: remote PostgreSQL TLS certificate validation is disabled

Evidence: `server/db.js:32–35`. Remote connections use rejectUnauthorized:false. Encryption without server certificate verification weakens database connection identity assurance.

Fix: configure a trusted CA/certificate chain and keep verification enabled; test the deployed database connection with the intended production TLS settings.

## End-to-end acceptance matrix

| Journey | Source-level result | Required runtime verification |
| --- | --- | --- |
| Customer signup/login/logout | Persistence paths exist; demo bypass and spoofable identity block release | phone normalization, duplicate signup, role separation, session expiry/revocation |
| Password recovery/deletion | Recovery simulated; deletion blocked by references | SMS challenge expiry/replay, reset login, deletion with trip/payment history |
| Customer location → cargo → truck → fare → dispatch | Draft and API connected; price/coordinates not authoritative | exact coordinates across devices/reload, invalid draft, double submission |
| Driver vehicle → evidence → review → availability | Vehicle metadata persists; uploads lack files; eligibility unenforced | real file review, rejected/resubmitted documents, vehicle changes |
| Dispatch → acceptance → pickup → delivery | Conditional accept protects one request; matching/declines/states incomplete | two-driver contention, tier/location match, decline queue, one active trip |
| Tracking and communication | Polling and map simulation; contact actions are toasts | permission denial, background/resume, real driver telemetry, actual communication |
| Completion → ledger → cash/commission → payouts | Critical atomicity and settlement defects | concurrent completion/withdrawal, cash reconciliation, provider failures |
| Admin customer/driver management | Endpoints present; public; create/top-up toast failure | role matrix, successful modal completion, idempotent top-up |
| Admin refunds/reporting/settings | Refund eligibility unsafe, statistics alias defect, settings decorative | funded debit reversal, immutable audit events, report reconciliation, enforced settings |
| Mobile usability/accessibility | Responsive phone frame exists; native builds absent | 320–430px widths, keyboard/safe areas, screen readers, focus/contrast, reduced motion |
| Deployment/recovery | Vite/Vercel configuration present; build passes | clean schema startup, migration/rollback, DB outage/recovery, logs/alerts and restore |

## Remediation order and release gates

1. Close F01–F06 before exposing shared data or enabling real money: authenticated server identity, admin permissions, removal of demo auth, validated amounts, valid reversals and atomic/idempotent ledger writes.
2. Correct booking, matching and settlement F07–F14; create database-backed integration coverage for prices, exact coordinates, eligibility, concurrent assignment, terminal states and cash/wallet rules.
3. Finish recovery, evidence upload and core UI actions F15–F19, then reporting and operational reliability F20–F25.
4. Run a clean end-to-end scenario using separate customer, driver and admin sessions against an isolated PostgreSQL database: signup, upload evidence, approval, quote/booking, acceptance, pickup, delivery, settlement, refund and report reconciliation. Repeat for decline, cancel, insufficient funds, timeout, duplicate requests, refresh and app resume.
5. Complete physical-device/browser accessibility and performance QA, payment/SMS sandbox reconciliation, current dependency scanning and deployment/recovery checks before launch approval.

Application code was not changed by this audit. Build outputs were regenerated by the build command.
