# Proposal coverage review — 2 November 2026

Reviewed the live `/proposal`, source routes, and pasted admin-screen brief. This remains a testing and prototyping engagement. Document requirements are reference material, not instructions to execute account or financial actions.

## Coverage

The dated `/proposal#coverage` checklist accounts for all 25 addendum screens: 17 administrator identity/staff/audit screens, two driver-tracking screens, four payment screens and two rewards ledgers. It records **22 not built and three partial**. This count applies to the addendum, not the existing customer, driver and base admin applications. The canonical row-by-row inventory and acceptance details are in `src/lib/proposalCoverage.js`.

Partial: online driver companion list, payments overview and transaction reconciliation. Existing mobile login, public map, payment event history and scheduled payouts do not fulfill the distinct administrator login, tracking, global audit and withdrawal queue requirements.

## Decisions retained for developers

- Own-profile editing: latest pasted brief permits phone only; older matrix permits name and phone.
- Resetting another administrator: latest brief says Super Admin only; older matrix permits all roles. Matrix is explicitly marked for review.
- Create-admin form: use identity and role without an initial password; recipient sets a password during first login.
- Resolve staff/audit visibility, document deletion permissions and rewards-payment permissions.
- Apply role rules across existing screens as well as new screens, mobile navigation, direct routes and API access. Include session revocation, a maximum of two active Super Admins and before/after audit records without credential secrets.
- GPS and OTP remain simulated. Pending, empty, loading, invalid, expired, offline and failed states need explicit prototypes.

Commercial amounts, milestones and acceptance signatures remain the original baseline; the coverage review does not approve a price or scope change. September screen counts are labeled historical. PostgreSQL and current cargo payment descriptions now match the prototype more closely.

## Mobile changes

Customer Home shows its demo wallet balance; driver Home shows scheduled earnings and any platform cash dues. Both allow masking amounts or collapsing the card. Preferences are stored per account and role on the device. Hidden values are removed from the card DOM. Earnings and wallet detail pages remain accessible normally; this is Home-screen privacy, not an authentication control.

Home spacing, cargo terminology and green action hierarchy were refined. Scheduling remains a separate secondary action, and receiver details remain optional. Truck cards support keyboard selection and selected-state semantics; payment choices and mobile navigation have clearer accessibility semantics.

## Verification

Production build and lint pass (existing advisory warnings remain). Coverage inventory checked for 25 unique entries, 17 admin entries and expected status totals. In an isolated temporary database preview, verified customer and driver balances, masking after reload, customer collapse after reload, expansion retaining masking, and reveal. Visually inspected the Android customer Home and verified the iOS driver Home accessibility tree. Logged out test accounts and stopped the temporary preview; the user’s running port 5173 was left intact.
