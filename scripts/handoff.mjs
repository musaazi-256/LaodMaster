// Validates design/handoff/spec.mjs against the code and builds the Figma
// plugin bundle (design/handoff/plugin/code.ts with the spec embedded).
//
//   npm run handoff          validate + build
//   node scripts/handoff.mjs --check   validate only
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import { spec as source } from "../design/handoff/spec.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(root + p, "utf8");

/** Admin navigation groups parsed from the real sidebar definition. */
export function adminNav() {
  const app = read("apps/admin/src/App.tsx");
  const start = app.indexOf("= [", app.indexOf("const navigation"));
  const block = app.slice(start, app.indexOf("\n  ];", start));
  const groups = [];
  for (const part of block.split(/label: "/).slice(1)) {
    const label = part.slice(0, part.indexOf('"'));
    const items = [...part.matchAll(/path: "([^"]+)",\s*name: "([^"]+)"/g)].map(
      (m) => [m[1], m[2]],
    );
    groups.push([label, items]);
  }
  return groups;
}

export function buildSpec() {
  const spec = structuredClone(source);
  spec.apps.find((a) => a.id === "admin").nav = adminNav();
  spec.generatedAt = new Date().toISOString();
  return spec;
}

/** Returns a list of problems; empty means the spec matches the code. */
export function validate(spec = buildSpec()) {
  const problems = [];
  const nav = read("packages/mobile/src/navigation.ts");
  const stackRoutes = new Set(
    [...nav.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]),
  );
  const tabs = read("packages/mobile/src/Tabs.tsx");
  const contracts = read("packages/contracts/src/index.ts");
  const stages = new Set(
    [
      ...contracts
        .slice(contracts.indexOf("stageLabels"))
        .matchAll(/^\s{2}(\w+):/gm),
    ]
      .map((m) => m[1])
      .slice(0, 11),
  );
  const dispatchType = contracts.slice(
    contracts.indexOf("type DispatchStatus"),
    contracts.indexOf(";", contracts.indexOf("type DispatchStatus")),
  );
  const dispatch = new Set(
    [...dispatchType.matchAll(/"(\w+)"/g)].map((m) => m[1]),
  );
  const platform = read("services/demo/platform.mjs");
  const model = read("services/demo/model.mjs");
  const server = read("services/demo/server.mjs");
  let cargo = "";
  try {
    cargo = read("services/demo/cargo.mjs");
  } catch {
    // older checkouts have no cargo store
  }
  const actions = new Set(
    [...(platform + model + cargo).matchAll(/action === "([\w-]+)"/g)].map(
      (m) => m[1],
    ),
  );
  // Paths the server matches literally, e.g. path === "/admin/cash".
  const literalPaths = new Set(
    [...server.matchAll(/path === "(\/[\w/-]+)"/g)].map((m) => m[1]),
  );
  const orderActions = (server.match(/\[\s*("accept"[\s\S]*?)\]/) || [
    "",
    "",
  ])[1]
    .match(/"(\w+)"/g)
    .map((s) => s.slice(1, -1))
    .concat(
      "admin",
      ...[...server.matchAll(/match\[2\] === "(\w+)"/g)].map((m) => m[1]),
    );
  const adminPaths = new Set(
    spec.apps
      .find((a) => a.id === "admin")
      .nav.flatMap(([, items]) => items.map(([p]) => p)),
  );

  const ids = new Map();
  for (const app of spec.apps)
    for (const section of app.sections)
      for (const s of section.screens) {
        if (ids.has(s.id)) problems.push(`Duplicate screen id ${s.id}`);
        ids.set(s.id, { app: app.id, screen: s });
        const route = s.route.split(/[ (]/)[0];
        if (app.platform === "mobile") {
          const [first, tab] = route.split("/");
          if (first === "Main") {
            if (!tab || !tabs.includes(`"${tab}"`))
              problems.push(`${s.id}: tab "${tab}" is not in Tabs.tsx`);
          } else if (first !== "Auth" && !stackRoutes.has(first))
            problems.push(`${s.id}: route "${first}" is not in RootStack`);
          if (s.tab && !app.tabs.includes(s.tab))
            problems.push(`${s.id}: tab ${s.tab} not in app tabs`);
        } else if (!route.startsWith("/operations") && !adminPaths.has(route))
          problems.push(`${s.id}: admin page "${route}" is not in the sidebar`);
        for (const a of s.actions || []) {
          for (const call of a.api.split(/ · | → /)) {
            const m = call.trim().match(/^(GET|POST) (\/[^\s{(]*)/);
            if (!m) continue;
            const [, , path] = m;
            const parts = path.split("/").filter(Boolean);
            const named = call.match(/\{action:([\w-]+)/);
            if (named && !actions.has(named[1]))
              problems.push(
                `${s.id}: action "${named[1]}" is not handled by the server`,
              );
            const ok =
              literalPaths.has(path) ||
              ([
                "snapshot",
                "admin",
                "quotes",
                "orders",
                "availability",
                "profile",
              ].includes(parts[0]) &&
                parts.length === 1)
                ? true
                : parts[0] === "auth" ||
                    parts[0] === "account" ||
                    parts[0] === "admin"
                  ? actions.has(parts[1])
                  : parts[0] === "orders" && parts[1] === ":id"
                    ? orderActions.includes(parts[2])
                    : false;
            if (!ok)
              problems.push(
                `${s.id}: API "${call.trim()}" has no server handler`,
              );
          }
          for (const h of a.affects || [])
            if (!spec.apps.some((x) => x.id === h.app))
              problems.push(`${s.id}: affects unknown app ${h.app}`);
        }
      }
  for (const app of spec.apps)
    for (const section of app.sections)
      for (const s of section.screens)
        for (const a of s.actions || [])
          for (const h of a.affects || [])
            if (!ids.has(h.screen))
              problems.push(`${s.id}: affects unknown screen ${h.screen}`);
            else if (ids.get(h.screen).app !== h.app)
              problems.push(`${s.id}: ${h.screen} is not in the ${h.app} app`);
  const lanes = ["customer", "system", "driver", "admin"];
  for (const f of spec.flows) {
    f.steps.forEach((st, i) => {
      if (!lanes.includes(st.lane))
        problems.push(`${f.id} step ${i}: lane ${st.lane}`);
      if (st.screen && !ids.has(st.screen))
        problems.push(`${f.id} step ${i}: unknown screen ${st.screen}`);
      if (st.screen && ids.has(st.screen) && ids.get(st.screen).app !== st.lane)
        problems.push(
          `${f.id} step ${i}: ${st.screen} is not a ${st.lane} screen`,
        );
    });
    for (const [a, b] of f.edges)
      if (!f.steps[a] || !f.steps[b])
        problems.push(`${f.id}: edge ${a}→${b} out of range`);
  }
  const known = { "m-order": stages, "m-dispatch": dispatch };
  for (const m of spec.machines) {
    for (const st of m.states)
      if (!known[m.id]?.has(st))
        problems.push(`${m.id}: state ${st} not in contracts`);
    for (const [a, b] of m.transitions)
      if (!m.states.includes(a) || !m.states.includes(b))
        problems.push(`${m.id}: transition ${a}→${b} uses unknown state`);
  }
  return problems;
}

// Drops indentation and full-line comments from the deployed bundle only; the
// readable source stays in code.template.ts.
const compact = (src) =>
  src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"))
    .join("\n");

export function build() {
  const spec = buildSpec();
  const problems = validate(spec);
  if (problems.length) return { spec, problems };
  const json = JSON.stringify(spec);
  writeFileSync(
    root + "design/handoff/loadmaster-handoff.json",
    JSON.stringify(spec, null, 2) + "\n",
  );
  const template = read("design/handoff/plugin/code.template.ts");
  const marker = "/*__SPEC__*/ null";
  if (!template.includes(marker))
    throw new Error("Spec marker missing in code.template.ts");
  writeFileSync(
    root + "design/handoff/plugin/code.ts",
    "// GENERATED by scripts/handoff.mjs from code.template.ts + spec.mjs. Do not edit.\n" +
      compact(template).replace(
        marker,
        process.argv.includes("--embed") ? json : "null",
      ),
  );
  writeFileSync(
    root + "design/handoff/plugin/ui.html",
    read("design/handoff/plugin/ui.template.html").replace(
      "/*__SPEC__*/ null",
      // Wrapped in a template literal so the deployed file stays reviewable.
      "`\n" +
        deflateRawSync(Buffer.from(JSON.stringify(slim(spec))), { level: 9 })
          .toString("base64")
          .replace(/.{1,1000}/g, "$&\n") +
        "`",
    ),
  );
  return { spec, problems };
}

/** Drops empty and default values the renderer doesn't need. */
function slim(value) {
  if (Array.isArray(value)) return value.map(slim);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === "" || (Array.isArray(v) && !v.length)) continue;
    if (k === "v" && v === "primary") continue;
    if (k === "muted" && v === false) continue;
    if (k === "route" && v === true) continue;
    out[k] = slim(v);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const { spec, problems } = check
    ? { spec: buildSpec(), problems: validate() }
    : build();
  if (problems.length) {
    console.error(
      "Handoff spec does not match the code:\n- " + problems.join("\n- "),
    );
    process.exit(1);
  }
  const screens = spec.apps.reduce(
    (n, a) => n + a.sections.reduce((m, s) => m + s.screens.length, 0),
    0,
  );
  console.log(
    `Handoff spec OK · ${screens} screens · ${spec.flows.length} flows · ${spec.machines.length} state machines` +
      (check
        ? ""
        : "\nWrote design/handoff/loadmaster-handoff.json and design/handoff/plugin/code.ts"),
  );
}
