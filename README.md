# LoadMaster V2

Connected Customer and Driver React Native apps for Android and iOS, plus a React web admin portal built with shadcn/ui. All three use a persistent local demo service. The existing production backend is untouched.

## Run

```sh
npm install
npm run admin:build
npm run demo
```

Open http://localhost:4000/operations for admin. For admin development, run `npm run admin` separately.

In separate terminals:

```sh
npm run emulator
npm run customer:android
npm run driver:android
```

For iOS, install full Xcode and a simulator runtime, then use `npm run customer:ios` and `npm run driver:ios`. Xcode 27.2 is installed and selected. Both iOS simulator apps compile successfully; build outputs are in `artifacts/ios/`. Both apps also passed native simulator sign-in/home/tab-navigation and secure session restoration checks.

Android debug development APKs are available in `artifacts/android/`. They require Metro: run `npm run customer` (8081) and `npm run driver` (8082). `npm run build:android` rebuilds both APKs. Java, Android SDK, emulator and CocoaPods dependencies have been installed in ignored `.toolchains/`; native scripts configure their paths automatically. The APKs target ARM64 devices/emulators.

## Demo accounts

| App | Email | Password |
| --- | --- | --- |
| Customer | alex@example.test | DemoCargo2026! |
| Driver | brian@example.test | DemoCargo2026! |
| Admin / Super Admin | irene@loadmaster.test | DemoCargo2026! |

Mobile sign-in also offers **Explore with a demo account**. Demo registration/recovery OTP is **246810**, displayed by the UI. Android emulator connects to `http://10.0.2.2:4000`; iOS simulator uses `http://localhost:4000`. Configure the service URL from sign-in or account settings. The demo service listens on `127.0.0.1` only; to test from a physical device, start it with `HOST=0.0.0.0 npm run demo` on a trusted network, because demo tokens and recovery codes give anyone who can connect full access. Both apps must reach the same service.

## Included workflows

- Customer: Figma-aligned home and order entry, wallet funding/privacy, authentication, saved places/device location, truck ordering, separate loading/offloading helpers, scheduling, delivery progress, cancellation/issues, payment simulations, receipts, repeat orders, ratings and support.
- Driver: authentication, vehicle/documents with native photo picker, approval eligibility, availability, request acceptance, every delivery phase and handover, earnings, payout requests and support.
- Admin: overview, orders/dispatch/tracking, driver/customer management, document review, collections/refunds, driver payouts/platform guarantees, account transfers/ledger, reconciliation, rewards, support, staff roles, audit, reports and settings.
- Native stack/tab navigation, native date/time and photo pickers, secure token storage, location permissions, haptics and native MapLibre maps. Platform-specific behavior lives alongside shared React Native screens.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run admin:build
npm run test:ios # booted iPhone simulator, API + both Metro servers required
```

All 37 tests pass. `npm run test:ui` validates the connected customer → driver → payment → admin refund journey; it requires the two browser previews on ports 8091/8092 (`npm run preview --workspace @loadmaster/customer` and corresponding driver command), Google Chrome and permission to open loopback ports.

See [native testing](docs/native-testing.md), [build scope](docs/full-build-scope.md) and [validation evidence](audits/v2/validation.md).

## Prototype boundaries

Money, mobile-money/card providers, SMS/OTP delivery, push notifications and driver movement are simulated. Native maps show planned routes, not road-routing or live driver telemetry. Uploads and account records persist locally. Demo accounts/tokens and credentials are intentionally discoverable; this service is for local testing. Real integrations, production security, deployment/signing and provider settlement must be implemented before launch. No real card numbers, PINs or money are required.

## Structure

`apps/customer`, `apps/driver`, `apps/admin`; shared native UI in `packages/mobile`, contracts in `packages/contracts`, demo API/domain in `services/demo`, automated checks in `tests` and `scripts`. Historical documentation and design references are retained.

The package-sending extension includes multi-stop cargo, contacts, PIN handovers, driver-number pairing, order chat, shared tracking, recipient payment links, cash collection/remittance, FlexiPay and external-wallet demo adapters. See [included functionality, exclusions and error recovery](docs/package-sending-reference-review.md).
