# Customer Home reference implementation

Implemented the latest supplied image as the customer Home direction: greeting and state-aware heading, delivery card with decorative route lines and cargo truck, distinct green booking CTA, schedule/rebook/estimate shortcuts, compact hideable balance with Add funds, and recent completed/cancelled deliveries. Customer navigation now calls the delivery list Trips and uses a truck icon.

Uses actual profile, balance, trip routes, statuses and available demo ETA fields; does not copy the image's UGX 500,000 or 28-minute values. The arrival estimate is explicitly simulated and only appears in transit. Without an active trip, Home shows booking-oriented copy. Recent deliveries come from persisted history, with an honest empty state.

Delivery updates uses an accessible dialog showing current booking state; no connected push service is implied. Estimate price previews existing demo cargo prices for all five truck tiers and hands the selection into booking without creating a trip. Add funds opens the existing demo deposit flow. The earlier balance masking/collapse preferences remain supported.

Verified in an isolated disposable database: active and idle Home states, tracking navigation, updates dialog, estimate changing Medium price to UGX 120,000, and Add funds navigation. Saved reference-home-active.png and reference-home-idle.png. Build, lint, typography regression checks and existing integration checks pass with existing advisory warnings. No real financial actions were taken; existing user accounts were untouched. The page scrolls on compact phones to retain readable text and touch targets.
