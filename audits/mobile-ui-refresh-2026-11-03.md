# Mobile UI refresh — 3 November 2026

Applied to the working customer and driver prototypes. Figma awaits the user's review of the working app.

## Changes

- Shared mobile screen spacing, platform headers, safe-area action bars and bottom navigation; active tabs have a clear selected state.
- Primary actions at least 48 px high, icon actions at least 44 px (48 px on Android), 16 px form inputs to avoid iOS focus zoom, reduced-motion support and contained scrolling.
- Dialogs and selection sheets portal into their owning phone rather than the desktop document. Sheets support focus trapping, dismissal and restoration of focus to the opener. Works with separate phone contexts in the live demo.
- Country, cargo/body and loading options use mobile selection sheets. Recipient details remain optional. Scheduling remains separate from immediate booking.
- Delivery history uses search, horizontal status chips, compact rows and contextual empty states. Payment history uses receipt rows for both roles before opening detailed records.
- Account menus use grouped, touch-friendly rows; earnings and wallet actions have larger targets.
- Driver Home combines a labelled demo service-area map with a prominent availability action and current job. Active delivery is a map-first screen with a scrollable bottom panel and persistent next-step action. Map camera clearance and attribution account for overlaid panels.
- Home artwork, balance privacy, request dispatch, trip phases and payment simulation remain connected. Screen-originated toasts are placed within their phone.

## Verification

- Production build passes; the existing large-bundle advisory remains.
- Lint completes without errors; repository advisory warnings remain.
- Typography/colour regression check passes.
- PostgreSQL integration suite passes, including optional booking fields, scheduling, truck-capacity dispatch, offline/busy exclusion, synchronized history, cash dues, digital approval/retry, payout and refunds. Uses a temporary schema.
- Browser: country sheet contained in phone; sheet selection and dismissal; focus restored to Estimate price; history and account navigation; driver online/offline action; optional loading selection.
- Fresh browser booking: customer requests Small-Medium cargo; online Medium driver automatically receives request even while in Account; driver accepts; customer changes from searching to assigned tracking. Driver arrival and start-delivery controls advance to steps 2 and 3.
- Responsive browser: customer Home/estimate sheet at 375×812; payment/account at 320×740. Observed document width equals viewport width. Android driver trip layout inspected.

Evidence: `mobile-ui-sheet.png`, `mobile-ui-trips.png`, `mobile-ui-customer-375.png`, `mobile-ui-estimate-375.png`, `mobile-ui-driver-home.png`, `mobile-ui-driver-trip.png`.

## Reference patterns

- Apple: contextual sheets, https://developer.apple.com/design/human-interface-guidelines/sheets
- Apple: stable top-level tab navigation, https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Android: touch targets, https://support.google.com/accessibility/android/answer/7101858

These are browser prototype checks; real-device keyboard and assistive-technology testing remain part of native implementation validation.
