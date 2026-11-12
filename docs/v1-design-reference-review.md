# V1 design reference review

Reviewed 4 November 2026. Reference only: this is design evidence, not a verification of the current shipped app or an instruction to reproduce every screen.

## Sources and review limits

- Live Figma file: https://www.figma.com/design/79Ea41jgg6muTqnbz8bwlP/GIT-App-Project
- Linked node 1:6 is the Driver App page. Inspected its structure and a rendered Home screen (529:14485).
- Customer App page 1:5 was inspected separately. Visually reviewed Home (450:9674), truck selection/order action (450:9918) and completion/rating (467:9476); reviewed metadata for other customer flow frames.
- Local PDF: ../design/figma/GIT%20App%20Project.pdf — extracted selectable text from all 55 pages. The export is primarily driver journeys, component fragments and section banners; it is not 55 distinct app screens. The PDF does not export the complete Customer App page.
- Other live pages include Authentication, Live Maps and later full-app/rebuild pages. They were listed, not reviewed as V1. No Figma nodes were changed. No interaction prototype or installed app was exercised.

## What V1 establishes

Customer Home uses a full map, one “Where to?” entry near the top, and Order History/Home/Profile bottom navigation. A discount strip exists in the reference but does not establish an active commercial promotion.

Truck selection overlays the map with a bottom panel, Small/Medium/Large cards, visible price ranges and an “Order Truck” action. Subsequent customer frames cover searching, driver approaching, arrival, transit, completion/rating, order history and cancellation. The completion screen shows an amount to pay and rating, not a demonstrated digital approval/receipt lifecycle.

Driver Home uses a green greeting/stats header, a map, and a bottom panel with driver/vehicle identity, eligible load capacities and Slide to go online/offline. Driver flow text covers accept/decline, travel to pickup, arrival/waiting, start, completion, summary and payment-confirmation copy. Supporting screens cover account edits, vehicle capacity in kilograms, document capture/review/upload, pending verification and support.

The PDF explicitly includes connection errors, map errors, unavailable trucks, suspension and verification blocks. These should be carried forward into connected recoverable states rather than treated as entirely new V2 requirements.

## Retain, refine and extend

| Area | Retain from V1 | V2 change |
| --- | --- | --- |
| Brand | Green identity, truck imagery, clear primary action | Consistent tokens, readable text, contrast and native-safe layouts |
| Customer Home | Map context and a direct route-entry action | Explicit pickup/destination, “Order a truck”, active-order summary; compact map/route fallback when map fails |
| Truck choice | Map with service-selection bottom panel | Confirmed payload/body suitability, itemized transport/handling and unambiguous demo total; no misleading crossed-out sample fares |
| Driver Home | Availability, registered vehicle, eligible capacity | Current work and incoming offers get priority; keep stats compact and show confirmed availability |
| Availability interaction | Prominent online/offline intent | Prefer an accessible labelled control; a slide gesture must never be the only way to change availability |
| Delivery | Familiar approach/arrival/start/complete sequence | Cargo-specific loading, offloading, handover and exception states synchronized between apps |
| Completion | Route, driver/truck identity and optional rating | Distinct delivery and payment states, approval/retry/receipt, driver earning/payout status; rating never gates payment recovery |
| Errors | Connection/map/no-truck/restriction screens | Specific cause where known, retained order/draft, recovery, stale-state visibility and consistent error history |
| Verification | Vehicle and document submission | Pending/rejected/resubmission states; do not copy unverified legal assertions or fixed 24-hour promises |

## Effect on V2 Home direction

Treat the V1 map and bottom-panel composition as a useful continuity option. The earlier V2 recommendation for immediately visible route entry still applies, but a large promotional hero should not replace the practical map/ordering layout. Prefer a compact route-entry panel over map context for the idle customer; expand order/tracking details when active. On weak connectivity the same ordering task must work with a textual location/route view.

Preserve the driver's recognizable map/work-panel structure while making availability, active requests and verification clear. Keep loading responsibilities and fees visible to both sides before acceptance. No V1 sample amounts, identities, ratings, capacities, promotions, coordinates or ETA values become actual demo records or business policies simply because they appear in the design.

## Relationship to payment strategy

V1 completion/payment-confirmation copy is historical. The V2 demo includes the owner's requested Mobile Money AND card simulations, linked collection records, failures/unknown outcomes, receipts, driver entitlement/payout distinctions and admin resolution. The later payment strategy informs those additions without overriding current owner instructions.
