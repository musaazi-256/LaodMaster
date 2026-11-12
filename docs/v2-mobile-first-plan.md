# LoadMaster V2: mobile-first design and delivery plan

Prepared 4 November 2026 from the retained project documentation and screenshot references, updated with the owner's current direction. This is the design and implementation plan. The first connected React Native demo is now implemented; see [native testing](native-testing.md) for current capabilities, checks and remaining work. Existing production backend integration is still deferred.

## Current direction overrides historical scope

- This is V2 of an existing service. Refresh the experience freely while preserving compatibility with the existing backend wherever practical.
- Customer and Driver are separate React Native applications for Android and iOS. Administration is a separate web application.
- Use “Order a truck”, “Your order”, “Order again” and “Scheduled order”. Do not use “Book a truck” or “booking” in new product copy.
- Payment will be in-app Mobile Money and card, simulated for prototyping. The old cash-first/MTN-and-Airtel-only plan is historical and does not automatically determine V2 payment choices.
- First delivery milestone (updated by owner): customer and driver Home plus connected ordering, fulfilment AND simulated in-app payments. Include financial success, failure and recovery in the first walkthrough. Existing backend integration still waits for prototype approval.
- Owner-confirmed sequence: complete and approve the connected demo prototype before connecting the existing backend. Use a shared demo service with synthetic data for this stage; backend access and API documentation are not prerequisites. Historical prototype documentation is not an API contract for the existing service.

## Whole-product scope and sequence

| Stage | Customer application | Driver application | Web administration |
| --- | --- | --- | --- |
| 1: first connected demo | Home, locations, truck/services, review, order, tracking, cancellation, Mobile Money/card selection, pending approval, payment success/failure/unknown, retry and receipt | Home, availability, offers, accept/decline, delivery progression, fare/fee/earning summary and separate collection/payout status | Linked order/payment inspection and demo exception resolution; full portal remains phased |
| 2: complete mobile foundations | Authentication/recovery, profile, orders/history, saved places, scheduling, support, permissions | Onboarding, documents, vehicle, verification, delivery history, support, permissions | Orders/dispatch, customers, driver/vehicle verification, support cases |
| 3: expanded financial operations | Mobile Money/card methods, payment approval, pending/failed/unknown states, retry, receipt and refund status | Earnings, deductions, payout history, failed payout recovery and adjustment notices | Collections, payouts, platform-funded driver payments, full/partial refunds, reasoned transfers/adjustments, reconciliation and financial exception cases |
| 4: administration and hardening | Accessibility, reconnect/background recovery, notifications and real-device checks | Same, plus delivery evidence and operational exceptions | Individual staff identity, permission matrix, staff lifecycle, global/per-user audit history, reporting; referrals/cashbacks if retained in scope |

The first completion target is a runnable connected slice including payment, not a claim that all three applications or production integrations can be completed tonight. Final delivery scope is larger than this first slice.

## Customer Home specification

Visual direction: preserve the recognizable green identity, calm light surfaces, rounded cards and cargo imagery from the retained references. Keep decorative artwork compact enough that the primary task is visible on small phones. Avoid a carousel that displaces route entry.

Content priority, from top to bottom:

1. Small greeting/account identity and an updates entry with a meaningful empty state rather than invented notification counts.
2. Contextual primary card. With no active order: “Order a truck” with Pickup and Destination fields and “Choose a truck”. While searching: “Finding a driver” with route and “View order”. Once assigned: driver/vehicle, current milestone and “Track order”. Preserve access after cancellation failure or reconnection.
3. Secondary shortcuts: Schedule an order and Order again. Estimation belongs to route/truck selection so users do not have to complete two parallel pricing flows.
4. Recent orders showing real or labelled demo records; first-use state explains that orders will appear here.
5. Help entry. Defer customer wallet and Add funds: direct in-app payment does not require a stored-value wallet, and the old balance-first design competed with ordering.

Proposed eventual customer navigation: Home, Orders, Payments, Account. Build Home, Orders and Payments in the first slice. Keep the final root navigation stable once available. Scheduling and order details are stack destinations, not extra tabs.

Home variants to design: first use, returning customer, draft, searching, assigned, active delivery, recently completed, cancelled, offline, loading and recoverable fetch error. Multiple upcoming scheduled orders belong below the primary active order. For the first prototype, propose one immediate active order per customer, pending confirmation against existing backend behavior.

## Driver Home specification

1. Verification or account restriction, if present, with a specific next action. An unverified driver cannot appear available for dispatch.
2. Prominent Online/Offline status and availability control. Show the confirmed server state and pending changes; recover the previous state on failure.
3. Main work card: incoming request or current delivery, otherwise a clear waiting/offline state. A map may support this card but must not obscure the route and next action.
4. Registered truck/category and relevant service area. Do not invent nearby jobs, live GPS or guaranteed demand.
5. Earnings summary is secondary but included in the first slice; do not show an earned balance just because an order exists.

Eventual driver navigation: Home, Deliveries, Earnings, Account. An incoming offer must be noticeable from other screens, using a persistent in-app prompt with Review request. Do not unexpectedly discard another task or navigate away while the driver is editing a form. Foreground notification and background push behavior must be distinguished in the prototype.

Offer review includes pickup/destination, requested capacity/body, registered vehicle suitability, supplied cargo details, handling responsibility, distance/ETA only when available, agreed fare and eventually earning/fee split. A decline affects only that driver. Going offline does not abandon an accepted delivery.

## Ordering and fulfilment

Customer path:

Home → pickup/destination → truck and service selection → review in the same screen → Order a truck → Finding a driver → assigned driver → delivery tracking → delivery complete.

Use two main ordering screens: route entry; then truck/services/total with a persistent review-and-order footer. Recipient/contact, cargo notes and dimensions can expand as needed. Ask suitability questions when they affect safe fulfilment or price; do not require a large questionnaire for every order. Manual location entry must remain possible when location access is denied. Phone GPS must never silently substitute for an explicitly chosen pickup.

The review shows editable route, truck/payload/body description, handling at both ends, any supplied recipient details and the itemized demo quote. The final action confirms those values. All prices remain visibly demo prices until commercially configured. Stage 1 includes a selected demo payment method before ordering and simulated collection after delivery completion. Customer approval and receipt must relate to that same order, with no real provider charge.

Driver/customer shared progression:

Requested/searching → driver assigned → travelling to pickup → arrived at pickup → loading → in transit → arrived at destination → offloading → delivered.

Cancellation and exception transitions branch from allowed phases; cancellation after pickup must use a defined operational exception rather than silently erasing a cargo-in-custody delivery. Driver actions must accurately describe the next transition. Departure requires loading completion; delivery completion requires the handover/exception choice. Customer tracking shows the same authoritative state and actual recorded event times.

Stage 1 should include a basic handover confirmation and an exception entry. Stronger photo/signature/OTP evidence can follow, without claiming an unimplemented confirmation is already verified.

## Connection and backend compatibility

Proposed structure: apps/customer, apps/driver, apps/admin, packages/contracts, packages/api-client, packages/mobile-ui and packages/demo-service. Share design tokens across mobile and web; mobile controls and web controls remain platform-appropriate.

Keep one authoritative order record accessible by both mobile apps. Independent component state or separate phone-local storage is insufficient for the connected demonstration. Use a shared persistent demo service, reachable from separate devices, throughout the prototype stage. Map the existing backend adapter only after prototype approval. The demo service must remain isolated from the existing service and use synthetic accounts/data.

The API client offers domain operations for quoting, creating/retrieving/cancelling an order, availability, listing offers, accepting/declining and advancing delivery states. Implement these against the existing backend's actual endpoints once inspected; do not invent compatibility. Map legacy booking terminology at this boundary while presenting ordering terminology in V2.

Use existing subscriptions if supported; otherwise use refresh/polling with clear freshness and resume handling. Both apps refetch authoritative state after reconnection or foreground resume. A production push integration is separate from foreground order synchronization.

Acceptance must be atomic: two drivers cannot win the same order. Retries must not create duplicate orders. Cancellation and acceptance races must resolve in the service and both UIs converge on the result. Offline, unverified, unsuitable or busy drivers must not accept; larger vehicles require payload/body/handling compatibility, not category rank alone. Use server expiration if offers expire; never invent a client-only countdown.

Before backend integration, inventory existing identity/session rules, order endpoints/statuses, vehicle types, quoting rules, pagination, events, errors and cancellation permissions. Record compatible operations, adapter-only differences and genuine gaps. Change backend behavior only where the product needs cannot be met by an adapter.

## Loading and offloading fees

The retained scope conflicts: older material leaves handling to on-site negotiation; later work introduces helper selection and an agreed quote. V2 should make responsibility and price explicit before ordering.

| Choice | Required explanation | Pricing treatment |
| --- | --- | --- |
| I'll arrange handling | Customer supplies loading/offloading people and equipment | Transport only; handling not included |
| Add loading help | Pickup helpers, quantity, included time and limits | Separate pickup handling line |
| Add offloading help | Destination helpers, quantity, included time and limits | Separate destination handling line |
| Complex/heavy load | Stairs, heavy items, equipment, restricted access or unknown suitability | Assisted quote; no invented guaranteed price |

Use a compact “Loading & offloading” summary on the truck screen, expanded into a sheet for choices at each end. Show the agreed services on the driver offer and throughout the order. Default wording must disclose transport-only clearly rather than hiding the exclusion.

Proposed quote: transport + pickup handling + destination handling + other explicitly selected services = total. Rates are configurable labelled demo inputs; do not infer real Ugandan rates from old fixtures or overseas examples.

Decisions for commercial validation: who supplies helpers, whether the driver is expected to help, helper availability, charging unit/time allowance, stairs/distance rules, waiting charges, commission on handling, payee, cancellation and unfulfilled-service refunds. No automatic surprise surcharge. Post-order changes need an itemized customer-approved revision with an audit history. If help is unavailable, ask the customer to revise or cancel; never silently remove an agreed service.

## Visible errors and recovery

Each error has a stable code, plain-language explanation, next action, order/reference where available, retryability, ownership and a documented recovery path. Show field errors beside fields; blocking problems within the relevant screen; persistent unresolved issues on the order timeline. Toasts can supplement these but cannot be the only record.

| Scenario | UI behavior / example copy | Recovery |
| --- | --- | --- |
| Location access denied | “Choose a pickup manually, or enable location access.” | Search or enter manually; settings link |
| Invalid/unavailable route | Explain the relevant location or service-area issue | Edit locations; retain draft |
| Quote unavailable/expired | “We couldn't confirm this price.” / “Your price has changed.” | Refresh; show difference and require confirmation |
| No suitable driver | “No suitable driver is available right now.” | Keep searching, change truck/service or cancel |
| Submission times out | “We're checking whether your order was placed.” | Resolve by request key before allowing a new submission |
| Offer already accepted/cancelled | “This request is no longer available.” | Refresh offers; no false acceptance |
| Availability update fails | “Couldn't go online. You're still offline.” | Retry; retain confirmed availability |
| Connection lost | Persistent offline/stale update banner | Preserve draft; refetch; don't claim unconfirmed progress |
| Cancellation fails/races | “We couldn't confirm cancellation. Your order may still be active.” | Refresh authoritative order and show allowed options |
| Wrong load/handling unavailable | Specific exception with actual service mismatch | Customer-approved change or support resolution |
| Payment declined, later stage | Failure reason where known; no paid badge | Retry or change method |
| Payment outcome unknown, later stage | “We're checking your payment. Don't pay again yet.” | Reconcile the current attempt before enabling another |
| Refund/payout fails, later stage | Pending/failed record persists for customer/driver/admin | Retry safely or escalate with linked case |

A failed operation and a successful result arriving late must reconcile without duplicate actions or contradictory history. Put developer details behind expandable diagnostics; keep credentials and full payment details out of messages/logs.

## Financial scope: first demo and later administration

Keep delivery status, collection status, driver entitlement, payout status and refund status separate. Delivery completion does not falsely imply payment success. Simulate asynchronous Mobile Money approval, card authorization/decline, timeout/unknown outcomes, callbacks, retry and reversal through a provider adapter with reproducible scenarios. No live money or real card credentials are required.

Admin information architecture: Overview; Orders & dispatch; Customers; Drivers & vehicles; Collections; Driver payouts; Refunds & adjustments; Transfers; Reconciliation; Support & disputes; Staff & roles; Audit; Reports/settings. Show customer collection and platform commission separately from driver liabilities; gross order value is not platform revenue.

Distinguish financial operations:

- Customer refund: full or partial, linked to the original successful collection and original method; cap cumulative refunds at the refundable amount; show pending/success/failure and reason.
- Driver protection payment: pay an entitled driver from a named platform funding account when customer collection fails. Customer debt remains separately visible; later recovery must not pay the driver a second time.
- Transfer/adjustment: explicit authorized source, destination, amount, currency, related order/case, reason and effect preview. Record balanced ledger movements, actor/time and reversal history instead of editing balances in place.

An overcharge correction does not automatically mean a driver clawback: show the proposed customer, platform and driver effects before confirmation. Payee, guarantee eligibility, handling commission and adjustment permissions remain business decisions. Staff permissions apply to both UI and service operations; denied actions are visible with appropriate explanation. Demo scenarios must cover pending/failed transfers and insufficient platform funds.

## iOS and Android consistency

Share semantic colors, spacing, typography roles, icons, terminology, card hierarchy, order states and validation behavior. Adapt native back behavior, navigation gestures, date/time pickers, permission prompts, keyboards, sheets, safe areas and haptics where needed. Respect text scaling, reduced motion, VoiceOver/TalkBack and platform font metrics. Maps and demo location status need explicit labels.

Use generous touch targets, content that scrolls with large text, keyboard-safe forms and action bars that clear system navigation areas. Test small Android phones and iPhones, including gesture and button navigation. Browser phone frames alone do not validate native behavior.

Primary references: [Apple layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout), [Apple tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Android adaptive layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout), [Android touch target guidance](https://support.google.com/accessibility/android/answer/7101858).

## First-demo payment journey

Choose MTN Mobile Money, Airtel Money or demo card during order review → place order → driver accepts and delivers → completion creates one collection obligation → customer sees approval/processing → simulated success produces a receipt, or a failure/unknown result exposes a recoverable state. Driver Home/Earnings and the linked admin record reflect collection separately from earning entitlement and payout. Never request a Mobile Money PIN or real card credentials in the prototype.

Use reproducible success, decline, insufficient balance, timeout, delayed confirmation and duplicate callback scenarios. While payment outcome is uncertain, check that attempt before enabling another charge. Payment attempts are distinct records against one obligation, and repeated completion/callback events must not credit or collect twice.

The supplied payment strategy is reference material, not instructions to execute transactions or contact providers. Its card phasing, cash availability, automatic-versus-driver-initiated collection, final GPS fare and payout guarantee require comparison with the latest owner requirements. The owner explicitly includes simulated card payments in V2; do not silently mark cards Coming Soon because an older strategy does. Label unresolved timing, fee and guarantee choices as demo assumptions.

## First-slice acceptance checklist

1. Customer chooses a route, truck and handling options, sees the total and creates exactly one order.
2. A separate signed-in eligible driver receives the same order with the same route, service and quote; offline/busy/unsuitable drivers cannot accept.
3. Driver accepts; customer sees that assigned driver. Concurrent acceptance has one winner.
4. Pickup, loading, transit, offloading and delivered states synchronize across both apps; delivery completion does not claim payment success before confirmation.
5. Decline, no-driver, quote-change, timeout, cancellation, offline/reconnect and app-restart scenarios preserve a coherent order and recovery path.
6. Manual location entry works after permission denial. Forms remain usable with keyboard and enlarged text on iOS and Android.
7. All new UI copy uses ordering terminology; simulated GPS/quotes are identifiable.
8. Mobile Money and card simulations cover success, failure, timeout/unknown, delayed confirmation and safe retry; each successful payment generates a linked receipt.
9. Customer, driver and admin views agree on the same collection, entitlement and payout states. Duplicate events cannot duplicate charges or earnings.
10. Prototype demo scenarios are repeatable and isolated from existing customer accounts and money.

## Evidence reviewed

The rebuild guide; historical engagement and expanded proposal coverage; customer/driver UX review; business-model review; payment-strategy comparison; prototype improvement notes; dispatch restoration; trip-tracking review; mobile redesign/refresh reports; customer Home screenshot and Figma handoff inventory. Old verification reports describe the removed prototype, not V2. The latest owner instructions take precedence over those historical design decisions.

## Supplied payment PDF review — 4 November 2026

Reviewed the selectable text of all 33 pages of “LoadMaster Digital Payments Strategy - Final 2026 (1).pptx.pdf” supplied from Downloads. This was a text review, not a visual assessment of its mockups. The document is reference evidence, not permission to execute its onboarding, outreach, procurement or rollout steps.

Carry into the demo: method selection before ordering (pp. 10–12), automatic Mobile Money request after verified delivery (p. 7), approval/pending/failure/retry and receipt (pp. 12–14), configurable 15% starting fee and separate scheduled payout (pp. 17–18), linked payment/admin records (pp. 21–22), original-method refunds and reasoned audited adjustments (p. 23). Use a simulated delivery verification rather than claim live GPS exists. Rates and payout cadence remain labelled demo configuration.

Conflicts and proposed prototype interpretations:

- Cards are Phase 3/Coming Soon in the PDF (pp. 10, 30); the owner's current request includes a functioning card simulation, so include that now without implying a live integration.
- The PDF retains cash permanently (pp. 10, 16); the owner's current requested demo focuses on Mobile Money/card. Cash is not silently removed as a business policy, but remains outside the first digital walkthrough pending confirmation.
- Automatic collection on p. 7 conflicts with a driver Request Payment action on p. 13. Proposed default: completion initiates one request; driver actions inspect or retry only when permitted, never launch a second concurrent attempt.
- The unpaid-trip hold on p. 14 conflicts with continued operations on p. 19. Proposed default: delivery remains completed, collection remains pending/failed, and the issue is visible without falsely reversing physical delivery. Future-order arrears restrictions need an explicit rule.
- The GPS-based final fare (p. 12) differs from the proposed upfront quote. For the demo, use the accepted itemized quote; any revision must be disclosed and accepted before collection. Do not silently increase the fare from simulated distance.
- Driver guarantee, future earning corrections and payout holds (pp. 19–23) need distinct scenarios. Demonstrate platform-funded driver payment on customer non-payment without claiming every dispute is automatically covered or every refund deducted from the driver.

Unverified provider fees, regulatory claims, customer counts, rollout targets and operator timing in the PDF are not treated as current established facts or implementation constraints. No provider selection or production integration is needed for this demo.

## V1 design continuity

See [V1 design reference review](v1-design-reference-review.md). Live V1 customer screens establish a map-first Home and truck-selection bottom panel; driver screens establish a map, vehicle/capacity panel and availability control. Preserve recognizable map/ordering context while keeping route entry immediately visible, and provide a text-based fallback when maps fail. The V1 files are reference evidence, not proof of current app behavior or instructions to copy sample data and policies.
