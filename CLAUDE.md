# LoadMaster V2

## Keep the Figma designs in sync

Figma screens and journeys are captured from the running apps, not drawn by hand.

- After changing anything users see (`packages/mobile/src`, `apps/admin/src`, app assets), run `npm run capture` and commit the updated `design/handoff/` files with the change. It starts the demo service and web apps if needed, captures every screen, finds new routes, tabs and admin pages automatically, replays the documented journeys and rebuilds `design/handoff/loadmaster-handoff-captured.json`.
- `npm test` fails with "UI code changed since the last capture" until you do.
- A feature that adds a new user flow should also add a journey to `scripts/capture/journeys.mjs` (steps are real actions in the apps; each step is captured).
- New screens appear in Figma under "Detected automatically · not yet documented" until they are described in `design/handoff/spec.mjs` with a capture recipe in `scripts/capture/screens.mjs`.
- Every dialog, tab, menu and confirmation needs its own capture. A new one only needs a recipe with a `doc: { section, name, route, purpose }` field in `scripts/capture/screens.mjs` (see `ADMIN_STATES`); it then appears in that Figma section. Admin pages are captured at full length.
- A journey step can also stand in for a spec screen that has no recipe: add `as: "<spec id>"` to the step.
- Every entry point on the customer Home screen has its own journey with `entry: <n>` (Order a cargo truck, Schedule pickup, Order again, Use a driver ID, Add funds, Loyalty, Referral). They lead the Figma flows page in that order. A new Home entry point needs one too; write each step label as "what the screen shows. Next: the action".
- The capture restarts the demo service if its code changed since it started; demo data survives in `services/demo/data/state.json`.
- Capturing uses the shared demo service on :4000 and creates demo orders, accounts and payouts there.
- The Figma plugin (`design/handoff/plugin`) loads the captured file from GitHub `main`; it only needs redeploying when `code.template.ts` or `ui.template.html` change.
