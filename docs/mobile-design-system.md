# Mobile component standards

Customer and driver apps share `packages/mobile/src/mobileDesign.ts`: platform system fonts, semantic text roles, regular body text, semibold labels/section headings, and bold page titles. Text retains React Native system font scaling. Sizes are logical iOS points and Android scale-independent units. The scale adapts to each platform; brand colors remain shared.

| Role | iOS size / line | Android size / line | Weight |
| --- | --- | --- | --- |
| Large title | 34 / 41 | 32 / 41 | 700 |
| Page title | 28 / 34 | 28 / 34 | 700 |
| Headline | 22 / 30 | 24 / 30 | 600 |
| Section | 20 / 26 | 20 / 26 | 600 |
| Body | 17 / 24 | 16 / 24 | 400 |
| Control label | 17 / 24 | 16 / 24 | 600 |
| Supporting text | 15 / 21 | 14 / 21 | 400 |
| Caption | 13 / 18 | 12 / 18 | 400 |

Use shared `Button`, `Field`, `Card`, `CargoButton`, `CargoCard` and `CargoScreen` rather than introducing another size/weight palette. Inputs and primary actions have flexible height; native target minimums are 44 points on iOS and 48 dp on Android. Customer home actions use a two-column grid so labels remain readable. The artwork carousel grows with system font scale.

`MobileModal` wraps native presentation across location selection, stop selection, wallet, cancellations, offers and promotions. Page sheets support native iOS swipe dismissal and Android system Back. Transparent confirmations provide a keyboard-aware scroll surface and safe-area padding so large-text content remains reachable. Only one stage of the cancellation sheet is shown at once. Explicit close/cancel actions remain available. Map tracking panels are scrollable screen content, not draggable modal sheets; they intentionally do not imply native sheet detents.

## Customer home flows

- **Schedule pickup** opens pickup/drop-off selection and native date/time scheduling.
- **Order again** lists every past completed, cancelled or returned trip in newest-first order. Selecting a trip prefills its locations, cargo, contacts, truck and handling. The customer reviews/edits the details and receives a fresh quote before confirming. No trip is submitted just by tapping history.
- **Choose a truck** opens truck capacity selection, then locations, then the existing cargo/contact/payment/review flow. The chosen truck is retained and can be adjusted during review.
- **Match a driver** accepts a driver short number or LoadMaster ID, validates availability, prefills their truck and proceeds through locations and the order flow. The order targets that driver and still requires acceptance. Availability/capacity are rechecked at submission; failure appears on-screen without silent automatic matching.

Support remains accessible through Account. Estimates remain part of the normal quote/review flow.

References: [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Material typography](https://m3.material.io/styles/typography/applying-type), [Android bottom sheets](https://developer.android.com/develop/ui/compose/components/bottom-sheets). These inform the platform-adapted design; this is a React Native implementation, not SwiftUI or Compose.

## Validation (2026-11-05)

- TypeScript and ESLint passed.
- Full service suite: 77 tests passed, including driver-ID resolution and unavailable-driver rejection.
- Connected browser walkthrough passed with new empty-history, truck-first, invalid/valid driver-ID and repeat-trip destination-edit coverage, followed by multi-stop delivery, PIN handover, payment recovery, refunds and cash settlement.
- Native iOS customer/driver smoke passed: `.toolchains/ios-smoke-1793859918115.xcresult`; route selection sheets, wallet sheet, privacy control, artwork and secure session restoration.
- Android emulator: updated home and truck-first selection verified. Native customer apps returned to home after validation. Large accessibility text still merits hands-on device testing across the full app; text scaling remains enabled.

## Visual refinement (2026-11-05)

Home shortcuts now use compact icon rows instead of bordered tiles. Wallet, recent trips and empty states use spacing and dividers. Delivery and offer details use `CargoSection` for continuous content; chat retains message bubbles. Tracking screen panels use a single white surface with a left-aligned heading and no misleading drag handle. Cards remain for genuinely distinct content such as the artwork banner and selection choices.

Verification was deliberately limited to typecheck, lint, a focused browser home/delivery visual check and screenshots of the reloaded iOS and Android homes. Screenshots: `audits/v2/home-flat-actions.png`, `audits/v2/delivery-flat-sections.png`. No full test suite was rerun for this visual-only refinement.
