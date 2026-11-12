# V2 connected prototype scope

The V1 Figma files are references for existing terminology, records and operational workflows. The local admin PDF contains a cover page only; the live Figma Drivers, Customers, Auth and Settings sections informed the replacement. V2 uses shadcn/ui for web operations and React Native native navigation/platform services for mobile. The production API remains unchanged and disconnected pending prototype approval.

## Connected behavior

Customer orders are persisted once and offered to eligible online drivers. One driver can accept; capacity, verification and active-work rules are checked by the service. Delivery advances through pickup, loading, transit, arrival, offloading and confirmed handover. Scheduled work becomes available when due. Quotes itemize helpers separately at pickup and destination; fees are visible before ordering.

Collection is separate from driver entitlement. Success, failure and uncertain payment outcomes appear on-screen. Uncertain operations require resolution rather than creating a second charge. Receipts, partial refunds and driver payout status update across roles. Admin can fund an unpaid driver's entitlement from platform reserve, refund an overcharge or make an independent account transfer. Transfers do not silently settle order liabilities. Financial actions require reasons, idempotency keys, sufficient funds and balanced ledger entries; pending actions move no money until confirmed.

Driver documents support upload, review, rejection/resubmission and approval. Replacing a document invalidates eligibility until review. Staff permissions are enforced by the API as well as navigation, including financial redaction. Account support and order issues receive persistent staff replies and mobile notifications. These notifications refresh while foregrounded; they are not OS push notifications.

## Native behavior and remaining integration work

Both applications have separate iOS/Android identifiers and development clients. Native stacks/tabs, keyboard/input behavior, system photo picker/camera permissions, secure storage, date/time selection, haptics and location permissions adapt by platform. Native MapLibre renders a planned map; browser previews use an illustrative fallback. Device search is restricted to the current Kampala demo operating bounds.

Native Android APKs are built for ARM64 and need Metro. iOS projects have been generated; both apps compile with Xcode 27.2 and the iOS 27.2 simulator runtime is installed. Production builds/signing, accessibility/device regression testing, real backend adapters, road-routing/live telemetry, SMS, push, payment providers, provider webhooks and operational controls remain release work rather than simulated prototype functionality.

Native references: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines), [Android design](https://developer.android.com/design/ui/mobile), [native React Navigation tabs](https://reactnavigation.org/docs/native-bottom-tab-navigator/), [MapLibre React Native](https://maplibre.org/maplibre-react-native/docs/).

## Package-sending extension (5 November 2026)

The connected customer wizard, driver delivery workflow and admin cargo operations now include structured multi-stop cargo, contacts, PIN handover, chat, public tracking, recipient payer links, cash, FlexiPay, named external wallets, driver-number pairing and reviewed returns. See [implemented decisions and exclusions](package-sending-reference-review.md). Payment provider execution remains simulated; the existing production backend remains disconnected pending prototype approval.
