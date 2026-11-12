# Mobile UI refinement — 2 November 2026

## What changed

Customer Home now prioritizes booking or the current delivery, followed by compact schedule/rebook actions, a smaller neutral balance card and two recent destinations. A cargo illustration and one primary booking action replace the oversized balance-led layout. Balances remain visible by default and retain account-specific masking/collapse preferences. Active delivery routes are unchanged.

Driver Home prioritizes an active job or incoming request and online availability, followed by earnings and vehicle details. Unverified drivers see verification before their earnings. Removed the unsupported 24–48-hour review promise.

Shared mobile headers and content use consistent spacing and calmer backgrounds. Truck cards separate selection, capacity, description and fare so prices do not squeeze text. Booking has an editable route and context-specific next-step label; receiver details and loading help remain optional. Location controls have keyboard access, and demo locations no longer claim to use GPS.

Customer Payments now shows compact searchable/filterable receipts. Opening a receipt retains payment response/retry actions and full detail. Technical payment references are expandable, and the receipt back action returns to Payments. Earnings copy uses plain language and an explicit empty state. Cash offers no longer misidentify a literal cash method ID as digital.

## Shared styling defect fixed

The default Tailwind class merger misclassified custom font sizes (text-body, text-label, text-small and heading tokens) as text colours. Some composed controls lost text-white, including primary booking buttons. The merger now recognizes all configured typography sizes independently of colours. Added a regression check covering each size token, both argument orders and legitimate overrides. Primary actions use a darker green with white text; navigation uses a darker active green.

## Validation

- Production build, lint and git whitespace checks pass; advisory warnings remain.
- `node tests/ui-tokens.test.mjs` passes.
- Existing isolated PostgreSQL integration suite passes.
- Browser: customer Home booking → demo pickup/recent destination → truck selection; all five truck choices; compact pending payment filter → receipt; customer and driver masking after reload; driver online/offline; iOS and Android previews.
- Verified primary action computed white text on rgb(8,116,67), correcting the prior dark text.
- Saved customer-home-redesign.png and driver-home-redesign.png. Test accounts logged out; isolated preview stopped. No existing user accounts or balances changed.

This is a substantial refinement of the main mobile journeys, not a claim that every native device, edge state or screen has completed usability testing. GPS, payments and notification delivery remain prototype behavior. No dependencies or production provider integrations were added.
