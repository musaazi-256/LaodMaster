# Native testing and demo walkthrough

## Installed toolchain and accounts

Workspace-local Java 21, Android SDK/API 37, ARM64 emulator and CocoaPods 1.16.2 are installed under `.toolchains/`. `npm run emulator` starts the configured emulator. Native scripts set their environment automatically. Xcode 27.2 is installed and selected. The iOS 27.2 simulator runtime is installed and the iPhone 18 Pro simulator is configured.

Run `npm run admin:build` before opening `http://localhost:4000/operations`; `npm run admin` starts the Vite development portal instead. Sign in as `irene@loadmaster.test`. Customer: `alex@example.test`; driver: `brian@example.test`. All seeded passwords are `DemoCargo2026!`. Registration/recovery uses displayed demo OTP `246810`.

Both Android development APKs are in `artifacts/android/`; start each Metro server with `npm run customer` and `npm run driver`. Rebuild with `npm run build:android`.

## Prerequisites

Use Node 22.23 or later compatible with Expo SDK 58. Run `npm install` at the repository root; npm workspaces share the matching native dependencies. Do not install independently inside each app.

For iOS, install full Xcode, its command-line tools, an iOS simulator runtime and CocoaPods. If `xcodebuild -version` says only CommandLineTools is selected, select the installed Xcode developer directory through Xcode Settings or `xcode-select` before building. Expo's [iOS simulator guide](https://docs.expo.dev/workflow/ios-simulator/) explains the host setup.

For Android, install Android Studio, its SDK/platform tools, a compatible JDK and an emulator. Set `ANDROID_HOME` to the installed SDK and make `adb` available. See the [Android emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/). Build commands use the project's SDK requirements rather than a manually chosen older Android platform.

The checked-in app configs are the source of native settings. Expo generates the ignored `ios/` and `android/` directories. This workspace has generated them with `expo prebuild --no-install`; CocoaPods/native compilation still runs on the developer machine. Do not manually patch generated native files when a config plugin can express the change.

## Launch

Terminal 1:

```sh
npm run demo
```

Terminal 2:

```sh
npm run customer:ios
```

Terminal 3:

```sh
npm run driver:android
```

Or choose `customer:android` / `driver:ios`. Both apps can be installed simultaneously: `ug.co.loadmaster.v2.customer` and `ug.co.loadmaster.v2.driver`. Customer Metro port is 8081; Driver is 8082. After first installation use `npm run customer` / `npm run driver` and open the installed development client.

To select a particular device, invoke the app workspace script directly, e.g. `npm run ios --workspace @loadmaster/driver -- --device`.

## Connection

- iOS simulator: `http://localhost:4000`.
- Android Studio emulator: `http://10.0.2.2:4000`.
- Physical devices: `http://<computer LAN IP>:4000`; computer and devices need network reachability and firewall permission for the service and Metro ports.
- Custom ports/hosts: change Account → Demo connection & accounts. The setting persists per app/device.
- Optional build-time default: `EXPO_PUBLIC_DEMO_API_URL` can override the default URL. Never put a private key into an Expo public environment variable.

Both emulator hostnames point to the same running service. The demo service listens on all local interfaces to support physical devices. Do not expose it as a public production service; demo tokens are fixed and intentionally simple.

## Main walkthrough

1. Driver: the sign in as Brian Kato (brian@example.test); this, a verified synthetic driver with a large truck. Turn availability online.
2. Customer: sign in as Alex Mukasa (alex@example.test). Tap Order a truck, choose different pickup/destination locations, then Choose a truck.
3. Select truck, loading helpers at pickup and/or destination, payment method and optional cargo/recipient details. Confirm the itemized price with Order a truck.
4. Driver: the request banner appears during foreground refresh, including when viewing another tab. Open Review request. Check route, capacity, handling, fare, fee and earning. Accept.
5. Customer: order changes from searching to assigned, with the same driver/vehicle. Refreshes occur every two seconds while the app is running. Returning from background triggers a refresh; this is not a push-notification integration.
6. Driver: Head to pickup → Arrived at pickup → Start loading → Loading complete / Start delivery → Arrived at destination → Start offloading.
7. Confirm cargo handover and Complete delivery. Missing/damaged cargo or an absent recipient should use Report an issue rather than a false handover.
8. Customer: Continue to payment. The selected Mobile Money/card method is attached to this delivery. Approve the demo payment; no PIN, real card or money is used.
9. Customer sees a receipt. Driver sees the earning and scheduled payout separately from collection. Admin operations shows the same order and reference.

## Repeatable scenarios

- **Declined or insufficient funds:** expand Demo outcome controls before approval and select that outcome. The failed attempt stays in history. Choose another method or retry, then approve the new attempt.
- **Timeout:** approve with Timeout / no charge. The result is unknown, not paid. Check payment status confirms no charge, then retry safely.
- **Debited / confirmation delayed:** choose this outcome, then Check payment status. It confirms the same attempt and creates no second charge.
- **Competing acceptance:** use a second driver app instance/account (Grace Nambasa). Place a small/medium order. One acceptance wins; the other driver receives an unavailable-request response.
- **Capacity:** Grace's medium truck cannot receive a large request; Brian's large truck can receive all supported prototype categories. Body/special-equipment matching beyond these compatible demo configurations is future work.
- **Offline/busy:** offline drivers get no offers. An assigned driver must finish before accepting another order. Going offline does not abandon accepted cargo.
- **Cancellation:** before loading starts, customer or assigned driver can cancel with a reason. Requests disappear from the other app. After loading starts use Report an issue.
- **Scheduling:** Schedule an order uses native date/time pickers. The request stays scheduled until due and until the customer’s current immediate order finishes; a service refresh then activates it. It is not an advance driver reservation. This prototype does not run a separate background scheduler.
- **Connectivity:** stop the service, attempt an action, then restart. The app shows connection errors without claiming success. Pending order submissions retain the request key locally and are resolved before another order is created.
- **Restart:** service state is saved on each mutation. App relaunch restores the selected account, service URL, route draft and server order history.

## Web operations

Open `http://localhost:4000/operations`. This uses the same local service, with fixed demo-admin access; no production sign-in.

- Search/filter orders and select a row.
- Confirmed collection: issue a full or partial refund to the original demo method, capped at remaining refundable value. Enter a reason and review the confirmation.
- Completed, collected delivery: pay the recorded driver entitlement from settlement.
- Completed, unpaid delivery: pay the recorded entitlement from the platform reserve. Customer debt remains visible. Later collection must not trigger a second payout.
- Audit records and order financial events retain actor, amount, reason, source, destination and time.

This version assumes the platform absorbs a refunded service charge unless a separate driver adjustment is explicitly designed; it does not silently claw back earnings. Fees are applied to the full itemized demo total. These are demo policies to review. Arbitrary transfers, rejected/pending refund and payout simulations, role permissions, reconciliation imports and the full staff portal remain outside this initial operations screen.

## Data and errors

Data is synthetic and stored under ignored `services/demo/data/state.json`. To run with a separate dataset use `DEMO_STATE_PATH=/absolute/path/to/test-state.json npm run demo`. To start over, stop the service and move its data file aside; do not delete it while the service runs. Customer and driver account selectors provide two identities per role. There is no real login or account registration in this prototype.

The API returns `{ error: { code, message } }`; mobile screens display the explanation alongside the relevant action. Important codes: `ROUTE_INVALID`, `HANDLING_INVALID`, `QUOTE_EXPIRED`, `ACTIVE_ORDER`, `DRIVER_UNAVAILABLE`, `DRIVER_BUSY`, `CAPACITY_MISMATCH`, `OFFER_UNAVAILABLE`, `STAGE_CONFLICT`, `HANDOVER_REQUIRED`, `CANCEL_UNAVAILABLE`, `ATTEMPT_PENDING`, `ALREADY_PAID`, `REFUND_LIMIT`, `PAYOUT_UNAVAILABLE`, `INSUFFICIENT_FUNDS`. Connection errors are handled by the client as `CONNECTION_ERROR`. Payment failures also remain in the attempt history; reported cargo/payment issues remain attached to the order.

## Automated checks and evidence

```sh
npm run typecheck
npm run lint
npm test
```

To run the browser walkthrough of the shared React Native screens, start these previews in separate terminals:

```sh
npm run preview --workspace @loadmaster/customer
npm run preview --workspace @loadmaster/driver
```

Then run `npm run test:ui`. It starts its own in-memory service, uses isolated browser contexts and requires Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, or `CHROME_PATH` pointing to an installed compatible browser. Screenshots go to `audits/v2/`. It does not change the normal demo dataset.

Browser checks and native bundle exports do not verify native keyboard behavior, screen-reader behavior, native date/time pickers or installed simulator/emulator binaries. Those require the device testing requested by the owner. Check large text, small screens, Android back, iOS gestures, keyboard avoidance and reconnect/resume on both platforms.

## Verified native builds — 5 November 2026

Both Android ARM64 debug APKs and both iOS simulator `.app` builds compiled successfully. Both Android apps were installed and their authenticated homes/native maps and navigation checked. XCTest passed both iOS apps' sign-in, native home, system tab bar, Orders/Deliveries navigation and secure session restoration after restarting on iPhone 18 Pro / iOS 27.2.

`npm run build:ios` compiles simulator artifacts to `artifacts/ios/` with local ad hoc signing; an Apple developer account is not required for these simulator builds. `npm run customer:ios` and `npm run driver:ios` build/install and start their individual Metro servers. For repeatable native launch checks, boot an iPhone simulator, start `npm run demo`, `npm run customer` and `npm run driver`, then run `npm run test:ios`. It uses the installed local CocoaPods Ruby environment and saves an XCTest result bundle under `.toolchains/`.

The native development builds require Metro. They are not App Store / Play Store release packages.

### Cargo prototype update

Both development apps include `expo-contacts`; rebuild/install the refreshed artifacts before testing the native contact picker. Android's system single-contact picker was exercised from **Cargo & contacts → Choose sender from contacts**; an empty address book shows “No contacts” and can be closed to enter details manually.

The customer flow is pickup/destination → truck/stops → cargo/contacts → payment/pairing → review. Brian's demo pairing number is **2001**; he must be online and accept in the driver app. Cash, FlexiPay and named external wallets are simulated alongside Mobile Money/card. Cash requires driver declaration and payer confirmation; open the order in admin to record remittance.

If the Expo development launcher reports “App react context shouldn't be created before” when reopening an already-running Android development URI, stop the role's process before opening its URI again (`adb shell am force-stop ug.co.loadmaster.v2.customer`, or `.driver`). This is a development-launcher restart issue; no demo account reset is needed. Launch each role using its package explicitly and its Metro port (customer 8081, driver 8082).

### Backup artwork and vector maps

The customer home now has three swipeable, locally bundled cargo-service illustrations when there is no active immediate order. Use the arrow/dot controls or swipe. An active order keeps its tracking hero. Sarah's idle demo account can be used to inspect the slider without cancelling Alex's active test order.

Both native apps use the backup-inspired OpenFreeMap vector style through the shared RouteMap component. Road routing still comes from the shared demo service. Driver positions are simulated; **Show entire route** recenters after panning. These changes require the latest Metro JavaScript/assets, with no additional native dependency. See `backup-mobile-reference.md` for scope and provenance.
