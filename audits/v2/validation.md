# V2 validation — 5 November 2026

- TypeScript checks: passed for mobile/shared contracts and admin.
- ESLint: passed with zero warnings.
- Automated domain/API suite: 31/31 passed, including competing dispatch, ordering/handling fees, payment uncertainty/idempotency, refund limits, payout guarantees, OTP/session revocation, staff permission redaction, document approval, balanced transfers, reconciliation and support.
- Admin production build: passed (Vite, React, Tailwind, official shadcn/ui components).
- Connected browser walkthrough: passed customer order → driver acceptance → all delivery phases → delayed payment recovery → receipt → reload → admin partial refund. Every admin route also opened successfully. Evidence screenshots are in this directory.
- Android: customer and driver ARM64 debug development APKs compiled successfully and installed on local API 37 ARM64 emulator. Customer and driver authenticated homes, native maps and native tab bars rendered without React Native runtime exceptions. Driver availability and Deliveries navigation were exercised. APKs reside in `artifacts/android/` and require their Metro servers.
- Expo Doctor: 20/20 checks passed for each mobile app.
- Native host dependencies: workspace-local Java 21, Android SDK/build tools/NDK/emulator/system image and CocoaPods 1.16.2 installed. SDK licenses accepted. Dependencies and package lock synchronized.
- iOS: Xcode 27.2 is installed and selected. Both simulator applications compiled successfully with CocoaPods dependencies, including MapLibre and native tabs. Both iOS Hermes bundles exported successfully. App artifacts are in `artifacts/ios/`; XCTest UI smoke passed on iPhone 18 Pro / iOS 27.2: both apps authenticated, rendered their native homes and tab bars, navigated to Orders/Deliveries, and restored secure sessions after app restarts. Simulator builds use ad hoc signing so Keychain entitlements are present. Result bundle: `.toolchains/ios-smoke-1793830656392.xcresult`.

Tests requiring local loopback ports were run with sandbox network permission. Test service data is isolated from normal persisted demo state. No production backend or real payment provider was contacted.

## Figma customer home and order entry — 5 November 2026

Implemented from LoadMaster V2 nodes `361:4219` (home) and `35:389` (order entry), using high-fidelity design context and screenshots. Downloaded all 32 supplied assets into `packages/mobile/assets/figma`; SVG intrinsic sizes are preserved in the asset registry. The header, hero, primary action, four shortcuts, wallet and compact activity layout follow the home reference. The order screen uses the supplied truck image, composited location markers, floating controls and bottom form sheet.

Names, balances, activity and locations come from the demo service. No sample wallet balance or completed trips are presented as real account data. An empty account shows an empty activity state and suggested destinations. Copy uses “Order” instead of “Book”. The operating system renders status bars and native tab navigation; the iOS tab bar therefore follows the installed OS rather than the older flat Figma tab-bar illustration. Both pages retain scalable system fonts, native safe-area spacing and enlarged touch areas for compact visual controls.

Wallet Add funds supports success, failure and pending Mobile Money/card simulations, explicit pending resolution, balanced journal entries and idempotent retries. The privacy toggle persists to account preferences. Wallet funds remain separate from order collections; no payment provider or production backend is connected.

Verification: TypeScript and ESLint pass. All 37 domain/API tests pass. The browser journey passes redesigned home → native-style location picker → truck quote → connected dispatch/delivery → uncertain payment recovery → receipt → admin refund, plus admin route checks. XCTest passes on iPhone 18 Pro / iOS 27.2 for the home, pickup/destination search, continuation to truck selection, pending wallet confirmation, hidden/restored balance and session restoration. Final XCTest result: `.toolchains/ios-smoke-1793832917934.xcresult`. Android home and order entry were also rendered and inspected on the installed emulator. Screenshots: `figma-home-ios.png`, `figma-order-ios.png`, `figma-wallet-hidden-ios.png`, `figma-home-android.png`, `figma-order-android.png`.

Other customer screens and the driver screen designs remain outside this Figma update. Expo's floating developer control is hidden so it cannot cover the app's notification or modal close controls; developer menu shortcuts remain available.

## Package-sending extension — 5 November 2026

- `npm run typecheck`, `npm run lint`, `npm run admin:build`: passed.
- `npm test`: 59 passed, including multi-stop capacity/contact validation, paired-driver eligibility, customer-only PINs, failed-stop custody/return, recipient consent over HTTP, payer-specific refund allocation, wallet retry and cash collection/guarantee/remittance accounting.
- `npm run test:ui`: connected paired two-stop order, PIN handover, all delivery stages, uncertain collection recovery, receipt, partial refund, cash payer confirmation and admin remittance passed. Screenshots include `cargo-contacts-web.png`, `cargo-review-web.png`, `cash-receipt-web.png`, `cash-admin-reconciliation.png`.
- `npm run build:ios` and `npm run build:android`: both customer and driver builds succeeded with Expo Contacts. Development artifacts refreshed under `artifacts/ios` and `artifacts/android`.
- `npm run test:ios`: passed on iPhone 18 Pro / iOS 27.2. Both native homes/tabs and secure session restoration, native location entry, new truck/destinations wizard and wallet pending-resolution flow verified. Result `.toolchains/ios-smoke-1793836207978.xcresult`.
- Android emulator: both refreshed APKs installed; customer native map/location entry and first two wizard steps rendered; driver home displays pairing number 2001. Screenshot `cargo-android-wizard.png`.
- Native maps and contacts are platform modules. Payment execution, driver GPS and message transport remain demo services; no production backend/provider has been connected.
- Android native single-contact picker opened successfully from the new cargo form, displaying the emulator's empty address book. Manual entry remains available on cancellation. Development-launcher restart guidance is recorded in `docs/native-testing.md`.

## SafariNexa-inspired admin table consistency

The local SafariNexa business/admin source and table screenshots were reviewed. LoadMaster's shared shadcn DataTable now provides compact rows, 40px neutral headers, separate operational columns, right-aligned amounts, quiet status badges, 36px toolbar controls, column visibility with staff-specific browser persistence, visible-column CSV and shared pagination. Neutral border/background tokens are consistent across table panels and admin cards.

- Typecheck, ESLint and production admin build passed.
- `node scripts/admin-table-smoke.mjs` passed across 13 sections at desktop/mobile sizes, including saved columns, reset, CSV, search/clear and pagination.
- `npm run test:ui` passed the connected paired two-stop/PIN/payment/refund/cash/remittance workflow after the update.
- Screenshots are under `audits/v2/admin-tables/`; implementation conventions and source references are in `docs/admin-ui.md`.

## LoadMaster admin palette and Trips navigation

The app's exact theme tokens now drive the admin palette. Overview becomes Dashboard; Orders and Driver tracking are merged into the Trips page with two shadcn tabs. Drivers & vehicles and Customers are grouped separately under People & Fleet, retaining their full account tables/details. Legacy routes redirect, while API/permission names stay compatible.

The admin browser check covers exact app color tokens, merged Trips views, desktop/mobile tracking, old-link redirects, staff access, and the previously approved compact-table behavior. The connected delivery/PIN/payment/refund/cash-remittance walkthrough passed with the new Dashboard/Trips terminology. Screenshots include `dashboard-loadmaster-desktop.png`, `trips-tracking-desktop.png` and `trips-tracking-mobile.png` under `audits/v2/admin-tables/`.

## Backup-inspired mobile branding, artwork and maps

External backup read-only reference: `/Volumes/MAISHA/Backup LoadMaster V2`. Three home illustrations were imported with hashes recorded in `design/backup-home-assets.json`. Native MapLibre raster views were consolidated into a shared themed vector map; OSRM road geometry, per-stage/per-stop visual truck position, route fitting and manual location selection remain explicit about simulation and fallback.

Typecheck and lint passed; all 61 service/geometry tests passed. The connected UI walkthrough passed carousel navigation, cancellation confirmation/reasons, two-stop/PIN delivery, uncertain payment recovery, refund and cash reconciliation. MapLibre style-spec validation returned no errors. Android screenshot review confirmed vector roads, full route and the household artwork slide; the original test account was restored. Native iOS checks passed for both homes, map entry, wallet privacy, native tabs and session restoration (result `.toolchains/ios-smoke-1793856924386.xcresult`).

Implementation/reference decisions are documented in `docs/backup-mobile-reference.md`. No production backend/payment/SMS/GPS provider was connected and no copied discount campaign was introduced.

Expanded iOS artwork verification also passed: `.toolchains/ios-smoke-1793857424174.xcresult`, 1 passed / 0 failed. It switches temporarily to the idle Sarah account, browses household/business artwork, restores Alex, then verifies both apps' native tabs and session restoration. Android account selection was also restored after capture.
