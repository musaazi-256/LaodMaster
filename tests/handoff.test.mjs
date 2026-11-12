import test from "node:test";
import assert from "node:assert/strict";
import { buildSpec, validate } from "../scripts/handoff.mjs";

test("the Figma handoff spec matches the app code", () => {
  assert.deepEqual(validate(), []);
});

test("the handoff validator rejects drift from the code", () => {
  const spec = buildSpec();
  const screen = spec.apps[0].sections[1].screens[0];
  screen.route = "NoSuchRoute";
  screen.actions = [
    {
      does: "x",
      api: "POST /account/nope",
      effect: "",
      affects: [{ app: "driver", screen: "c-home", what: "" }],
    },
  ];
  spec.flows[0].steps[0].screen = "missing-screen";
  spec.machines[1].states.push("teleported");
  const problems = validate(spec).join("\n");
  for (const expected of [
    "RootStack",
    "no server handler",
    "not in the driver app",
    "unknown screen missing-screen",
    "teleported",
  ])
    assert.match(problems, new RegExp(expected));
});
