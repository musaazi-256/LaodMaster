# Package-sending reference and implemented scope — 5 November 2026

Reviewed IMG_2071.PNG–IMG_2094.PNG. The screenshots supply functional reference, not LoadMaster policy, prices, backend instructions or reusable customer data. The user's follow-up explicitly includes cash collection, FlexiPay, another company's wallet and short-number driver pairing; it supersedes the earlier exclusions of these features.

## Picked up and built

| Reference | LoadMaster implementation |
| --- | --- |
| Location search, current location, map selection and recent destinations (2071, 2083–2084) | Editable pickup/destination, search, device location, native interactive map-pin confirmation, saved/recent places. Manual entry remains available. Native route preview follows public road-routing geometry when available; routing failures are labelled and use an approximate dashed connection. |
| Multiple destinations and ordering (2072, 2074–2075, 2082) | One pickup, up to five distinct destinations; add/remove/reorder stops. Cargo stays assigned to its stop. A proximity-based stop sequence can be previewed and explicitly applied. Requotes follow changes. |
| Cargo descriptions/instructions (2082, 2089–2090) | Up to twenty cargo lines, quantity, unit weight, optional dimensions, fragile flag, destination assignment, separate pickup and destination instructions. Combined payload is checked in the UI and service. |
| Sender/recipient identities and contact selection (2087–2088) | Self or someone else, required name and phone for pickup and every stop. Native single-contact picker with manual fallback; no bulk contact-book import. |
| Review and validation (2091–2092) | Four-step truck/destinations → cargo/contacts → payment/pairing → full order review. Account-local drafts, repeat-order data, editable prior steps, itemized fees and acknowledgement. |
| Loading/offloading | Pickup helpers charged once; offloading helpers charged per destination. Each additional destination adds a clearly itemized UGX 1,500 demo fee. These are prototype rules, not approved tariffs. |
| PIN handover (2087) | Optional independent code per stop; customer-only demo code, private sharing, assigned-driver input, five wrong-attempt lock and audited supervisor exception. Driver offers and public tracking omit PINs. |
| Matching/progress/cancellation (2077–2081, 2093–2094) | Eligible-driver offers, short-number preference, driver acceptance, search/assignment, pickup/loading/transit/offloading/handover, per-stop status and timeline. Cancellation/release before cargo custody; issue and return review afterwards. |
| Driver pairing (2076, 2091–2092) | Four-digit number on driver home. Customer checks it during ordering. The driver must be verified, active, online, free and have adequate truck capacity, then accept the request. Rate-limited lookup; customer can switch to automatic matching. Scheduled orders use automatic matching. |
| Communication and sharing (2080, 2094) | Native dialer actions, order-linked customer/driver chat and quick replies. Native sharing creates a revocable, 24-hour public delivery-only link without contact numbers or PINs. |
| Payments/default method pattern (2073, 2085) | MTN MoMo, Airtel Money, card, cash, FlexiPay, named external wallet (e.g. SafeBoda Wallet demo), and LoadMaster wallet. Customer or first-stop recipient pays. Payment remains due after handover. Failures, uncertain outcomes, retry/status checks, receipt and support are visible. |
| Recipient payer (2085, 2091) | Explicit recipient acceptance and approval through a random-token demo payment link; the ordering customer cannot approve for them. Recipient payments cannot debit the ordering customer's LoadMaster wallet. Refund allocation follows the payer. |
| Cash | Driver records the exact transport amount received; payer confirms. Driver retains the earning, platform amount owed is tracked, finance records remittance. An earlier reserve-funded payout prevents duplicate earnings and makes the full collected cash owed to the platform. |
| Failed delivery and returns (2086) | Driver reports failed stop/reason. Supervisor may authorize a PIN exception, continue to other stops while retaining failed cargo, or return to pickup. Remaining failed cargo must be returned before final completion/payment becomes due; supervisor records returned handover. |
| Admin exceptions/refunds/transfers | Web shadcn portal shows stop cargo/contacts/status, payer, issues, PIN exceptions and returns. Existing audited refunds, reserve guarantees, transfers and reconciliation remain connected. Cash remittance and separate recipient refund allocation are added. |

## Left out or adapted

- Passenger seats, Comfort/XL ride categories and motorcycle delivery categories: LoadMaster uses truck body/capacity and total cargo payload.
- Copied branding, illustrations, contact records, balances, fares and provider-specific price differences: retain LoadMaster's home-screen green, typography, spacing and cards.
- Unsupported arrival promises and “close to finding a driver” claims: show actual state; positions are labelled simulated. Public road travel estimates are not live driver ETA or truck-clearance guidance.
- Guaranteed lowest-price routing: the prototype offers a transparent proximity suggestion, not a commercial route optimizer.
- Cash collection for the value of goods: cash is for transport charges; no merchant goods-payment remittance is inferred.
- Automatic return surcharge, disposal after 30 days, return to another company's offices and copied liability clauses: no such business policy is adopted. Returns need a reason and supervisor review.
- Automatic collection merely because a phone number was supplied: recipient acceptance and payment authorization are explicit.
- Immediate “pay now”: this build keeps the established post-handover collection timing. Choosing a method does not mark it paid.

## Prototype boundaries

All payment providers, messages and authorization links run against the shared local demo service, not the production backend. No real money, provider login, SMS, payment PIN or production push is involved. External-wallet naming represents a simulated adapter, not an integration or partnership. LoadMaster-wallet collection and refunds update the demo ledger; recipient refunds use a separate recipient allocation, not the ordering customer's wallet. Public recipient links model consent but do not verify phone ownership. Both apps and shared links need access to the same demo server; localhost links are for the testing machine.

Native maps use OpenStreetMap tiles and a public OSRM road preview, with an explicit fallback. Configure commercial routing/maps, truck constraints, verified GPS, messaging transport, recipient identity and real payment adapters before production. OSRM route API: https://project-osrm.org/docs/v26.5.0/http/ .

New UI lives in `CargoOrderWizard`, `CargoDelivery`, `CargoPayment`, `CargoUI` and `RouteMap`; service rules in `services/demo/cargo.mjs`. Native iOS/Android layouts reuse the existing home-screen theme, native tabs, keyboards, contact picker, dialer and share sheet.

## Visible errors and recovery

| Condition / code | UI and recovery |
| --- | --- |
| `STOPS_INVALID`, `HANDLING_INVALID`, `CARGO_STOP_INVALID`, `EMPTY_STOP` | Correct duplicate/missing destinations, helper counts or cargo assignment; reprice. |
| `CONTACT_REQUIRED`, `CARGO_REQUIRED`, `CARGO_INVALID`, `CAPACITY_MISMATCH` | Field-step validation and service error; complete contacts, enter positive weights/quantities or select adequate truck. |
| `PAIR_NOT_FOUND`, `PAIR_RATE_LIMIT`, `DRIVER_UNAVAILABLE`, `PAIR_ONLY`, `PAIR_SCHEDULED` | Check number, wait, clear preference or use automatic matching; no eligibility bypass. |
| `PIN_INVALID`, `PIN_LOCKED`, `HANDOVER_REQUIRED`, `STAGE_CONFLICT` | Delivery stays incomplete; correct code/confirm handover or report issue for supervisor review. |
| `RECIPIENT_APPROVAL_REQUIRED`, `PAYER_ACCEPTANCE_REQUIRED`, `PAYER_METHOD_INVALID`, `LINK_EXPIRED` | Customer shares recipient link; recipient explicitly accepts. Invalid/expired links show errors. Ordering-customer wallet is unavailable to recipient payer. |
| `PROVIDER_REQUIRED`, insufficient balance, declined/failed/unknown payment | Name wallet provider, add funds/change method, retry failed attempts or check uncertain status. No retry while a debit remains uncertain. |
| `CASH_NOT_RECORDED`, `CASH_AMOUNT_MISMATCH`, `CASH_CONFIRM_REQUIRED`, `CASH_NOT_COLLECTED` | Driver declares exact agreed transport amount, payer confirms, then finance reconciles remittance. Discrepancies use support. |
| Native contact picker cancelled/denied/unavailable | Preserve form and allow manual contact entry. |
| Map tiles or road-routing unavailable | Visible retry/fallback notice; typed/saved locations remain usable. Approximate lines are explicitly identified. |
| Network request or authorization failure | Screen error retains entered data; retry or sign in. Messages/order submissions use references to avoid duplicates. |
