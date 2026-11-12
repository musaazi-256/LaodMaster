# Mobile UI, artwork and map reference — 5 November 2026

Reviewed `/Volumes/MAISHA/Backup LoadMaster V2` as read-only reference. The current React Native apps retain their navigation, account data, connected cargo/order flow and demo service. No backup environment files, credentials, database or old web application were imported.

## Home artwork

The backup's `src/components/logistics/HomeArtworkSlider.jsx` and three original `src/assets/home/*.webp` illustrations informed a native swipeable slider:

- Everyday cargo: A truck for every load.
- Household moves: Moving home? We’ll carry it.
- Business deliveries: Keep your stock moving.

Artwork is bundled locally in `packages/mobile/assets/home`; file sizes and hashes are recorded in `design/backup-home-assets.json`. `HomeArtworkSlider.tsx` implements horizontal paging, previous/next actions, direct slide selectors, selected-state accessibility and reduced-motion behavior. It preserves the home quick actions, wallet and recent activity. Active deliveries continue to show the actual order status instead of the promotional slider.

## Maps

The backup's `MapCanvas.jsx`, `lib/geo.js` and native map proof use MapLibre, OpenFreeMap Liberty vector styles, OSRM road geometry, branded pins/truck artwork and camera fitting. The current native customer and driver maps now share that approach:

- Bundled, themed vector-style JSON with neutral land/buildings, pale green major roads, soft parks/water and restrained labels.
- Existing server-authorized road routing and multi-stop geometry; dashed approximate routes when routing is unavailable.
- Route bounds include road geometry; a **Show entire route** control restores the view after panning.
- A visually simulated truck follows the appropriate route leg and delivery stage. No driver acceptance, location or ETA is invented from the reference screenshots.
- Native location selection, current-location permission and manual place entry remain connected to the current ordering flow.
- Map/network failure stays visible; the location form remains usable. Required provider attribution remains available through MapLibre's controls.

Both native map entry points use `RouteMap.native.tsx`. Web previews retain their explicitly illustrative map rendering. The backup's web worker configuration and DOM marker implementation were not copied into React Native.

Provider reference: [OpenFreeMap quick start and mobile support](https://openfreemap.org/quick_start/). The style was adapted from its public Liberty style and validated with the MapLibre style-spec validator. Route preview remains the existing demo [OSRM route API](https://project-osrm.org/docs/v26.5.0/http/).

## Screenshot patterns adapted

The supplied screenshots inform white rounded sheets, clear status/vehicle cards, easy-to-reach actions, restrained map controls, structured route/payment sections and a reason-led cancellation flow. Shared LoadMaster green (`#087443`), mint, typography, buttons and truck illustrations carry through both mobile apps. Customer home includes a small LoadMaster wordmark; driver home retains its driver identity and pairing number.

Cancellation uses **Cancel order**, a confirmation sheet, required reasons and a keep/wait action. Driver release retains its separate operational wording and eligibility/custody rules. Cancellation reasons are stored separately from failed-handover notes. Reward presentation uses the existing approved-demo-reward flow and does not assert another company's percentage discount or eligibility.

Not adopted: Faras/Bolt branding, passenger/captain terminology, copied phone/contact data, unverified arrival times, false matching progress claims, live-payment assertions or a replica of an OS permission prompt.

## Verification

- TypeScript and ESLint passed.
- 61 service/geometry tests passed, including interpolation around road corners and the correct multi-stop delivery leg.
- Connected browser walkthrough passed, with carousel navigation, visible slide checks, cancellation/reason sheets, two-stop delivery/PIN, payment recovery, refund and cash reconciliation.
- Android emulator verified the styled native vector map, road route, artwork rendering and slide navigation. The original demo account was restored afterwards.
- Native iOS home, map, wallet privacy, tabs and session-restoration checks passed in `.toolchains/ios-smoke-1793856924386.xcresult`; the expanded native carousel walkthrough also passed in `.toolchains/ios-smoke-1793857424174.xcresult`, including household/business slides and restoring the original customer account.

Screenshots include `audits/v2/customer-home.png`, `home-household-slide.png`, `home-business-slide.png`, `cancel-confirmation-sheet.png`, `cancel-reasons-sheet.png`, `backup-vector-map-android.png` and `backup-household-carousel-android.png`.
