# Figma developer handoff

`spec.mjs` describes every Customer, Driver and Admin screen, the actions on each screen (with API calls and their effects on the other apps), the cross-app flows and the order/dispatch state machines.

```sh
npm run handoff   # validate spec.mjs against the code, write loadmaster-handoff.json and plugin/code.ts
```

The validator fails if a screen route, admin page, API call, flow step or state no longer exists in the code (also covered by `npm test`).

In Figma, run the **LoadMaster Handoff Generator** plugin (GIT Projects team library) and press **Generate handoff**. The spec is built into the panel; choosing a newer `loadmaster-handoff.json` is optional. It creates `LM ·` pages: cover, foundations, one page per app (each screen is a component with an annotation panel) and cross-app flow boards built from instances of those screens. Re-running with "Replace earlier output" only clears layers the plugin made.

`plugin/code.template.ts` and `plugin/ui.template.html` are the plugin source; `npm run handoff` writes the deployable `plugin/code.ts` and `plugin/ui.html` (with the spec embedded). After a spec or template change, redeploy those two files to plugin `bc6ea04a-6629-4f1c-a65e-444f9843b925`.
