# LoadMaster cargo business model review

Reviewed 2 November 2026, after implementing and checking the Phase 1 payment demo improvements.

## Recommendation

Position LoadMaster as a dependable cargo marketplace for Ugandan businesses and individuals, with repeat SME shipments providing the initial demand base. Start with a few service corridors and vehicle configurations that can be fulfilled reliably. Make cargo suitability, agreed total cost, evidence of delivery and predictable driver earnings the reasons customers return.

This is a recommendation to test, not a claim that demand, profitability or a preferred corridor has already been validated. The workspace, payments advisory and public sources do not supply shipment-level financials or customer research sufficient to establish product-market fit.

## Basis and limitations

Internal evidence: customer/driver/admin prototype source, truck-tier fixtures, the product description in `src/screens/Proposal.jsx`, the August 2026 payments advisory, and the newly implemented demo behavior. The proposal is an engagement/scope document, not audited company financial evidence. Its old wallet-first wording predates the strategy-aligned payment flow and should be updated in a separately approved proposal revision.

Online research used current public first-party pages below. These describe advertised products; I did not open competitor accounts, buy services, independently validate performance claims, or establish their actual transaction volumes, current coverage, prices or profitability. Lalamove examples are from named overseas markets and are product-design benchmarks, not Ugandan market rates. Leta is an adjacent operations/software comparator rather than an identical truck marketplace.

LoadMaster's public homepage presents cargo booking, verified trucks, advance cost visibility and tracking for business and household moves. Its September 2025 article additionally describes scheduling, customer support and driver vetting, and identifies payments/insurance/optimization as development ambitions. Public claims about the shipped apps should be checked against the actual production app separately; this repository is a prototype. [LoadMaster homepage](https://loadmaster.co.ug/), [LoadMaster company article](https://loadmaster.co.ug/2025/09/08/how-a-ugandan-startup-is-digitizing-africas-chaotic-cargo-transport/).

## Current model and proposed direction

| Business element | Current evidence | Recommended direction |
| --- | --- | --- |
| Customer | Businesses and individuals moving general goods, household items, construction material, produce and furniture | Keep the broad long-term vision. Initially recruit one repeat-business segment with similar cargo/route needs; validate occasional household moves separately. |
| Supply | Verified driver accounts with one vehicle and five truck tiers | Establish whether the contracting transporter is an owner-driver, fleet owner or employed driver. The payout recipient and authorized vehicle operator may be different people. |
| Core value | Find a truck, track cargo, pay | Guarantee a clear service promise that can be fulfilled operationally: correct vehicle, agreed pickup/delivery window, disclosed charges and recorded handover. |
| Revenue | Advisory specifies 15% platform fee | Test 15% as a starting commercial assumption. Measure collected contribution by cargo segment, route, truck and customer cohort before changing it. |
| Payments | Cash permanently available; MTN/Airtel at completion; T+N earning settlement | Maintain choice, but distinguish the customer payment obligation, cash fee receivable, driver entitlement and payout cash requirement. |
| Operations | Admin verification, trips, customer/driver management and payments | Add dispatch intervention, evidence review, cargo exceptions, commercial account controls and reconciliation ownership. |
| Retention | History/profile exist; repeat business workflows are limited | Rebook saved shipments, schedule recurring work, retain approved recipient details and offer dependable support. |
| Expansion | Five size bands extend to container/long-haul cargo | Expand only after corridor reliability and contribution are proven. Long-haul, containers, shared loads and perishables require different operating rules. |

## Online comparison

| Comparator | Publicly described approach | What LoadMaster can learn |
| --- | --- | --- |
| Lori Systems | Matches shippers with vetted transport partners. Describes cargo/truck details, electronic recipient confirmation and documentation review before transporter payment. Also advertises transporter/truck checks and insurance requirements. | Delivery evidence and operational service are part of the freight product. Record the recipient handover rather than treating a GPS point or driver button as sufficient proof. [Lori](https://www.lorisystems.com/). |
| Lalamove business service, UAE | Offers on-demand and scheduled work, different vehicle capacities, tracking, multi-stop delivery and pricing based on distance, vehicle and selected extras. | Make scheduling, cargo dimensions and full service scope visible at booking. Treat recurring stock movements differently from one-off moving jobs. [Business service](https://www.lalamove.com/en-ae/business). |
| Lalamove technical model | Documents quotation references, validity periods, sender/recipient details, scheduled orders and photo/signature delivery evidence. | Bind accepted prices to a quote and shipment scope. Define pickup and delivery evidence separately. These are design lessons, not a recommendation to integrate its API. [Official documentation](https://developers.lalamove.com/). |
| Lalamove service fees, UK FAQ | Describes selectable handling help and waiting charges beyond an allowance. | Do not leave the final customer cost to an unrecorded loading negotiation at the truck. Show included service and disclose approved extras. Overseas amounts are not applicable to Uganda. [FAQ](https://www.lalamove.eu/en-gb/faq). |
| Leta | Markets planned/on-demand delivery software, dispatch, route/load optimization, tracking and operating analytics. Its delivery page connects recorded collection to an order and delivery evidence. | Add business operating features and measure utilization/cost-to-serve. Optimizing repeat routes may create more value than acquiring scattered one-off bookings. [Solutions](https://leta.ai/solutions/), [Delivery product](https://leta.ai/products/last-mile-delivery/). |

Amitruck's primary website could not be retrieved, and GoTruck's landing page repeatedly timed out despite a search-index description. I have excluded both from substantive conclusions rather than presenting old or partially accessible material as verified current capability. This review does not rank provider market share or assert that all comparators operate in Uganda today.

## 1. Choose a demand segment with repeatable work

Suggested first hypothesis: retail/wholesale restocking and warehouse-to-shop cargo using a limited pickup/box-truck range in selected Kampala-area corridors. Interview customers and vehicle owners before fixing either geography or capacity bands. Use repeat booking frequency, dispatch success, waiting time and contribution to decide.

Furniture deliveries can be a useful second test if shops supply repeat orders and handling requirements are standardized. Household moves can remain available with a separate checklist and service scope. Agricultural produce, construction loads and long-haul work should not inherit identical pricing or protection assumptions: urgency, damage exposure, loading equipment, access and empty return costs differ.

Do not require every truck tier to be liquid on day one. A visible request-for-quote option is more honest than promising immediate availability where vetted supply is sparse.

## 2. Separate customer, sender, recipient, payer and transporter

A customer may book from an office while staff load goods at a depot and a different person receives them. Corporate finance may pay. An employed driver may deliver in a fleet owner's vehicle.

Model a booking account, sender contact, receiver contact, authorized payer, legal transporter/payee, driver and vehicle. Keep the existing customer and driver apps, but give business customers and fleet owners appropriate management views over time. A separate owner app is not automatically necessary.

Prototype next: recipient contact and delivery instructions, authorized account/payer, cargo description, count, approximate weight and dimensions, declared value, body type, handling equipment and access constraints. Ask only questions that affect vehicle suitability, price or safe fulfilment. Offer assistance when the customer cannot estimate a load.

## 3. Price the agreed job, with controlled exceptions

The strategy assumes distance-derived final fares, while public positioning emphasizes knowing the price beforehand. Reconcile that promise with a binding quote or a clearly disclosed estimate and limit on changes.

A useful pricing structure to validate is a vehicle/route minimum plus planned distance, time/service allowance, loading help, extra stops and explicitly approved charges. Driver detours should not automatically increase the customer's fare. Waiting charges need an included period, an observable start event and a customer-visible rule. Cargo added after booking requires an agreed scope change.

Replace five size names alone with payload and usable dimensions plus open/covered/box configurations and equipment. Confirm the prototype's unresolved tonnage bands. Never infer that a truck can legally or safely carry a load solely from a category label.

The current prototype still uses fixed-tier demo prices. This review recommends the commercial model; it does not claim production pricing has been built.

## 4. Make handling an explicit service

The current cargo disclaimer says loading and offloading are arranged on-site, outside platform payments. That makes the displayed price incomplete and encourages disputes or business leaving the platform.

Test three booking scopes: transport only with customer-provided loaders; transport plus an agreed number of helpers; assisted quote for complex/heavy moves. Show exclusions and acceptance before dispatch. Define whether helper charges attract commission or pass through at cost. Do not add a new charge merely to increase revenue without showing the customer what service it buys.

## 5. Use delivery evidence to support payment and disputes

GPS establishes where a device was, not whether the correct cargo arrived intact. Add pickup photos/count/condition, recorded loading completion, recipient OTP or signature, delivery photos/count/condition and an exception path for shortages, damage or recipient absence. Keep a timestamped shipment record the customer, driver and support team can interpret.

Give drivers a way to report a failed handover without falsely claiming completion or cash collection. For loss/damage, decide the commercial service obligation, claims process and protection product with the relevant partners. Do not display insurance as included until coverage, exclusions, limits and provider arrangements are actually confirmed.

## 6. Review the cost of guaranteeing driver earnings

The strategy recommends paying verified deliveries on the normal cycle even if the mobile-money customer does not pay. This is a credit and funding commitment. It is stronger than simply forwarding collected funds.

Test protections such as verified payer accounts, no additional credit booking while overdue, limits for new/high-value customers, approved business credit terms and deposits for large jobs. Keep these as policy proposals until approved. The demo currently schedules the earning independently of collection and does not enforce customer credit limits.

### Illustrative unit economics, not observed LoadMaster performance

Assumptions: fare UGX 150,000; driver entitlement 85%; hypothetical merchant collection cost 3% of money actually collected; payout cost UGX 1,500; variable operations UGX 5,000; claims reserve UGX 1,500. These cost inputs are invented for sensitivity testing, not quoted provider prices. Excludes fixed overhead, taxes and acquisition costs.

| Digital customer non-payment rate | Average collection | Driver entitlement | Collection cost | Other variable costs | Contribution per completed trip |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0% | 150,000 | 127,500 | 4,500 | 8,000 | 10,000 |
| 5% | 142,500 | 127,500 | 4,275 | 8,000 | 2,725 |
| 10% | 135,000 | 127,500 | 4,050 | 8,000 | -4,550 |

Calculation: contribution = collected fare − guaranteed driver entitlement − merchant collection cost − payout/operations/claims costs. Here it equals `150,000 × (1 − default rate) × 0.97 − 127,500 − 8,000`.

The 15% fee is revenue before these costs, not profit. The driver's 85% is also not take-home profit after fuel, maintenance, helpers, parking and empty mileage. Measure both sides.

Funding illustration: if 40 such digital trips complete daily and customer funds arrive seven days after driver payout becomes due, the gross driver-share funding bridge is `40 × 127,500 × 7 = UGX 35.7 million`. This is a stress scenario, not a claim that normal settlement produces that gap. Actual working capital depends on collection/payout timing, defaults, reserves and recoveries. Measure cash timing separately from contribution.

Cash trips need their own economics: the driver holds the fare, and LoadMaster's fee remains a receivable until recovered. Track dues aging and actual collections, not only fees booked in the database.

## 7. Build driver retention around net earnings and usable work

Show cargo/service requirements, pickup distance, expected duration, handling expectations, gross earning, dues recovery and expected payout before acceptance. A profitable delivery can become unattractive when unpaid loading time and the empty journey home are ignored.

Recruit verified supply around actual customer demand. Give fleet owners a way to assign authorized drivers and settle to a controlled account. Test return-load matching only when timing, location, capacity and service scope fit; never assume that two opposite-direction loads can be paired automatically.

Dues recovery should be transparent, with a statement, a dispute route and clear limits. Do not surprise a driver with deductions that leave insufficient funds to operate. Thresholds, grace periods and any cap on per-trip recovery need explicit business approval.

## 8. Earn repeat usage and reduce off-platform leakage

Build a reusable shipment record, saved locations, rebooking, scheduled pickups, business statements, support case history and a clear remedy when service fails. These provide a continuing reason to book through LoadMaster after customer and driver meet.

Use merchant associations, wholesalers, furniture/hardware shops, warehouses and transport-stage relationships as recruitment experiments. Assisted booking can help onboarding, but record the same quote, account and evidence as a self-service booking. Chargeable dedicated-service or subscription plans should follow evidence of ongoing business value rather than being imposed before there is reliable volume.

A broad advertising campaign that creates requests without nearby suitable trucks risks wasting both customer acquisition and driver time. Test acquisition cost and repeat contribution by corridor.

## 9. Use an operations model that can fulfil the promise

Decide which events operations must intervene in: no truck found, driver late, unsuitable load, vehicle breakdown, recipient unavailable, damaged cargo, cash not handed over, mobile-money uncertainty and disputed deductions.

Assign an owner and response target to each. Support access and escalation are part of the business cost. Add a manual dispatch/reassignment path before investing in complex optimization. The admin portal should distinguish transport volume, collected money, commission revenue, outstanding cash dues, driver liabilities, payouts and refund/claims adjustments.

Do not describe all trip fare as platform revenue. Do not combine customer transport-fee collection with cash-on-delivery collection for the value of goods; the latter is a different service requiring its own rules and reconciliation.

## What to measure in a pilot

| Measure | Why it matters |
| --- | --- |
| Fulfilled requests / valid requests, by corridor and truck | Shows marketplace availability rather than download counts |
| Quote-to-book conversion and cancellation reasons | Separates price, availability and trust problems |
| Repeat completed shipments within 30 days, by customer cohort | Tests recurring value and channel quality |
| On-time pickup/delivery and recipient-confirmed completion | Measures the actual service promise |
| Driver net earning per working hour and empty kilometres | Tests supply sustainability |
| Contribution per completed trip after variable costs | Tests whether volume improves the business |
| Cash dues by age, recovery rate and disputed amount | Shows realized commission collection |
| Digital collection success, uncertain payments and duplicate-event incidents | Tests payment reliability without masking pending results |
| Driver payout timeliness and cash funding requirement | Tests the guarantee and payout promise |
| Damage/shortage claims, cost and resolution time | Captures cargo-specific exposure |
| Support time and acquisition spend per retained customer | Reveals costly manual work and channel economics |

The advisory's ≥95% payment-success and under-1% reconciliation-variance gates can be starting discussion points, not proof of profitability. Report denominators, time windows and absolute money differences. Any unexplained settlement difference should have an owner even when a percentage threshold looks acceptable.

## Suggested experiments after this payment-demo pass

1. Interview a small set of repeat shippers and owner-drivers/fleet owners. Map current prices, loading/waiting charges, payment timing, bad-debt handling and failed-delivery cases. Confirm which corridors and vehicle configurations actually repeat.
2. Test a richer cargo booking and handover prototype: weight/size help, body type, sender/recipient, pickup window, loading option, agreed quote and proof of delivery. Include a non-payment and partial-delivery scenario.
3. Run a controlled operational pilot with a limited vetted supply pool. Use scheduled/repeat shipments to establish predictable demand. Set provisional success criteria before starting and label them as internal test targets.
4. Compare contribution and driver-hour outcomes across transport-only, assisted handling and repeat-business service. Do not decide on a subscription, lower commission or direct telco integration from transaction fees alone.
5. Expand capacity/categories or geography only after reliability, contribution, due recovery and payout funding remain acceptable over repeated cycles.

## Decisions needed

- First cargo segment, corridors and supported vehicle/body configurations.
- Contracting party and payee for owner-driver versus fleet-employed-driver cases.
- Binding quote versus capped estimate, and approved extra-charge rules.
- Delivery evidence and responsibility for cargo damage/shortage.
- Driver guarantee eligibility, customer credit limits, arrears restrictions and deposits.
- Payout cadence, operating reserve and dues-recovery limits.
- Which loading services and business-account benefits can be priced and delivered reliably.

The next prototype investment should make a cargo shipment commercially complete: identify the load and recipient, agree the service and price, record handover, and explain who owes or receives money. The payment fixes establish part of that foundation; the recommendations above remain proposals for product and operating validation.
