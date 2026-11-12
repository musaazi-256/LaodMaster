# Figma mobile apps buildout

Built in the existing LoadMaster V2 file, key 4PkOhxFWlUTGb76q0G2Scw. Customer page: 312:3. Driver page: 340:2.

## Review entry points

- Customer iOS: 361:4219. Android: 361:4325.
- Driver iOS: 357:1394. Android: 357:1646.
- Driver incoming offer: 355:185.
- Customer payment approval: 353:1430.

Choose Present and use the named starting flows. The existing authentication page remains separate from the new role-specific journeys. No admin portal screens were added in this mobile-focused task.

## Coverage

Customer: Home idle/active/privacy states; route and location selection; truck/fare confirmation; optional recipient, notes and loading help; payment accounts; searching and assigned driver; transit, arrival, completion and cancellation; scheduled pickup and confirmation; receipts, digital approval/retry/failure, wallet and deposit; estimates, Trips, profile and support.

Driver: offline/online availability; incoming request, decline and unavailable states; busy delivery; pickup/loading/transit/arrival; cash confirmation, completion, digital pending, earnings and cash dues; payout method, account, vehicle documents, verification, support and connection/empty/cancelled states.

## Structure and verification

Read-back audit: 74 customer frames and 50 driver frames, 544 NAVIGATE actions, no broken top-level destinations. Editable text, reusable component instances, SVG vectors and Auto Layout; no complete-screen raster images. Bound colors, spacing and radii reuse file foundations and the shadcn library. Added one strong action color and native text styles; validated SF Pro for iOS and Roboto for Android. Fixed literal newline rendering in component descriptions. Representative screenshots passed after fixes.

Several earlier source Home/history frame IDs stopped resolving during link validation. Rebuilt interactive entry/history frames and resolved all prototype targets to the new top-level frames. Final IDs and audit evidence are in design/figma/mobile-prototype-handoff.json. Initial build records are retained separately for traceability.

## Prototype boundary

Figma simulates transitions with sample data; it does not connect to the database or synchronize two users in real time. Form examples, maps, ETA, document review, deposits and payments are illustrative. The running code prototype remains the source for real customer-to-driver dispatch testing. This task did not modify the running app or its database.
