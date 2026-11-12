# LoadMaster V2

## Keep the Figma designs in sync

Figma screens and journeys are captured from the running apps, not drawn by hand.

- After changing anything users see (`packages/mobile/src`, `apps/admin/src`, app assets), run `npm run capture` and commit the updated `design/handoff/` files with the change. It starts the demo service and web apps if needed, captures every screen, finds new routes, tabs and admin pages automatically, replays the documented journeys and rebuilds `design/handoff/loadmaster-handoff-captured.json`.
- `npm test` fails with "UI code changed since the last capture" until you do.
- A feature that adds a new user flow should also add a journey to `scripts/capture/journeys.mjs` (steps are real actions in the apps; each step is captured).
- New screens appear in Figma under "Detected automatically · not yet documented" until they are described in `design/handoff/spec.mjs` with a capture recipe in `scripts/capture/screens.mjs`.
- Capturing uses the shared demo service on :4000 and creates demo orders, accounts and payouts there.
- The Figma plugin (`design/handoff/plugin`) loads the captured file from GitHub `main`; it only needs redeploying when `code.template.ts` or `ui.template.html` change.
