# Cargo mobile UX review and simplification

Date: 2 November 2026. Customer and driver prototypes, including shared navigation, booking, delivery, payments, onboarding, account and help surfaces.

## Outcome

The immediate ordering path now has two main screens:

1. Set pickup and destination.
2. Compare trucks and price, then request.

It does not require a separate cargo-category page, long cargo/contact form, loading disclaimer, fare-confirmation checkbox or payment page. The request action confirms the visible total. Old booking URLs still resolve to the combined truck/confirmation screen.

Scheduling is a separate entry from Home, Activity and Account. Recipient, cargo notes, package count, weight, dimensions, vehicle-body preferences and loading help are optional. A sender name/contact is inherited from the booking account rather than requested again. A recipient can be a name only, phone only, both or neither; an entered phone still receives format validation.

These are reference-informed design changes for testing, not certification of compliance with every industry standard or a measured conversion improvement.

## Reference patterns checked online

- [Uber request flow](https://help.uber.com/en-AU/riders/article/how-to-request-a-ride-?nodeId=e9862b49-81c6-4c6a-a9d3-3c05bf42e82e): destination, vehicle selection and request. Applied as a route-first flow with truck capacity and visible price.
- [Uber Reserve](https://help.uber.com/riders/article/nutzung-von-uber%C2%A0reserve?nodeId=71708d67-bbac-4dda-9d32-53c2509bdd1b): dedicated Reserve entry and upcoming reservations. Applied as separate scheduling and Activity; no Uber reservation fee or availability promise is copied.
- [Uber driver trip information](https://www.uber.com/gb/en/drive/basics/how-to-take-trips/): upfront destination and expected payment help drivers choose work. Applied to the cargo offer card with fee and earning information.
- [Lalamove UAE booking guide](https://www.lalamove.com/en-ae/blog/how-to-place-order-lalamove-uae) and [FAQ](https://www.lalamove.com/en-ae/faq): vehicle/service selection, prices and an optional scheduled flow. Applied to truck choice and priced loading extras. Overseas service rules and prices are not Ugandan benchmarks.
- [Nielsen Norman Group on progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): secondary controls can be deferred until needed. Applied to recipient, payment changes, loading helpers and detailed cargo requirements.

Sources describe public product patterns. No competitor account was created and no proprietary screens or assets were copied. Cargo remains the domain: truck payload, body type, loading, offloading and customer/driver financial responsibilities are preserved.

## Customer app changes

### Home and ordering

- One dominant route-entry action replaces competing Search Truck/Match Driver/duplicate booking banners.
- Scheduling and repeat booking are secondary actions. Wallet balance, deposit/withdrawal and referral promotions no longer precede booking.
- Recent places derive from actual account history. Location-entry suggestions are labelled as suggestions when history is empty.
- Truck selection, total, chosen payment and request action share a screen. The total and CTA remain in the footer.
- Payment uses the saved eligible Mobile Money account or explicitly visible Cash fallback. The change control expands only when needed.
- Optional recipient entry has only a name and phone. No contact is required to submit a cargo request.
- Loading is transport-only by default. Optional one/two-helper choices update the displayed quote before submission.
- Detailed cargo notes and vehicle requirements are saved on a separate optional screen. No business/personal questionnaire, repeating-shipment question or pickup-time selector interrupts immediate booking.
- Server validation uses the same provisional quote policy as the UI and rejects a mismatching total.

### Scheduling and activity

- `/customer/schedule` handles date/time separately and validates future pickup.
- Scheduled bookings are persisted as scheduled and excluded from immediate driver offers until due. In this demo, driver polling activates due jobs; there is no independent background scheduler or guaranteed driver reservation.
- Activity separates upcoming and past deliveries. Scheduled jobs show their pickup time and can be cancelled.
- Book again restores route, truck and optional service details, resets timing to now and asks for a new visible quote confirmation via the request action. It does not silently recreate a recurring charge.

### Tracking, payments, account and help

- Matching status no longer claims a real 10km search, verified nearby ETA or a guaranteed sub-minute match.
- Returning Home while waiting does not implicitly cancel. Cancellation is awaited and failures remain recoverable.
- Tracking no longer invents an assigned driver/portrait. Call uses the actual assigned contact; delivery help opens the help screen.
- Customer navigation: Home, Activity, Payments, Account. No fabricated unread-message badges.
- Payments and receipts are a root destination; individual trip payment views remain stack screens.
- The legacy stored-value wallet lives under Account and is labelled experimental; cargo payment does not require a deposit.
- Help has useful FAQs and an explicitly local-only demo issue form instead of dead chat/call actions.

## Driver app changes

- Driver navigation: Home, Deliveries, Earnings, Account.
- Home prioritizes online/offline state, a current delivery or available request, scheduled earnings, actual dues and registered vehicle.
- New offers do not forcibly navigate away from Home. Review request is explicit.
- Offer review presents earning, fee, route, truck category and supplied cargo/handling requirements together. A fake client-only countdown no longer suggests server-side expiration.
- Accept/decline are distinct footer actions with busy/error handling.
- Delivery action labels now match their state changes: Arrived at pickup, Start delivery, Arrived at destination, Complete delivery. Ordinary actions no longer start an unexpected 30-second simulation that needs a second tap.
- Cargo/service details and the booking contact are available during fulfilment; help has a predictable destination.
- Completion shows the fare split and cash/digital meaning. Customer rating is optional and no longer defaults to an unchosen five-star rating.
- Onboarding shows two-step progress, identifies document records as simulated and recovers from request failures.
- Vehicle and account edits no longer get stuck indefinitely after failed saves. Profile forms initialize once, so polling does not overwrite a user typing a name/phone every few seconds.
- Payout contact no longer falsely reports saving an unpersisted bank/MoMo method. It displays the registered contact and distinguishes the future self-service payout flow.

## Shared mobile interactions

- Four root tabs with names matching destinations and 48px navigation targets.
- Standard stack headers/back actions and fixed footer actions remain consistent across booking and delivery.
- Full mobile layout uses dynamic viewport height with safe-area variables, keeping the scrollable body above action/navigation areas.
- Higher truck tiers are expanded when an existing/rebooked selected tier would otherwise be hidden.
- Loading buttons retain their text with a spinner instead of becoming an unnamed spinner-only action.
- Optional fields say optional and only validate supplied values.
- Google/Apple sign-in controls are marked unavailable rather than filling an unrelated driver account. Recovery screens disclose their preview-only behavior instead of claiming a real password change.
- Account deletion failures show a recoverable explanation. The underlying historical-record retention/deletion policy is still unresolved.

## Review coverage and remaining work

| Mobile area | Current result | Further work before production |
| --- | --- | --- |
| Entry, signup, login, recovery | Role/phone entry retained; unsupported social/recovery behavior clarified | Real recovery, phone verification, session security, password-manager and screen-reader testing |
| Immediate booking | Two main screens, optional details and one request action | Observe actual shippers, measure wrong-truck bookings, price comprehension and completion |
| Scheduled/repeat cargo | Separate scheduled flow, upcoming list and explicit rebooking | Scheduler/notification service, operational arrival windows, editing and recurring-contract rules |
| Load and recipient details | Progressive disclosure, optional contacts and useful service notes | Validate sizing support, body fit, equipment, sender/payee/fleet-owner account model |
| Matching/tracking | Real demo state, no invented assigned driver or search radius | Live matching, offline/reconnect, cancellation races, background/resume and safe public tracking |
| Driver registration/review | Clearer progress and recoverable failures | Actual evidence files, inspection/expiry/rejection/resubmission workflows |
| Driver requests/fulfilment | Upfront earning, explicit decisions, correct phase actions | Navigation provider, congestion/approach estimates, recipient handover evidence and damaged/partial delivery |
| Customer/driver payments | Existing simulated collection/dues/payout/refund lifecycle preserved | Real operator rails, reconciliation import, credit limits and approved loss/payout policies |
| Account/settings/support | Clearer destinations; profile edits don't reset; local demo support cases | Real support channels, live notification/privacy enforcement, retention policy and accessibility QA |
| iOS/Android presentation | Source review across mobile route families; key booking and driver views inspected in browser phone frames | Physical iPhone/Android devices, keyboard/large text, TalkBack/VoiceOver, contrast and reduced motion |

The review does not claim that all 52 pre-existing mobile screen files were individually exercised on physical devices. Legacy screen components remain in source where old routes now point to the simplified flow. No native app packaging or app-store release occurred.

## Recommendations retained for later validation

Admin now has `/admin/pilot` (Pilot lab): repeat-cargo focus, short booking, handling transparency, delivery evidence, driver economics, payment-guarantee funding and owner/payee roles. Each recommendation has its hypothesis, measurement plan, editable status and saved observations. Evidence notes are required to mark supported/rejected. Those are manual review outcomes, not automatically inferred proof.

An illustrative margin/funding calculator uses clearly provisional inputs. It does not change live prices or policies. Handover evidence, credit limits, operating corridors and ownership/payee changes remain proposed experiments rather than mandatory booking rules.

## Verification

- Build passes; the existing large-bundle warning remains.
- Lint completes with advisory warnings in shared/context components and existing map code; this is not an accessibility certification.
- Local PostgreSQL integration checks cover optional recipient/no-recipient submissions, server quote validation, helpers, future scheduled exclusion and due activation, activity inclusion, experiment review persistence and the previous payment/dues/refund/payout regressions. Test schema is temporary and removed after the run.
- In Chrome with isolated synthetic accounts: customer logged in, entered a route, reached combined truck confirmation and submitted with no recipient/cargo fields. Android and iOS phone-frame layouts were inspected. The optional contact section expanded with clearly labelled fields.
- Driver logged in, went online, deliberately opened the offer, accepted, advanced through pickup/loading/delivery/arrival and completed to Earnings. The app did not force a screen change on receiving an offer.
- The dedicated scheduling screen and saved Pilot lab review were inspected. Scheduled activation and optional-input validation were checked at API level, not solely from screenshots.

## Suggested next usability test

Ask several shippers and drivers to complete a normal cargo request without guidance, then a scheduled request and a request for someone else. Record time-to-request, abandoned steps, payment misunderstandings, vehicle suitability and whether users discover optional details when needed. Test helpers and an unexpected change in cargo separately. Use observations in Pilot lab to decide what to retain, revise or remove.
