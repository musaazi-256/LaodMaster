// LoadMaster Handoff Generator
//
// Draws a developer handoff for the LoadMaster Customer app, Driver app and
// Admin portal: every screen as a component with an annotation panel (route,
// purpose, actions, API calls and their effect on the other apps), cross-app
// flow boards built from instances of those screens, and state machines.
//
// The spec is generated from the codebase by scripts/handoff.mjs as
// design/handoff/loadmaster-handoff.json. Upload it once from the panel; it is
// kept in this plugin's client storage for later runs. (`npm run handoff --
// --embed` bakes it into DEFAULT_SPEC instead.)

/* eslint-disable @typescript-eslint/no-explicit-any -- spec blocks are free-form JSON from loadmaster-handoff.json */
const PANEL_WIDTH = 300;
const RELAUNCH_KEY = "bc6ea04a-6629-4f1c-a65e-444f9843b925";
const OWNER = "lm-handoff";
const STORE_KEY = "lm-handoff-spec";
const DEFAULT_SPEC: any = __SPEC__;

type Parts = {
  foundations: boolean;
  customer: boolean;
  driver: boolean;
  admin: boolean;
  flows: boolean;
};
type UiMessage =
  | { type: "resize"; height: number }
  | { type: "ready" }
  | {
      type: "generate";
      specText?: string;
      parts: Parts;
      notes: boolean;
      replace: boolean;
    };

// ---------------------------------------------------------------- palette
let T: any = {};
// customerTheme tokens for screens marked theme: "cargo".
let CARGO_T: any = {};
const APP_COLOR: Record<string, string> = {
  customer: "#08784D",
  driver: "#2563EB",
  admin: "#7C3AED",
  system: "#475467",
};
const APP_NAME: Record<string, string> = {
  customer: "Customer app",
  driver: "Driver app",
  admin: "Admin portal",
  system: "Demo service",
};

function rgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}
function solid(hex: string, opacity = 1): SolidPaint {
  return { type: "SOLID", color: rgb(hex), opacity };
}
const TONES: Record<string, [string, string]> = {
  green: ["#EAF4ED", "#08784D"],
  amber: ["#FFF4DA", "#8A5911"],
  red: ["#FCEBED", "#A62F37"],
  neutral: ["#EEF1EC", "#56645E"],
  blue: ["#E8F0FE", "#1D4ED8"],
};
function statusTone(value: string): string {
  const v = value.toLowerCase();
  if (/(declin|miss|fail|reject|suspend|inactive|cancel|unexpected|mismatch)/.test(v)) return "red";
  if (/(withdrawn|released|offline|no longer)/.test(v)) return "neutral";
  if (/(pending|request|search|await|unknown|review|offered|open|checking|scheduled)/.test(v)) return "amber";
  return "green";
}

// ---------------------------------------------------------------- fonts & text
const F = {
  r: { family: "Inter", style: "Regular" } as FontName,
  m: { family: "Inter", style: "Medium" } as FontName,
  s: { family: "Inter", style: "Semi Bold" } as FontName,
  b: { family: "Inter", style: "Bold" } as FontName,
};
async function loadFonts(): Promise<void> {
  for (const f of Object.values(F)) await figma.loadFontAsync(f);
}

type TextOpts = {
  size?: number;
  font?: keyof typeof F;
  color?: string;
  lh?: number;
  ls?: number;
  align?: "LEFT" | "CENTER" | "RIGHT";
  upper?: boolean;
};
function text(chars: string, o: TextOpts = {}): TextNode {
  const t = figma.createText();
  t.fontName = F[o.font || "r"];
  t.characters = String(chars ?? "");
  t.fontSize = o.size || 14;
  t.fills = [solid(o.color || T.ink || "#142D28")];
  if (o.lh) t.lineHeight = { value: o.lh, unit: "PERCENT" };
  if (o.ls) t.letterSpacing = { value: o.ls, unit: "PERCENT" };
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.upper) t.textCase = "UPPER";
  t.name = String(chars ?? "").slice(0, 40) || "Text";
  return t;
}

// ---------------------------------------------------------------- auto layout
type Box = {
  w?: number;
  h?: number;
  gap?: number;
  p?: number | [number, number, number, number];
  fill?: string | null;
  fillOpacity?: number;
  r?: number;
  stroke?: string;
  align?: "MIN" | "CENTER" | "MAX";
  justify?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  wrap?: boolean;
  clip?: boolean;
};
function box(name: string, dir: "VERTICAL" | "HORIZONTAL", o: Box = {}): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.fills = o.fill ? [solid(o.fill, o.fillOpacity ?? 1)] : [];
  if (o.w || o.h) f.resize(o.w || 100, o.h || 100);
  if (dir === "VERTICAL") {
    f.primaryAxisSizingMode = o.h ? "FIXED" : "AUTO";
    f.counterAxisSizingMode = o.w ? "FIXED" : "AUTO";
  } else {
    f.primaryAxisSizingMode = o.w ? "FIXED" : "AUTO";
    f.counterAxisSizingMode = o.h ? "FIXED" : "AUTO";
  }
  f.itemSpacing = o.gap ?? 0;
  const p = o.p ?? 0;
  const [pt, pr, pb, pl] = typeof p === "number" ? [p, p, p, p] : p;
  f.paddingTop = pt;
  f.paddingRight = pr;
  f.paddingBottom = pb;
  f.paddingLeft = pl;
  if (o.r) f.cornerRadius = o.r;
  if (o.stroke) {
    f.strokes = [solid(o.stroke)];
    f.strokeWeight = 1;
    f.strokeAlign = "INSIDE";
  }
  f.counterAxisAlignItems = o.align || "MIN";
  f.primaryAxisAlignItems = o.justify || "MIN";
  if (o.wrap && dir === "HORIZONTAL") {
    f.layoutWrap = "WRAP";
    f.counterAxisSpacing = o.gap ?? 0;
  }
  f.clipsContent = !!o.clip;
  return f;
}
/** Append and optionally stretch to the parent's width. */
function add<N extends SceneNode>(parent: FrameNode, child: N, fill = false): N {
  parent.appendChild(child);
  if (fill && "layoutSizingHorizontal" in child) {
    (child as any).layoutSizingHorizontal = "FILL";
    if (child.type === "TEXT") child.textAutoResize = "HEIGHT";
  }
  return child;
}
function para(parent: FrameNode, chars: string, o: TextOpts = {}): TextNode {
  return add(parent, text(chars, { lh: 140, ...o }), true);
}
function spacerRow(parent: FrameNode, gap = 8): FrameNode {
  return add(parent, box("Row", "HORIZONTAL", { gap, align: "CENTER" }), true);
}

// ---------------------------------------------------------------- primitives
function pill(label: string, tone = "green", small = false): FrameNode {
  const [bg, fg] = TONES[tone] || TONES.green;
  const p = box("Badge / " + label, "HORIZONTAL", {
    p: small ? [3, 8, 3, 8] : [5, 10, 5, 10],
    fill: bg,
    r: 999,
    align: "CENTER",
  });
  p.appendChild(text(label, { size: small ? 10 : 11, font: "s", color: fg, ls: 2 }));
  return p;
}
function button(label: string, v = "primary", web = false): FrameNode {
  const primary = v === "primary" || v === "default" || v === undefined;
  const danger = v === "danger";
  const ghost = v === "ghost";
  const b = box("Button / " + label, "HORIZONTAL", {
    h: web ? 38 : 52,
    p: web ? [0, 16, 0, 16] : [0, 18, 0, 18],
    r: web ? 9 : 14,
    fill: primary ? (web ? T.primary : T.green) : "#FFFFFF",
    stroke: primary ? undefined : danger ? (web ? T.destructive : T.red || "#B13B43") : web ? T.border : T.line,
    align: "CENTER",
    justify: "CENTER",
  });
  b.itemSpacing = 8;
  b.appendChild(
    glyphText(label, {
      size: web ? 13 : 15,
      font: "s",
      color: primary ? "#FFFFFF" : danger ? (web ? T.destructive : T.red || "#B13B43") : ghost ? T.green : web ? T.foreground : T.ink,
    }),
  );
  return b;
}
function toggleShape(on: boolean): FrameNode {
  const t = box("Switch", "HORIZONTAL", {
    w: 46,
    h: 28,
    p: 3,
    r: 999,
    fill: on ? T.green : "#D4DCD5",
    justify: on ? "MAX" : "MIN",
    align: "CENTER",
  });
  const k = figma.createEllipse();
  k.resize(22, 22);
  k.fills = [solid("#FFFFFF")];
  t.appendChild(k);
  return t;
}

/**
 * Vector icons (Lucide-style 24 px strokes) drawn with createNodeFromSvg.
 * Unicode symbols such as ⌕ ▢ ◇ 🔔 are missing from Inter and render blank
 * in Figma, so every icon is a real vector layer.
 */
// Filled from spec.icons at generate time (keeps this file under the upload limit).
let ICON_PATHS: Record<string, string> = { dot: '<circle cx="12" cy="12" r="5" fill="C"/>' };
/** Text glyphs used by older specs, mapped to vector icons. */
const GLYPH_ICON: Record<string, string> = {
  "▭": "card", "▣": "wallet", "▤": "package", "✓": "check", "➤": "navigation",
  "⚑": "flag", "⌖": "locate", "●": "dot", "◎": "ring", "◉": "dot", "🏆": "trophy",
};
function icon(name: string, size = 16, color = "#18181B", stroke = 2): FrameNode {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${(ICON_PATHS[name] || ICON_PATHS.dot).replace(/"C"/g, `"${color}"`)}</svg>`;
  const n = figma.createNodeFromSvg(svg);
  n.name = "Icon / " + name;
  n.fills = [];
  n.clipsContent = false;
  n.rescale(size / 24);
  return n;
}
const iconNode = (n: string, size?: number, color?: string, stroke?: number) => icon(n, size, color, stroke);
/** "⌖  Use my location" → [icon] Use my location; plain strings stay text. */
function glyphText(chars: string, o: TextOpts = {}, iconColor?: string): SceneNode {
  const m = String(chars).match(/^(\S{1,2})\s+([\s\S]*)$/);
  const name = m && GLYPH_ICON[m[1]];
  if (!name) return text(chars, o);
  const row = box("Line", "HORIZONTAL", { gap: 8, align: "CENTER" });
  row.appendChild(icon(name, Math.round((o.size || 14) * 1.05), iconColor || o.color || T.ink || "#142D28"));
  row.appendChild(text(m![2], o));
  return row;
}
function circle(size: number, fill: string, stroke?: string): EllipseNode {
  const c = figma.createEllipse();
  c.resize(size, size);
  c.fills = fill === "none" ? [] : [solid(fill)];
  if (stroke) {
    c.strokes = [solid(stroke)];
    c.strokeWeight = 2;
  }
  return c;
}

/** Street-map look of the apps' map: light blocks, white roads, place labels. */
async function mapArt(w: number, h: number, o: any): Promise<FrameNode> {
  const f = figma.createFrame();
  f.name = "Map";
  f.resize(w, h);
  f.cornerRadius = o.wide ? 8 : 16;
  f.fills = [solid("#EEF1F5")];
  f.clipsContent = true;
  for (let i = 0; i < 16; i++) {
    const r = figma.createRectangle();
    r.resize(((i * 41) % 70) + 36, ((i * 29) % 46) + 26);
    r.x = (i * 113) % Math.max(60, w - 40);
    r.y = (i * 71) % Math.max(40, h - 30);
    r.cornerRadius = 2;
    r.fills = [solid("#E1E6ED")];
    f.appendChild(r);
  }
  const paths = [
    `M -10 ${h * 0.28} C ${w * 0.3} ${h * 0.12} ${w * 0.62} ${h * 0.46} ${w + 10} ${h * 0.32}`,
    `M ${w * 0.22} -10 C ${w * 0.34} ${h * 0.4} ${w * 0.12} ${h * 0.7} ${w * 0.28} ${h + 10}`,
    `M -10 ${h * 0.82} C ${w * 0.4} ${h * 0.7} ${w * 0.72} ${h * 0.92} ${w + 10} ${h * 0.74}`,
    `M ${w * 0.7} -10 L ${w * 0.62} ${h + 10}`,
  ];
  for (const [color, weight] of [["#CDD5E0", 11], ["#FFFFFF", 8]] as [string, number][]) {
    const v = figma.createVector();
    v.name = "Roads";
    f.appendChild(v);
    v.vectorPaths = paths.map((data) => ({ windingRule: "NONE" as const, data }));
    v.strokes = [solid(color)];
    v.strokeWeight = weight;
    v.x = -10;
    v.y = -10;
  }
  for (const [label, x, y] of [["KAMPALA", 0.08, 0.16], ["NTINDA", 0.72, 0.1], ["NAKAWA", 0.74, 0.9], ["KOLOLO", 0.06, 0.94]] as [string, number, number][]) {
    const t = text(label, { size: 9, font: "m", color: "#5B6472", ls: 8 });
    f.appendChild(t);
    t.x = x * w;
    t.y = y * h - 6;
  }
  const a = { x: w * 0.3, y: h * 0.66 };
  const b = { x: w * 0.68, y: h * 0.3 };
  if (o.route !== false) {
    const route = figma.createVector();
    f.appendChild(route);
    route.vectorPaths = [{ windingRule: "NONE", data: `M 0 ${a.y - b.y} L ${w * 0.12} ${a.y - h * 0.5} L ${w * 0.25} ${a.y - h * 0.5} L ${b.x - a.x} 0` }];
    route.strokes = [solid(T.green || "#087443")];
    route.strokeWeight = 4;
    route.strokeCap = "ROUND";
    route.strokeJoin = "ROUND";
    route.x = a.x;
    route.y = b.y;
    const p1 = circle(16, "#FFFFFF", T.green || "#087443");
    p1.x = a.x - 8;
    p1.y = a.y - 8;
    f.appendChild(p1);
    const p2 = circle(16, "#3B66F5", "#FFFFFF");
    p2.x = b.x - 8;
    p2.y = b.y - 8;
    f.appendChild(p2);
    if (o.trucks) {
      const t = o.progress ?? 0.35;
      const tr = box("Truck", "HORIZONTAL", { w: 20, h: 20, r: 5, fill: "#2563EB", stroke: "#FFFFFF" });
      f.appendChild(tr);
      tr.x = a.x + (b.x - a.x) * t - 10;
      tr.y = a.y + (b.y - a.y) * t - 10;
    }
  }
  if (o.pulse) {
    const cx = o.route === false ? w / 2 : a.x;
    const cy = o.route === false ? h / 2 : a.y;
    for (const [d, op] of [[Math.min(150, h * 0.6), 0.16], [Math.min(92, h * 0.38), 0.3]] as [number, number][]) {
      const ring = circle(d, "#22A35A");
      ring.opacity = op;
      ring.x = cx - d / 2;
      ring.y = cy - d / 2;
      f.appendChild(ring);
    }
    const dot = circle(16, T.green || "#087443", "#FFFFFF");
    dot.x = cx - 8;
    dot.y = cy - 8;
    f.appendChild(dot);
  }
  if (o.label) {
    const lb = box("Map label", "HORIZONTAL", { p: [6, 12, 6, 10], r: 999, gap: 6, fill: "#FFFFFF", align: "CENTER" });
    lb.appendChild(icon("navigation", 11, T.ink || "#18352B"));
    lb.appendChild(text(o.label, { size: 10, font: "s", color: T.ink || "#18352B", ls: 4 }));
    f.appendChild(lb);
    lb.x = 12;
    lb.y = h - 38;
  }
  if (o.wide) {
    const z = box("Zoom", "VERTICAL", { w: 30, r: 6, fill: "#FFFFFF", stroke: "#D4D4D8", align: "CENTER" });
    for (const n of ["plus", "minus"]) {
      const k = add(z, box("Zoom " + n, "HORIZONTAL", { w: 30, h: 30, align: "CENTER", justify: "CENTER" }));
      k.appendChild(icon(n, 15, "#18181B", 2.5));
    }
    f.appendChild(z);
    z.x = w - 42;
    z.y = 12;
  }
  return f;
}

const MW = 390;
const CW = MW - 40;

function kvRow(parent: FrameNode, k: string, v: string, bold = false, web = false): void {
  const r = add(parent, box("Row / " + k, "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", gap: 12 }), true);
  r.appendChild(text(k, { size: web ? 13 : 14, color: web ? T.mutedText : T.muted }));
  r.appendChild(text(v, { size: web ? 13 : 14, font: bold ? "b" : "s", color: web ? T.foreground : T.ink }));
}
function cardFrame(name: string, web = false): FrameNode {
  const c = box(name, "VERTICAL", { p: web ? 18 : 16, gap: 10, fill: "#FFFFFF", r: web ? 13 : 18, stroke: web ? T.border : T.line });
  if (!web) c.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 2 }, radius: 6, spread: 0, visible: true, blendMode: "NORMAL" }];
  return c;
}

async function mobileBlock(parent: FrameNode, b: any, ctx: any): Promise<void> {
  switch (b.t) {
    case "brand": {
      para(parent, "↗ LoadMaster", { size: 18, font: "b", color: T.green });
      return;
    }
    case "eyebrow":
      para(parent, b.text, { size: 12, font: "b", color: T.muted, ls: 4 });
      return;
    case "title":
      para(parent, b.text, { size: 26, font: "b", lh: 118 });
      return;
    case "body":
      para(parent, b.text, { size: 14, color: b.muted ? T.muted : T.ink });
      return;
    case "link":
      para(parent, b.text, { size: 14, font: "s", color: T.green });
      return;
    case "badge": {
      const r = spacerRow(parent);
      r.appendChild(pill(b.text, b.tone));
      return;
    }
    case "badges": {
      const r = spacerRow(parent);
      r.primaryAxisAlignItems = "SPACE_BETWEEN";
      for (const [label, tone] of b.items) r.appendChild(pill(label, tone));
      return;
    }
    case "btn":
      add(parent, button(b.text, b.v), true);
      return;
    case "field": {
      const f = add(parent, box("Field / " + (b.label || b.ph), "VERTICAL", { gap: 6 }), true);
      if (b.label) para(f, b.label, { size: 12, font: "m", color: T.muted });
      const input = add(f, box("Input", "HORIZONTAL", { h: 50, p: [0, 14, 0, 14], r: 12, fill: "#FFFFFF", stroke: T.line, align: "CENTER" }), true);
      input.appendChild(text(b.value || b.ph || " ", { size: 15, color: b.value ? T.ink : T.muted }));
      return;
    }
    case "banner": {
      const [bg, fg] = TONES[b.tone] || TONES.amber;
      const f = add(parent, box("Banner", "HORIZONTAL", { p: 12, r: 12, fill: bg }), true);
      add(f, text(b.text, { size: 12, font: "s", color: fg, lh: 140 }), true);
      return;
    }
    case "topbanner": {
      const f = add(parent, box("Request banner", "HORIZONTAL", { p: 12, r: 12, fill: T.green, justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      f.appendChild(text(b.text, { size: 12, font: "b", color: "#FFFFFF" }));
      f.appendChild(icon("arrow-right", 16, "#FFFFFF"));
      return;
    }
    case "empty": {
      const f = add(parent, box("Empty state", "VERTICAL", { p: [28, 20, 28, 20], gap: 10, align: "CENTER", fill: "#FFFFFF", r: 18, stroke: T.line }), true);
      f.appendChild(circle(44, T.mint));
      add(f, text(b.title, { size: 17, font: "s", align: "CENTER" }), true);
      add(f, text(b.body, { size: 13, color: T.muted, align: "CENTER", lh: 140 }), true);
      return;
    }
    case "greet": {
      const r = add(parent, box("Greeting", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      const l = box("Hello", "VERTICAL", { gap: 5 });
      l.appendChild(text("LOADMASTER / " + (b.role || "CARGO, CONNECTED"), { size: 12, font: "b", color: T.muted, ls: 4 }));
      l.appendChild(text(`Hello, ${b.name} ↗`, { size: 20, font: "b" }));
      r.appendChild(l);
      const bell = box("Updates", "HORIZONTAL", { w: 43, h: 43, r: 22, fill: T.mint, align: "CENTER", justify: "CENTER" });
      bell.appendChild(icon("bell", 18, T.green));
      r.appendChild(bell);
      return;
    }
    case "section": {
      const r = add(parent, box("Section", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", p: [6, 0, 0, 0] }), true);
      r.appendChild(text(b.text, { size: 16, font: "s" }));
      if (b.link) r.appendChild(text(b.link, { size: 13, font: "s", color: T.green }));
      return;
    }
    case "hero": {
      const f = add(parent, box("Hero", "VERTICAL", { p: 20, gap: 12, r: 22 }), true);
      f.fills = [
        {
          type: "GRADIENT_LINEAR",
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
          gradientStops: [
            { position: 0, color: { ...rgb(T.heroFrom), a: 1 } },
            { position: 1, color: { ...rgb(T.heroTo), a: 1 } },
          ],
        },
      ];
      para(f, b.eyebrow, { size: 11, font: "s", color: T.lime, ls: 6 });
      para(f, b.title, { size: 22, font: "b", color: "#FFFFFF", lh: 120 });
      if (b.body) para(f, b.body, { size: 13, color: "#DDEBE2" });
      if (b.lines || b.rows || b.badge) {
        const inner = add(f, box("Request", "VERTICAL", { p: 16, gap: 10, r: 14, fill: "#FFFFFF" }), true);
        for (const l of b.lines || []) add(inner, glyphText(l, { size: 14, font: "m" }, T.green), !/^\S{1,2}\s/.test(l));
        if (b.badge) {
          const r = spacerRow(inner);
          r.appendChild(pill(b.badge[0], b.badge[1]));
        }
        for (const [k, v] of b.rows || []) kvRow(inner, k, v, true);
        if (b.cta) add(inner, button(b.cta), true);
      } else if (b.cta) {
        const c = add(f, box("CTA", "HORIZONTAL", { h: 48, r: 14, fill: "#FFFFFF", align: "CENTER", justify: "CENTER" }), true);
        c.appendChild(text(b.cta, { size: 15, font: "s", color: T.green }));
      }
      return;
    }
    case "card": {
      const f = add(parent, cardFrame("Card" + (b.label ? " / " + b.label : b.heading ? " / " + b.heading : "")), true);
      if (b.label) para(f, b.label, { size: 11, font: "s", color: T.muted, ls: 6 });
      if (b.heading || b.badge) {
        const hr = add(f, box("Heading", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", gap: 8 }), true);
        const ht = add(hr, text(b.heading || "", { size: 17, font: "b", lh: 130 }));
        ht.layoutGrow = 1;
        ht.textAutoResize = "HEIGHT";
        if (b.badge) hr.appendChild(pill(b.badge[0], b.badge[1], true));
      }
      if (b.title) para(f, b.title, { size: 17, font: "s" });
      if (b.big) para(f, b.big, { size: 26, font: "b", color: b.bigColor === "green" ? T.green : T.ink });
      if (b.chips) {
        const r = spacerRow(f, 8);
        b.chips.forEach((c: string, i: number) => {
          const k = add(r, box("Choice / " + c, "HORIZONTAL", { h: 42, r: 12, fill: i ? "#FFFFFF" : T.mint, stroke: i ? T.line : T.green, align: "CENTER", justify: "CENTER" }));
          k.layoutGrow = 1;
          k.appendChild(text(c, { size: 13, font: "s", color: i ? T.ink : T.green }));
        });
      }
      for (const l of b.lines || []) para(f, l, { size: 14 });
      for (const [k, v] of b.rows || []) kvRow(f, k, v, k === "Total" || /earning|total/i.test(k));
      if (b.stars) {
        const r = spacerRow(f, 6);
        for (let i = 0; i < 5; i++) r.appendChild(icon("star", 26, i < b.stars ? "#E2A400" : T.line, 1.5));
      }
      if (b.btns) {
        const r = spacerRow(f, 10);
        for (const x of b.btns) {
          const bt = add(r, button(x, "ghost"));
          bt.layoutGrow = 1;
        }
      }
      for (const [k, v, ph] of b.fields || []) {
        para(f, k, { size: 11, font: "s", color: T.muted, ls: 6 });
        const multi = /INSTRUCTIONS/.test(k);
        const input = add(f, box("Input / " + k, "HORIZONTAL", { h: multi ? 84 : 50, p: [multi ? 14 : 0, 14, 0, 14], r: 12, fill: "#FFFFFF", stroke: T.line, align: multi ? "MIN" : "CENTER" }), true);
        input.appendChild(text(v || ph || " ", { size: 15, color: v ? T.ink : T.muted }));
      }
      for (const [label, on] of b.toggles || []) {
        const r = add(f, box("Toggle / " + label, "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", gap: 12 }), true);
        const t = add(r, text(label, { size: 14, font: "m", lh: 135 }));
        t.layoutGrow = 1;
        t.textAutoResize = "HEIGHT";
        r.appendChild(toggleShape(!!on));
      }
      if (b.heading2) para(f, b.heading2, { size: 18, font: "b" });
      if (b.note) para(f, b.note, { size: 12, color: T.muted });
      if (b.cta) para(f, b.cta + "  →", { size: 14, font: "s", color: T.green });
      return;
    }
    case "map":
      add(parent, await mapArt(CW, b.h || 200, b), true);
      return;
    case "list": {
      const f = add(parent, box("List", "VERTICAL", { fill: b.plain ? null : "#FFFFFF", r: 18, stroke: b.plain ? undefined : T.line }), true);
      b.items.forEach((it: any, i: number) => {
        const row = add(f, box("Item / " + it.title, "HORIZONTAL", { p: [14, 16, 14, 16], gap: 10, align: "CENTER", stroke: undefined }), true);
        if (b.plain && !it.badge) row.appendChild(icon("pin", 18, T.muted));
        if (i) {
          row.strokes = [solid(T.line)];
          row.strokeTopWeight = 1;
          row.strokeBottomWeight = 0;
          row.strokeLeftWeight = 0;
          row.strokeRightWeight = 0;
        }
        const col = add(row, box("Text", "VERTICAL", { gap: 4 }));
        col.layoutGrow = 1;
        add(col, text(it.title, { size: 14, font: "s" }), true);
        if (it.sub) add(col, text(it.sub, { size: 12, color: T.muted, lh: 135 }), true);
        if (it.badge) row.appendChild(pill(it.badge, it.tone || "neutral", true));
      });
      return;
    }
    case "stats": {
      const r = spacerRow(parent, 10);
      r.counterAxisAlignItems = "MIN";
      for (const [k, v] of b.items) {
        const c = add(r, cardFrame("Stat / " + k));
        c.layoutGrow = 1;
        add(c, text(k, { size: 11, font: "s", color: T.muted, ls: 4, upper: true }), true);
        add(c, text(v, { size: 22, font: "b" }), true);
      }
      return;
    }
    case "steps": {
      const f = add(parent, cardFrame("Delivery stages"), true);
      f.itemSpacing = 12;
      for (const [label, state] of b.items) {
        const r = spacerRow(f, 12);
        r.appendChild(state === "done" ? circle(14, T.green) : state === "now" ? circle(14, "#FFFFFF", T.green) : circle(14, T.line));
        r.appendChild(text(label, { size: 14, font: state === "now" ? "b" : "r", color: state === "todo" ? T.muted : T.ink }));
      }
      return;
    }
    case "menu": {
      const f = add(parent, box("Menu", "VERTICAL", { fill: "#FFFFFF", r: 18, stroke: T.line }), true);
      if (Array.isArray(b.items[0])) {
        f.paddingLeft = f.paddingRight = 16;
        b.items.forEach(([ic, t1, t2]: string[], i: number) => {
          const row = add(f, box("Menu / " + t1, "HORIZONTAL", { p: [15, 0, 15, 0], gap: 14, align: "CENTER" }), true);
          if (i) {
            row.strokes = [solid(T.line)];
            row.strokeTopWeight = 1;
            row.strokeBottomWeight = row.strokeLeftWeight = row.strokeRightWeight = 0;
          }
          row.appendChild(icon(ic, 21, T.green, 1.75));
          const col = add(row, box("Text", "VERTICAL", { gap: 3 }));
          col.layoutGrow = 1;
          add(col, text(t1, { size: 15, font: "s" }), true);
          if (t2) add(col, text(t2, { size: 12, color: T.muted }), true);
          row.appendChild(icon("chevron-right", 18, T.ink));
        });
        if (b.more) {
          const m = add(parent, box("More options", "HORIZONTAL", { p: [6, 0, 6, 0], justify: "SPACE_BETWEEN", align: "CENTER" }), true);
          m.appendChild(text(b.more, { size: 13, color: T.muted }));
          m.appendChild(icon("chevron-down", 18, T.muted));
        }
        if (b.logout) {
          const l = add(parent, box("Log out", "HORIZONTAL", { p: [14, 0, 8, 0], gap: 14, align: "CENTER" }), true);
          l.appendChild(icon("log-out", 20, T.ink, 1.75));
          l.appendChild(text(b.logout, { size: 15, font: "m" }));
        }
        if (b.foot) para(parent, b.foot, { size: 12, color: T.muted });
        return;
      }
      b.items.forEach((label: string, i: number) => {
        const row = add(f, box("Menu / " + label, "HORIZONTAL", { p: [15, 16, 15, 16], justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        if (i) {
          row.strokes = [solid(T.line)];
          row.strokeTopWeight = 1;
          row.strokeBottomWeight = 0;
          row.strokeLeftWeight = 0;
          row.strokeRightWeight = 0;
        }
        row.appendChild(text(label, { size: 15, font: "m", color: label === "Sign out" ? T.red : T.ink }));
        row.appendChild(icon("chevron-right", 18, T.muted));
      });
      return;
    }
    case "toggle": {
      const r = add(parent, box("Toggle / " + b.label, "HORIZONTAL", { p: 16, gap: 12, r: 18, fill: "#FFFFFF", stroke: T.line, justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      const [t1, t2] = String(b.label).split(" · ");
      const t = add(r, box("Text", "VERTICAL", { gap: 4 }));
      t.layoutGrow = 1;
      add(t, text(t1, { size: t2 ? 18 : 14, font: t2 ? "b" : "m", lh: 125 }), true);
      if (t2) add(t, text(t2, { size: 14, color: T.muted, lh: 135 }), true);
      const sw = toggleShape(!!b.on);
      if (b.disabled) sw.opacity = 0.4;
      r.appendChild(sw);
      return;
    }
    case "counter": {
      const r = add(parent, box("Counter / " + b.label, "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      const l = box("Label", "VERTICAL", { gap: 3 });
      l.appendChild(text(b.label, { size: 14, font: "s" }));
      l.appendChild(text(b.value ? `${b.value} helper${b.value > 1 ? "s" : ""}` : "I’ll arrange handling", { size: 12, color: T.muted }));
      r.appendChild(l);
      const c = box("Stepper", "HORIZONTAL", { gap: 8, align: "CENTER" });
      for (const s of ["−", String(b.value), "+"]) {
        if (s === String(b.value)) c.appendChild(text(s, { size: 15, font: "b" }));
        else {
          const k = box(s === "+" ? "Add" : "Remove", "HORIZONTAL", { w: 42, h: 42, r: 12, stroke: T.line, fill: "#FFFFFF", align: "CENTER", justify: "CENTER" });
          k.appendChild(icon(s === "+" ? "plus" : "minus", 18, T.ink));
          c.appendChild(k);
        }
      }
      r.appendChild(c);
      return;
    }
    case "radio": {
      if (b.label) para(parent, b.label, { size: 11, font: "s", color: T.muted, ls: 6 });
      b.items.forEach(([t1, t2]: string[], i: number) => {
        const sel = i === b.sel;
        const r = add(parent, box("Option / " + t1, "HORIZONTAL", { p: 14, gap: 12, r: 16, fill: sel ? "#F0F7EA" : "#FFFFFF", stroke: sel ? T.green : T.line, align: "CENTER" }), true);
        if (sel) r.strokeWeight = 2;
        r.appendChild(sel ? circle(18, T.green) : circle(18, "#FFFFFF", T.line));
        const col = add(r, box("Text", "VERTICAL", { gap: 3 }));
        col.layoutGrow = 1;
        add(col, text(t1, { size: 15, font: "s" }), true);
        if (t2) add(col, text(t2, { size: 12, color: T.muted }), true);
      });
      return;
    }
    case "chips": {
      if (b.label) para(parent, b.label, { size: 12, font: "m", color: T.muted });
      const r = add(parent, box("Chips", "HORIZONTAL", { gap: 8, wrap: true }), true);
      b.items.forEach((c: string, i: number) => {
        const on = i === b.sel;
        const k = box("Chip / " + c, "HORIZONTAL", { p: [10, 12, 10, 12], r: 12, fill: on ? (b.wrap ? T.mint : T.ink) : "#FFFFFF", stroke: on && b.wrap ? T.green : T.line });
        k.appendChild(text(c, { size: 12, font: "s", color: on && !b.wrap ? "#FFFFFF" : T.ink }));
        r.appendChild(k);
      });
      return;
    }
    case "otp": {
      const r = spacerRow(parent, 8);
      for (const d of String(b.value)) {
        const k = box("Digit", "HORIZONTAL", { w: 48, h: 56, r: 12, fill: "#FFFFFF", stroke: T.line, align: "CENTER", justify: "CENTER" });
        k.appendChild(text(d, { size: 22, font: "b" }));
        r.appendChild(k);
      }
      return;
    }
    case "greet2": {
      const r = add(parent, box("Greeting", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      const l = add(r, box("Hello", "VERTICAL", { gap: 4 }));
      l.layoutGrow = 1;
      if (b.brand) add(l, text(b.brand, { size: 16, font: "b", color: T.green }), true);
      add(l, text(b.hello, { size: 15, font: "s", color: T.muted }), true);
      add(l, text(b.title, { size: b.brand ? 20 : 24, font: "b", lh: 120 }), true);
      const bell = box("Notifications", "HORIZONTAL", { w: 44, h: 44, r: 22, fill: "#FFFFFF", stroke: T.line, align: "CENTER", justify: "CENTER" });
      bell.appendChild(icon("bell", 18, T.ink));
      r.appendChild(bell);
      return;
    }
    case "promo": {
      const f = add(parent, box("Promo", "VERTICAL", { p: 20, gap: 10, r: 22 }), true);
      f.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { ...rgb("#E3F5EA"), a: 1 } }, { position: 1, color: { ...rgb(T.mint), a: 1 } }] }];
      const p = spacerRow(f, 6);
      const pl = box("Pill", "HORIZONTAL", { p: [4, 10, 4, 10], r: 999, fill: "#D7F0DF", gap: 6, align: "CENTER" });
      pl.appendChild(circle(6, T.green));
      pl.appendChild(text(b.pill, { size: 11, font: "s", color: T.green }));
      p.appendChild(pl);
      para(f, b.title, { size: 21, font: "b" });
      const row = add(f, box("Row", "HORIZONTAL", { gap: 12, align: "MAX" }), true);
      const t = add(row, text(b.body, { size: 13, color: T.muted, lh: 145 }));
      t.layoutGrow = 1;
      t.textAutoResize = "HEIGHT";
      const tile = box("Truck", "HORIZONTAL", { w: 60, h: 60, r: 14, fill: "#FFFFFF", fillOpacity: 0.7, align: "CENTER", justify: "CENTER" });
      tile.appendChild(icon("truck", 28, T.green, 1.75));
      row.appendChild(tile);
      return;
    }
    case "ctabar": {
      const f = add(parent, box("Primary action", "HORIZONTAL", { p: 16, gap: 14, r: 18, fill: T.green, align: "CENTER" }), true);
      const ic = box("Icon", "HORIZONTAL", { w: 40, h: 40, r: 10, fill: "#FFFFFF", fillOpacity: 0.16, align: "CENTER", justify: "CENTER" });
      ic.appendChild(icon(b.icon || "pin", 20, "#FFFFFF"));
      f.appendChild(ic);
      const col = add(f, box("Text", "VERTICAL", { gap: 2 }));
      col.layoutGrow = 1;
      add(col, text(b.title, { size: 17, font: "b", color: "#FFFFFF" }), true);
      if (b.sub) add(col, text(b.sub, { size: 12, color: "#DDF3E6" }), true);
      f.appendChild(icon("arrow-right", 20, "#FFFFFF"));
      return;
    }
    case "tiles": {
      const r = spacerRow(parent, 8);
      r.counterAxisAlignItems = "MIN";
      for (const label of b.items) {
        const tl = add(r, box("Tile / " + label, "VERTICAL", { p: [14, 6, 14, 6], gap: 8, r: 16, fill: "#FFFFFF", stroke: T.line, align: "CENTER" }));
        tl.layoutGrow = 1;
        const tileIcons: Record<string, string> = { schedule: "calendar", order: "history", choose: "truck", match: "user-plus", estimate: "tag", support: "support" };
        tl.appendChild(icon(tileIcons[String(label).split(/\s/)[0].toLowerCase()] || "dot", 24, T.green, 1.75));
        add(tl, text(label, { size: 12, font: "s", align: "CENTER", lh: 125 }), true);
      }
      return;
    }
    case "wallet": {
      const f = add(parent, cardFrame("Wallet"), true);
      const top = add(f, box("Top", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      top.appendChild(glyphText("▣  " + b.label, { size: 13, color: T.muted }));
      top.appendChild(icon("eye", 16, T.muted));
      const row = add(f, box("Row", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      row.appendChild(text(b.value, { size: 22, font: "b" }));
      const pl = box("Add funds", "HORIZONTAL", { p: [9, 14, 9, 14], r: 999, fill: T.mint });
      pl.appendChild(text(b.cta, { size: 13, font: "s", color: T.green }));
      row.appendChild(pl);
      return;
    }
    case "h":
      para(parent, b.text, { size: 17, font: "b" });
      return;
    case "titlebadge": {
      const r = add(parent, box("Title", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MIN", gap: 10 }), true);
      const t = add(r, text(b.text, { size: 27, font: "b", lh: 112 }));
      t.layoutGrow = 1;
      t.textAutoResize = "HEIGHT";
      r.appendChild(pill(b.badge, b.badge === "ONLINE" ? "green" : "neutral"));
      return;
    }
    case "chat": {
      const f = add(parent, box("Messages", "VERTICAL", { gap: 10 }), true);
      for (const [who, msg] of b.items) {
        const row = add(f, box("Message", "HORIZONTAL", { justify: who === "me" ? "MAX" : "MIN" }), true);
        const bub = box("Bubble", "HORIZONTAL", { p: [10, 14, 10, 14], r: 16, fill: who === "me" ? T.green : "#FFFFFF", stroke: who === "me" ? undefined : T.line });
        bub.appendChild(text(msg, { size: 14, color: who === "me" ? "#FFFFFF" : T.ink }));
        row.appendChild(bub);
      }
      return;
    }
    case "carousel": {
      // HomeArtworkSlider: label pill, headline, body, photo artwork, arrows and dots.
      const f = add(parent, box("Artwork / " + b.pill, "VERTICAL", { h: 262, p: [18, 18, 14, 18], gap: 10, r: 22, fill: "#E9F5EE", stroke: "#D8EBDF", clip: true }), true);
      const art = box("Artwork photo", "HORIZONTAL", { w: 170, h: 140, r: 14, fill: "#CFE5D7", align: "CENTER", justify: "CENTER" });
      art.appendChild(icon(b.art || "truck", 80, T.green, 1.25));
      f.appendChild(art);
      art.layoutPositioning = "ABSOLUTE";
      art.x = CW - 182;
      art.y = 52;
      const pl = add(f, box("Pill", "HORIZONTAL", { p: [5, 10, 5, 10], r: 999, fill: "#FFFFFF", stroke: "#BFE3CB", gap: 6, align: "CENTER" }));
      pl.appendChild(circle(6, T.green));
      pl.appendChild(text(b.pill, { size: 12, font: "s", color: T.green }));
      const tt = add(f, text(b.title, { size: 26, font: "b", lh: 112 }));
      tt.resize(170, tt.height);
      tt.textAutoResize = "HEIGHT";
      const bd = add(f, text(b.body, { size: 12, color: "#33413B", lh: 140 }));
      bd.resize(150, bd.height);
      bd.textAutoResize = "HEIGHT";
      const nav = box("Controls", "HORIZONTAL", { w: CW - 36, justify: "SPACE_BETWEEN", align: "CENTER" });
      f.appendChild(nav);
      nav.layoutPositioning = "ABSOLUTE";
      nav.x = 18;
      nav.y = 204;
      const btn = (n: string, on: boolean) => {
        const k = box(n, "HORIZONTAL", { w: 42, h: 42, r: 21, fill: "#FFFFFF", fillOpacity: on ? 1 : 0.6, align: "CENTER", justify: "CENTER" });
        k.appendChild(icon(n, 18, on ? T.ink : "#9CA3AF"));
        return k;
      };
      nav.appendChild(btn("chevron-left", false));
      const dots = box("Dots", "HORIZONTAL", { p: [10, 14, 10, 14], gap: 8, r: 999, fill: "#FFFFFF", fillOpacity: 0.7, align: "CENTER" });
      for (let i = 0; i < 3; i++) dots.appendChild(box("Dot", "HORIZONTAL", { w: i === (b.at || 0) ? 20 : 6, h: 6, r: 3, fill: i === (b.at || 0) ? T.ink : "#9CA3AF" }));
      nav.appendChild(dots);
      nav.appendChild(btn("chevron-right", true));
      return;
    }
    case "search": {
      const r = add(parent, box("Search", "HORIZONTAL", { h: 46, p: [0, 16, 0, 16], gap: 10, r: 999, fill: "#FFFFFF", stroke: T.line, align: "CENTER" }), true);
      r.appendChild(icon("search", 18, T.muted));
      r.appendChild(text(b.ph, { size: 15, color: T.muted }));
      return;
    }
    case "tabsline": {
      const r = add(parent, box("Tabs", "HORIZONTAL", { gap: 18, align: "MAX" }), true);
      r.strokes = [solid(T.line)];
      r.strokeTopWeight = r.strokeLeftWeight = r.strokeRightWeight = 0;
      r.strokeBottomWeight = 1;
      b.items.forEach((label: string, i: number) => {
        const on = i === (b.sel || 0);
        const t = box("Tab / " + label, "VERTICAL", { p: [0, 2, 10, 2] });
        if (on) {
          t.strokes = [solid(T.green)];
          t.strokeTopWeight = t.strokeLeftWeight = t.strokeRightWeight = 0;
          t.strokeBottomWeight = 2;
        }
        t.appendChild(text(label, { size: 13, font: on ? "s" : "r", color: on ? T.green : T.muted }));
        r.appendChild(t);
      });
      return;
    }
    case "ordercards": {
      for (const it of b.items) {
        const c = add(parent, cardFrame("Order / " + it.id), true);
        const hd = add(c, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        hd.appendChild(text(it.id, { size: 13, font: "b", color: T.muted }));
        hd.appendChild(pill(it.badge, it.tone || "green"));
        [it.from, it.to].forEach((place: string, i: number) => {
          const row = add(c, box("Stop", "HORIZONTAL", { gap: 12, align: "CENTER" }), true);
          row.appendChild(circle(12, "#FFFFFF", i ? "#3B66F5" : T.green));
          row.appendChild(text(place, { size: 14, font: "s", color: i ? "#2F5BD9" : T.ink }));
        });
        const ft = add(c, box("Foot", "HORIZONTAL", { p: [10, 0, 0, 0], justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        ft.strokes = [solid(T.line)];
        ft.strokeTopWeight = 1;
        ft.strokeBottomWeight = ft.strokeLeftWeight = ft.strokeRightWeight = 0;
        ft.appendChild(text(it.price, { size: 17 }));
        ft.appendChild(icon("arrow-right", 18, T.green));
      }
      return;
    }
    case "profilehead": {
      const r = add(parent, box("Profile", "HORIZONTAL", { gap: 14, align: "CENTER", p: [4, 0, 8, 0] }), true);
      const av = box("Avatar", "HORIZONTAL", { w: 54, h: 54, r: 27, fill: T.mint, align: "CENTER", justify: "CENTER" });
      av.appendChild(text(b.initials, { size: 18, font: "b", color: T.green }));
      r.appendChild(av);
      const col = add(r, box("Text", "VERTICAL", { gap: 3 }));
      col.layoutGrow = 1;
      col.appendChild(text(b.name, { size: 17, font: "b" }));
      col.appendChild(text(b.sub, { size: 13, color: T.muted }));
      r.appendChild(icon("chevron-right", 20, T.muted));
      return;
    }
    case "payact": {
      for (const it of b.items) {
        const c = add(parent, cardFrame("Payment / " + it.amount), true);
        const top = add(c, box("Top", "HORIZONTAL", { gap: 12, align: "CENTER" }), true);
        const ic = box("Icon", "HORIZONTAL", { w: 46, h: 46, r: 23, fill: T.mint, align: "CENTER", justify: "CENTER" });
        ic.appendChild(icon(it.icon || "phone", 20, T.green, 1.75));
        top.appendChild(ic);
        const col = add(top, box("Text", "VERTICAL", { gap: 3 }));
        col.layoutGrow = 1;
        col.appendChild(text(it.amount, { size: 16, font: "b" }));
        col.appendChild(text(it.sub, { size: 12, color: T.muted }));
        top.appendChild(icon("chevron-right", 18, T.ink, 2.25));
        if (it.badge) add(c, box("Badges", "HORIZONTAL", {}), true).appendChild(pill(it.badge, it.tone || "green"));
        if (it.note) para(c, it.note, { size: 12, color: T.muted });
      }
      return;
    }
    case "progress": {
      const t = add(parent, box("Progress", "HORIZONTAL", { h: 8, r: 4, fill: "#E5E7EB", clip: true }), true);
      t.appendChild(box("Done", "HORIZONTAL", { w: Math.max(8, CW * (b.value ?? 1)), h: 8, r: 4, fill: "#16A34A" }));
      return;
    }
    case "drivercard": {
      const c = add(parent, box("Driver", "HORIZONTAL", { p: 16, gap: 16, r: 14, fill: "#EEF8F1", stroke: "#86C99B", align: "CENTER" }), true);
      c.appendChild(icon(b.icon || "truck", 40, T.green, 1.5));
      const col = add(c, box("Text", "VERTICAL", { gap: 4 }));
      col.layoutGrow = 1;
      col.appendChild(text(b.title, { size: 15, font: "b" }));
      col.appendChild(text(b.sub, { size: 13, color: T.muted }));
      return;
    }
    case "routeline": {
      if (b.title) para(parent, b.title, { size: 20, font: "b" });
      const f = add(parent, box("Route", "VERTICAL", { gap: 14 }), true);
      b.stops.forEach(([label, name, area]: string[], i: number) => {
        const blue = i === b.stops.length - 1;
        const row = add(f, box("Stop / " + label, "HORIZONTAL", { gap: 14 }), true);
        row.appendChild(circle(14, "#FFFFFF", blue ? "#3B66F5" : T.green));
        const col = add(row, box("Text", "VERTICAL", { gap: 2 }));
        col.appendChild(text(label, { size: 13, font: "s", color: T.muted }));
        col.appendChild(text(name, { size: 15, font: "s", color: blue ? "#2F5BD9" : T.ink }));
        if (area) col.appendChild(text(area, { size: 12, color: T.muted }));
      });
      return;
    }
    case "footer":
      ctx.footer = b;
      return;
    case "sheet":
      ctx.sheet = b;
      return;
    case "celebrate":
      ctx.celebrate = b;
      return;
    case "nav":
      return; // rendered by the screen header
    default:
      para(parent, `[${b.t}]`, { size: 12, color: T.muted });
  }
}

/** Success confirmation from packages/mobile/src/celebrate.tsx. */
async function celebrationOverlay(f: FrameNode, c: any): Promise<void> {
  const dim = figma.createRectangle();
  dim.name = "Scrim";
  f.appendChild(dim);
  dim.layoutPositioning = "ABSOLUTE";
  dim.resize(MW, f.height);
  dim.x = 0;
  dim.y = 0;
  dim.fills = [solid("#111827", 0.45)];
  const gold = c.tone === "gold";
  const ring = gold ? "#FEF3C7" : "#DCF5E7";
  const fill = gold ? "#D97706" : "#087443";
  const card = box("Celebration / " + c.title, "VERTICAL", { w: MW - 56, p: [30, 22, 18, 22], gap: 6, r: 24, fill: "#FFFFFF", align: "CENTER" });
  f.appendChild(card);
  card.layoutPositioning = "ABSOLUTE";
  const badge = box("Badge", "HORIZONTAL", { w: 92, h: 92, r: 46, fill: ring, align: "CENTER", justify: "CENTER" });
  const inner = box("Icon", "HORIZONTAL", { w: 64, h: 64, r: 32, fill, align: "CENTER", justify: "CENTER" });
  inner.appendChild(icon(c.icon || GLYPH_ICON[c.glyph] || "check", 30, "#FFFFFF", 2.25));
  badge.appendChild(inner);
  card.appendChild(badge);
  const sp = box("Gap", "VERTICAL", { h: 8 });
  card.appendChild(sp);
  card.appendChild(text(c.title, { size: 20, font: "b", align: "CENTER" }));
  if (c.message) {
    const m = add(card, text(c.message, { size: 15, color: T.muted, align: "CENTER", lh: 140 }), true);
    m.textAlignHorizontal = "CENTER";
  }
  if (c.milestone) {
    const pillBox = box("Milestone", "HORIZONTAL", { p: [6, 12, 6, 12], gap: 6, r: 999, fill: gold ? "#FFFBEB" : "#EEF7F2", align: "CENTER" });
    pillBox.appendChild(icon("trophy", 14, gold ? "#92400E" : "#087443"));
    pillBox.appendChild(text(c.milestone, { size: 13, font: "s", color: gold ? "#92400E" : "#087443" }));
    card.appendChild(pillBox);
  }
  const gap2 = box("Gap", "VERTICAL", { h: 12 });
  card.appendChild(gap2);
  const cta = add(card, box("Button / " + (c.cta || "Continue"), "HORIZONTAL", { h: 50, r: 14, fill: "#087443", align: "CENTER", justify: "CENTER" }), true);
  cta.appendChild(text(c.cta || "Continue", { size: 16, font: "s", color: "#FFFFFF" }));
  // Confetti burst around the badge (animated in the app).
  const colors = ["#087443", "#34D399", "#FBBF24", "#3B82F6", "#F472B6", "#A3E635"];
  for (let i = 0; i < 18; i++) {
    const r = figma.createRectangle();
    const sz = 6 + (i % 4) * 2;
    r.resize(sz, i % 3 === 0 ? sz : sz * 0.45);
    r.cornerRadius = i % 3 === 0 ? sz : 2;
    r.rotation = (i * 47) % 180;
    r.fills = [solid(colors[i % colors.length])];
    card.appendChild(r);
    r.layoutPositioning = "ABSOLUTE";
    const ang = (i / 18) * Math.PI * 2;
    r.x = (MW - 56) / 2 + Math.cos(ang) * (70 + (i % 3) * 18);
    r.y = 76 + Math.sin(ang) * (52 + (i % 4) * 10);
  }
  card.x = 28;
  card.y = Math.max(120, (Math.min(f.height, 844) - card.height) / 2);
}

async function mobileScreen(app: any, s: any): Promise<FrameNode> {
  const saved = T;
  if (s.theme === "cargo") T = { ...T, ...CARGO_T };
  try {
    return await drawMobileScreen(app, s);
  } finally {
    T = saved;
  }
}
async function drawMobileScreen(app: any, s: any): Promise<FrameNode> {
  // Hugs its content so long screens show in full; short ones are padded to 844 below.
  const f = box(s.name, "VERTICAL", { w: MW, fill: T.paper, clip: true });
  // status bar
  const sb = add(f, box("Status bar", "HORIZONTAL", { h: 44, p: [0, 24, 0, 28], justify: "SPACE_BETWEEN", align: "CENTER" }), true);
  sb.appendChild(text("9:41", { size: 15, font: "s" }));
  const sig = box("Signal", "HORIZONTAL", { gap: 6, align: "CENTER" });
  sig.appendChild(icon("signal", 16, T.ink));
  sig.appendChild(icon("battery", 22, T.ink));
  sb.appendChild(sig);
  const nav = (s.blocks || []).find((b: any) => b.t === "nav");
  if (nav && nav.flat) {
    const h = add(f, box("Header / " + nav.title, "HORIZONTAL", { h: 52, p: [0, 16, 0, 16], align: "CENTER", gap: 16, fill: "#F1F2F4" }), true);
    h.appendChild(icon("arrow-left", 22, T.ink));
    h.appendChild(text(nav.title, { size: 16, font: "s" }));
  } else if (nav && (nav.sub || nav.close || s.theme === "cargo")) {
    const h = add(f, box("Header / " + nav.title, "HORIZONTAL", { p: [12, 20, 14, 20], align: "CENTER", gap: 14, fill: "#FFFFFF" }), true);
    h.strokes = [solid(T.line)];
    h.strokeTopWeight = 0;
    h.strokeLeftWeight = 0;
    h.strokeRightWeight = 0;
    h.strokeBottomWeight = 1;
    if (!nav.close) h.appendChild(icon("arrow-left", 22, T.ink));
    const col = add(h, box("Title", "VERTICAL", { gap: 3 }));
    col.layoutGrow = 1;
    add(col, text(nav.title, { size: 20, font: "b" }), true);
    if (nav.sub) add(col, text(nav.sub, { size: 13, color: T.muted }), true);
    if (nav.close) h.appendChild(icon("x", 20, T.ink));
  } else if (nav) {
    const h = add(f, box("Header / " + nav.title, "HORIZONTAL", { h: 48, p: [0, 16, 0, 16], align: "CENTER", gap: 8 }), true);
    h.appendChild(icon("chevron-left", 24, T.ink));
    const t = add(h, text(nav.title, { size: 14, font: "s", align: "CENTER" }));
    t.layoutGrow = 1;
    h.appendChild(text(" ", { size: 26 }));
  }
  const content = add(f, box("Content", "VERTICAL", { p: [12, 20, 24, 20], gap: 14 }), true);
  const ctx: any = {};
  for (const b of s.blocks || []) await mobileBlock(content, b, ctx);
  if (ctx.footer) {
    const ft = add(f, box("Footer", "VERTICAL", { p: [14, 16, 26, 16], gap: 10, fill: "#FFFFFF", align: "CENTER" }), true);
    ft.strokes = [solid(T.line)];
    ft.strokeTopWeight = 1;
    ft.strokeBottomWeight = 0;
    ft.strokeLeftWeight = 0;
    ft.strokeRightWeight = 0;
    if (ctx.footer.value) ft.appendChild(text(ctx.footer.value, { size: 20, font: "b", align: "CENTER" }));
    add(ft, button(ctx.footer.cta), true);
    if (ctx.footer.secondary) add(ft, button(ctx.footer.secondary, "ghost"), true);
  }
  if (s.tab) {
    const bar = add(f, box("Tab bar", "HORIZONTAL", { h: 80, p: [8, 12, 22, 12], fill: "#FFFFFF", justify: "SPACE_BETWEEN" }), true);
    bar.strokes = [solid(T.line)];
    bar.strokeTopWeight = 1;
    bar.strokeBottomWeight = 0;
    bar.strokeLeftWeight = 0;
    bar.strokeRightWeight = 0;
    for (const tab of app.tabs) {
      const on = tab === s.tab;
      const item = box("Tab / " + tab, "VERTICAL", { gap: 4, align: "CENTER", w: 80 });
      const icon = box("Icon", "HORIZONTAL", { w: 46, h: 28, r: 12, fill: on ? T.mint : null, align: "CENTER", justify: "CENTER" });
      const tabIcons: Record<string, string> = { Home: "home", Orders: "package", Payments: "card", Account: "user", Deliveries: "car", Earnings: "wallet" };
      icon.appendChild(iconNode(tabIcons[tab] || "dot", 20, on ? T.green : T.muted));
      item.appendChild(icon);
      item.appendChild(text(tab, { size: 10, font: "s", color: on ? T.green : T.muted }));
      bar.appendChild(item);
    }
  }
  if (f.height < 844) content.paddingBottom += 844 - f.height;
  if (ctx.celebrate) await celebrationOverlay(f, ctx.celebrate);
  if (ctx.sheet) {
    const dim = figma.createRectangle();
    dim.name = "Scrim";
    f.appendChild(dim);
    dim.layoutPositioning = "ABSOLUTE";
    dim.resize(MW, f.height);
    dim.x = 0;
    dim.y = 0;
    dim.fills = [solid("#142D28", 0.67)];
    const sh = box("Modal / " + ctx.sheet.title, "VERTICAL", { w: MW - 40, p: 20, gap: 12, r: 22, fill: "#FFFFFF" });
    f.appendChild(sh);
    sh.layoutPositioning = "ABSOLUTE";
    para(sh, ctx.sheet.title, { size: 20, font: "b" });
    if (ctx.sheet.body) para(sh, ctx.sheet.body, { size: 14, color: T.muted });
    for (const b of ctx.sheet.blocks || []) await mobileBlock(sh, b, {});
    sh.x = 20;
    sh.y = Math.max(60, f.height - sh.height - 40);
  }
  return f;
}

// ---------------------------------------------------------------- admin blocks
// Compact shadcn-style admin: neutral surfaces, 8 px radius, sentence case.
const AW = 1440;
const SIDEBAR = 220;
const MAINW = AW - SIDEBAR - 40;
const Z = { bg: "#FFFFFF", side: "#FAFAFA", ink: "#18181B", text: "#3F3F46", mute: "#71717A", faint: "#A1A1AA", line: "#E4E4E7", soft: "#F4F4F5" };
const ATONES: Record<string, [string, string, string]> = {
  green: ["#F0FDF4", "#15803D", "#BBF7D0"],
  amber: ["#FFFBEB", "#B45309", "#FDE68A"],
  red: ["#FEF2F2", "#B91C1C", "#FECACA"],
  blue: ["#EFF6FF", "#1D4ED8", "#BFDBFE"],
  neutral: ["#FAFBFA", "#6B7280", "#E5E7EB"],
};
const TONE_KEYS: [string, string][] = [
  ["green", "active online available paid approved completed delivered matched accepted remitted"],
  ["red", "failed rejected suspended cancelled inactive amount_mismatch unexpected declined missed due"],
  ["amber", "pending requested searching awaiting_approval processing unknown in_review scheduled returning offered unverified not_submitted"],
  ["blue", "on_trip assigned to_pickup at_pickup loading in_transit at_destination offloading"],
];
function adminTone(v: string): string {
  const k = v.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  return (TONE_KEYS.find(([, l]) => l.split(" ").indexOf(k) >= 0) || ["neutral"])[0];
}
function dotPill(label: string): FrameNode {
  const [bg, fg, bd] = ATONES[adminTone(label)] || ATONES.green;
  const p = box("Status / " + label, "HORIZONTAL", { p: [2, 8, 2, 7], gap: 5, r: 999, fill: bg, stroke: bd, align: "CENTER" });
  if (!/^UGX /.test(label)) p.appendChild(circle(6, fg));
  p.appendChild(text(label, { size: 12, font: "m", color: fg }));
  return p;
}
/** "◉Paid" → badge, "Name\nsub" → two lines, "→Name" → link, else text. */
function statusCell(v: string): SceneNode {
  if (v.startsWith("◉")) return dotPill(v.slice(1));
  if (v.startsWith("→")) return text(v.slice(1), { size: 13, font: "m", color: Z.ink });
  if (/ ★$/.test(v)) {
    const r = box("Rating", "HORIZONTAL", { gap: 4, align: "CENTER" });
    r.appendChild(text(v.slice(0, -2), { size: 13, color: Z.text }));
    r.appendChild(icon("star", 12, "#E2A400", 1.5));
    return r;
  }
  if (v.includes("\n")) {
    const [a, b2] = v.split("\n");
    const c = box("Two lines", "VERTICAL", { gap: 1 });
    c.appendChild(text(a, { size: 13, font: "m", color: Z.ink }));
    c.appendChild(text(b2, { size: 11, color: Z.faint }));
    return c;
  }
  return text(v || "—", { size: 13, color: v === "Not assigned" ? Z.mute : Z.text });
}
function inlineStatus(parent: FrameNode, value: string, o: TextOpts): void {
  const [label, status] = value.split(" · ◉");
  const r = add(parent, box("Line", "HORIZONTAL", { gap: 8, align: "CENTER" }), true);
  r.appendChild(text(label.replace(/ ·$/, ""), o));
  if (status) r.appendChild(dotPill(status));
}
function webButton(label: string, v = "outline", small = true): FrameNode {
  const primary = v === "default" || v === "primary";
  const danger = v === "danger";
  const b = box("Button / " + label, "HORIZONTAL", { h: small ? 32 : 36, p: [0, 12, 0, 12], r: 6, gap: 6, fill: primary ? T.primary : "#FFFFFF", stroke: primary ? undefined : Z.line, align: "CENTER", justify: "CENTER" });
  const color = primary ? "#FFFFFF" : danger ? "#B91C1C" : Z.ink;
  let t = label;
  if (t.startsWith("+  ")) {
    b.appendChild(icon("plus", 14, color));
    t = t.slice(3);
  }
  const caret = t.endsWith("  ▾");
  b.appendChild(text(caret ? t.slice(0, -3) : t, { size: 13, font: "m", color }));
  if (caret) b.appendChild(icon("chevron-down", 14, Z.mute));
  return b;
}
/** Card header with a divider under it (CardHeader + border-b). */
function panelHead(c: FrameNode, title: string, right = "", ic = ""): FrameNode {
  const hd = add(c, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", p: [0, 0, 10, 0] }), true);
  hd.strokes = [solid(Z.line)];
  hd.strokeBottomWeight = 1;
  hd.strokeTopWeight = hd.strokeLeftWeight = hd.strokeRightWeight = 0;
  hd.appendChild(text(title, { size: 14, font: "s", color: Z.ink }));
  if (right) hd.appendChild(text(right, { size: 12, color: Z.mute }));
  if (ic) hd.appendChild(icon(ic, 15, Z.mute));
  return hd;
}
function panel(name: string, gap = 10): FrameNode {
  return box(name, "VERTICAL", { p: [12, 14, 12, 14], gap, r: 8, fill: "#FFFFFF", stroke: Z.line });
}
function searchBox(ph: string, w = 380): FrameNode {
  const s = box("Search", "HORIZONTAL", { w, h: 32, p: [0, 10, 0, 10], r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER", gap: 8 });
  s.appendChild(icon("search", 14, Z.mute));
  s.appendChild(text(ph, { size: 13, color: Z.faint }));
  return s;
}
function chipRow(parent: FrameNode, items: any[], active = 0): void {
  const r = add(parent, box("Filter chips", "HORIZONTAL", { gap: 6, wrap: true }), true);
  items.forEach(([label, count]: [string, string | number], i: number) => {
    const on = i === active;
    const c = box("Chip / " + label, "HORIZONTAL", { p: [4, 10, 4, 10], gap: 6, r: 999, fill: on ? Z.ink : "#FFFFFF", stroke: on ? Z.ink : Z.line, align: "CENTER" });
    c.appendChild(text(label, { size: 12, font: on ? "m" : "r", color: on ? "#FFFFFF" : Z.text }));
    if (count !== undefined) {
      const n = box("Count", "HORIZONTAL", { p: [0, 6, 0, 6], r: 999, fill: on ? "#3F3F46" : Z.soft });
      n.appendChild(text(String(count), { size: 11, font: "s", color: on ? "#FFFFFF" : Z.mute }));
      c.appendChild(n);
    }
    r.appendChild(c);
  });
}
async function adminBlock(parent: FrameNode, b: any, width: number): Promise<void> {
  switch (b.t) {
    case "metrics": {
      const r = add(parent, box("Stat cards", "HORIZONTAL", { gap: 10, align: "MIN" }), true);
      for (const [k, v, sub, link] of b.items) {
        const c = add(r, panel("Stat / " + k, 2));
        c.layoutGrow = 1;
        const top = add(c, box("Top", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        top.appendChild(text(k.charAt(0) + k.slice(1).toLowerCase(), { size: 12, font: "m", color: Z.mute }));
        const statIcons: [RegExp, string][] = [[/cancel/i, "x"], [/complet/i, "check"], [/progress|active|live/i, "activity"], [/trip|move|deliver/i, "package"], [/driver|online|offline|available/i, "truck"], [/customer|registered/i, "users"], [/collect|refund|spent|payment|balance|earning|platform|settlement|value|payout/i, "wallet"], [/issue|case/i, "help-circle"]];
        const si = statIcons.find(([re]) => re.test(k))?.[1] || "activity";
        top.appendChild(icon(si, 16, si === "package" ? T.primary : Z.mute));
        c.paddingTop = c.paddingBottom = 16;
        c.itemSpacing = 8;
        add(c, text(v, { size: 22, font: "s", color: Z.ink, ls: -1 }), true);
        if (sub) add(c, text(sub, { size: 11, color: Z.faint }), true);
        if (link) add(c, text(link + " ↗", { size: 12, font: "m", color: T.primary }), true);
      }
      return;
    }
    case "chart": {
      const c = add(parent, panel("Chart / " + b.title), true);
      panelHead(c, b.title, b.range || "Last 7 days");
      const cw = width - 28 - 30;
      const ch = 150;
      const plot = add(c, box("Plot", "HORIZONTAL", { h: ch + 22, gap: 6 }), true);
      const ax = add(plot, box("Y axis", "VERTICAL", { w: 24, h: ch, justify: "SPACE_BETWEEN" }));
      for (const n of ["16", "12", "8", "4", "0"]) ax.appendChild(text(n, { size: 10, color: Z.mute }));
      const area = figma.createFrame();
      area.name = "Area";
      area.fills = [];
      area.resize(cw, ch + 22);
      plot.appendChild(area);
      for (let i = 0; i < 5; i++) {
        const g = figma.createRectangle();
        g.resize(cw, 1);
        g.y = 6 + (i * (ch - 12)) / 4;
        g.fills = [solid(Z.soft)];
        area.appendChild(g);
      }
      const vals = b.values || [9, 6, 11, 8, 13, 10, 14];
      const pts = vals.map((v: number, i: number) => [(i * cw) / (vals.length - 1), 6 + (ch - 12) * (1 - v / 16)]);
      const line = "M " + pts.map((q: number[]) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" L ");
      const fillV = figma.createVector();
      area.appendChild(fillV);
      fillV.vectorPaths = [{ windingRule: "NONZERO", data: `${line} L ${cw} ${ch - 6} L 0 ${ch - 6} Z` }];
      fillV.fills = [{ type: "GRADIENT_LINEAR", gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: { ...rgb(T.primary), a: 0.25 } }, { position: 1, color: { ...rgb(T.primary), a: 0.02 } }] }];
      fillV.strokes = [];
      const lineV = figma.createVector();
      area.appendChild(lineV);
      lineV.vectorPaths = [{ windingRule: "NONE", data: line }];
      lineV.strokes = [solid(T.primary)];
      lineV.strokeWeight = 2;
      lineV.fills = [];
      for (const v of [fillV, lineV]) {
        v.x = 0;
        v.y = Math.min(...pts.map((q: number[]) => q[1]));
      }
      (b.days || ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"]).forEach((d: string, i: number) => {
        const t = text(d, { size: 10, color: Z.mute });
        area.appendChild(t);
        t.x = Math.min(cw - 20, Math.max(0, pts[i][0] - 8));
        t.y = ch + 6;
      });
      return;
    }
    case "glance": {
      const c = add(parent, panel("At a glance", 0), true);
      panelHead(c, b.title || "Needs attention", "", "activity");
      b.items.forEach(([k, v]: any[], i: number) => {
        const r = add(c, box("Row / " + k, "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER", p: [10, 0, 10, 0] }), true);
        if (i) {
          r.strokes = [solid(Z.line)];
          r.strokeTopWeight = 1;
          r.strokeBottomWeight = r.strokeLeftWeight = r.strokeRightWeight = 0;
        }
        r.appendChild(text(k, { size: 13, color: Z.text }));
        r.appendChild(text(String(v), { size: 13, font: "s", color: Z.ink }));
      });
      return;
    }
    case "split": {
      const r = add(parent, box("Columns", "HORIZONTAL", { gap: 12, align: "MIN" }), true);
      const ratio = b.ratio || 0.62;
      const left = add(r, box("Main", "VERTICAL", { gap: 12, w: Math.floor((width - 12) * ratio) }));
      const right = add(r, box("Aside", "VERTICAL", { gap: 12 }));
      right.layoutGrow = 1;
      for (const x of b.left || []) await adminBlock(left, x, left.width);
      for (const x of b.right || []) await adminBlock(right, x, Math.floor((width - 12) * (1 - ratio)));
      return;
    }
    case "chips":
      chipRow(parent, b.items, b.active || 0);
      return;
    case "table": {
      if (b.title) {
        const hr = add(parent, box("Table title", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        hr.appendChild(text(b.title, { size: 14, font: "s", color: Z.ink }));
        hr.appendChild(text(b.count || `${b.rows.length} records`, { size: 12, color: Z.mute }));
      }
      if (b.title || b.search) {
        const tb = add(parent, box("Toolbar", "HORIZONTAL", { gap: 8, align: "CENTER" }), true);
        tb.appendChild(searchBox(b.search || "Search records…"));
        for (const fl of b.filters || []) tb.appendChild(webButton(fl + "  ▾"));
        const sp = add(tb, box("Spacer", "HORIZONTAL", { w: 1, h: 1 }));
        sp.layoutGrow = 1;
        if (b.add) tb.appendChild(webButton("+  " + b.add, "default"));
        for (const ic of ["download", "columns"]) {
          const k = box("Tool", "HORIZONTAL", { w: 32, h: 32, r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER", justify: "CENTER" });
          k.appendChild(icon(ic, 15, Z.text));
          tb.appendChild(k);
        }
      }
      const c = add(parent, box("Table", "VERTICAL", { fill: "#FFFFFF", r: 8, stroke: Z.line, clip: true }), true);
      const open = b.open !== false;
      const colW = Math.floor((width - (open ? 36 : 0)) / b.cols.length);
      const head = add(c, box("Header", "HORIZONTAL", { fill: "#FAFAFA", h: 34, align: "CENTER" }), true);
      for (const col of b.cols) {
        const cell = box("Head / " + col, "HORIZONTAL", { w: colW, h: 34, p: [0, 12, 0, 12], align: "CENTER" });
        cell.appendChild(text(col, { size: 12, font: "m", color: Z.mute }));
        head.appendChild(cell);
      }
      for (const row of b.rows) {
        const tall = row.some((v: string) => String(v).includes("\n"));
        const r = add(c, box("Row", "HORIZONTAL", { h: tall ? 46 : 38, align: "CENTER" }), true);
        r.strokes = [solid(Z.line)];
        r.strokeTopWeight = 1;
        r.strokeBottomWeight = 0;
        r.strokeLeftWeight = 0;
        r.strokeRightWeight = 0;
        row.forEach((v: string, ci: number) => {
          const money = /^UGX /.test(String(v)) && ci === row.length - 1;
          const cell = box("Cell", "HORIZONTAL", { w: colW, h: tall ? 46 : 38, p: [0, 12, 0, 12], align: "CENTER", justify: money ? "MAX" : "MIN", clip: true });
          cell.appendChild(statusCell(String(v)));
          r.appendChild(cell);
        });
        if (open) r.appendChild(icon("chevron-right", 15, Z.faint));
      }
      if (b.title) {
        const pg = add(parent, box("Pagination", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
        pg.appendChild(text(b.pager || `1–${b.rows.length} of ${b.rows.length} records`, { size: 12, color: Z.mute }));
        const rt = box("Pager", "HORIZONTAL", { gap: 8, align: "CENTER" });
        rt.appendChild(webButton("10 per page  ▾"));
        rt.appendChild(text("Page 1 of " + (b.pages || 1), { size: 12, color: Z.text }));
        for (const n of ["chevron-left", "chevron-right"]) {
          const k = box("Page " + n, "HORIZONTAL", { w: 32, h: 32, r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER", justify: "CENTER" });
          k.appendChild(icon(n, 15, n === "chevron-left" ? Z.faint : Z.ink));
          rt.appendChild(k);
        }
        pg.appendChild(rt);
      }
      return;
    }
    case "filters": {
      const r = spacerRow(parent, 8);
      b.items.forEach((label: string, i: number) => {
        if (i === 0) r.appendChild(searchBox(label));
        else r.appendChild(webButton(label + (/(Export|Add)/.test(label) ? "" : "  ▾"), /Add/.test(label) ? "default" : "outline"));
      });
      return;
    }
    case "tabs": {
      const r = add(parent, box("Tabs", "HORIZONTAL", { p: 3, gap: 2, r: 8, fill: Z.soft }));
      b.items.forEach((label: string, i: number) => {
        const on = i === b.active;
        const t = box("Tab / " + label, "HORIZONTAL", { p: [5, 10, 5, 10], r: 6, fill: on ? "#FFFFFF" : null, stroke: on ? Z.line : undefined });
        t.appendChild(text(label, { size: 13, font: on ? "m" : "r", color: on ? Z.ink : Z.mute }));
        r.appendChild(t);
      });
      return;
    }
    case "detail": {
      const cols = b.cols || 3;
      const g = add(parent, box("Detail list", "HORIZONTAL", { gap: 16, wrap: true }), true);
      g.counterAxisSpacing = 0;
      const w = Math.floor((width - 16 * (cols - 1)) / cols);
      for (const [k, v] of b.rows) {
        const f = box("Field / " + k, "VERTICAL", { w, gap: 1, p: [7, 0, 7, 0] });
        f.strokes = [solid(Z.soft)];
        f.strokeTopWeight = 0;
        f.strokeLeftWeight = 0;
        f.strokeRightWeight = 0;
        f.strokeBottomWeight = 1;
        add(f, text(k, { size: 11, color: Z.mute }), true);
        add(f, text(v, { size: 13, color: Z.ink }), true);
        g.appendChild(f);
      }
      return;
    }
    case "section": {
      const c = add(parent, panel("Section / " + b.title), true);
      const hd = add(c, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      hd.appendChild(text(b.title, { size: 14, font: "s", color: Z.ink }));
      if (b.badge) hd.appendChild(dotPill(b.badge));
      for (const x of b.blocks || []) await adminBlock(c, x, width - 28);
      return;
    }
    case "btns": {
      const r = spacerRow(parent, 6);
      for (const [label, v] of b.items) r.appendChild(webButton(label, v === "outline" ? "outline" : v));
      return;
    }
    case "actions": {
      const r = add(parent, box("Account actions", "HORIZONTAL", { gap: 6, align: "CENTER" }), true);
      for (const label of b.items) {
        const bt = webButton(label, /^Approve/.test(label) ? "default" : "outline");
        r.appendChild(bt);
        const ai = /^Edit/.test(label) ? "pencil" : /^Message|^Contact|^Send/.test(label) ? "message" : /^Approve/.test(label) ? "check" : "";
        if (ai) bt.insertChild(0, icon(ai, 14, /^Approve/.test(label) ? "#FFFFFF" : Z.ink));
      }
      if (b.more) r.appendChild(webButton("More  ▾"));
      if (b.menu) {
        const m = add(parent, box("More menu (open)", "VERTICAL", { w: 230, p: 4, r: 8, fill: "#FFFFFF", stroke: Z.line }));
        m.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 6 }, radius: 18, spread: 0, visible: true, blendMode: "NORMAL" }];
        for (const it of b.menu) {
          if (it === "—") {
            const sep = figma.createRectangle();
            sep.resize(222, 1);
            sep.fills = [solid(Z.line)];
            m.appendChild(sep);
            continue;
          }
          const row = add(m, box("Item / " + it, "HORIZONTAL", { p: [7, 8, 7, 8], r: 4 }), true);
          row.appendChild(text(it, { size: 13, color: /Deactivate/.test(it) ? "#B91C1C" : Z.ink }));
        }
      }
      return;
    }
    case "party": {
      const r = add(parent, box("People cards", "HORIZONTAL", { gap: 10, align: "MIN" }), true);
      for (const [label, title, sub, link] of b.items) {
        const c = add(r, panel("Card / " + label, 3));
        c.layoutGrow = 1;
        add(c, text(label.toUpperCase(), { size: 11, font: "m", color: Z.mute, ls: 6 }), true);
        const who = add(c, box("Who", "HORIZONTAL", { gap: 10, align: "CENTER" }), true);
        if (!/^UGX|^LM-|payment/i.test(title + label)) {
          const av = box("Avatar", "HORIZONTAL", { w: 32, h: 32, r: 16, fill: Z.soft, align: "CENTER", justify: "CENTER" });
          av.appendChild(text(title.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(), { size: 11, font: "s", color: Z.text }));
          who.appendChild(av);
        }
        const wc = add(who, box("Text", "VERTICAL", { gap: 2 }));
        wc.appendChild(statusCell(title.startsWith("◉") ? title : "→" + title));
        if (sub) wc.appendChild(sub.startsWith("◉") ? dotPill(sub.slice(1)) : text(sub, { size: 12, color: Z.mute }));
        if (link) add(c, text(link + " →", { size: 12, font: "m", color: T.primary }), true);
      }
      return;
    }
    case "routemap": {
      const r = add(parent, box("Route", "HORIZONTAL", { gap: 12, align: "MIN" }), true);
      const mw = Math.floor((width - 12) * 0.62);
      const m = await mapArt(mw, b.h || 340, { wide: true, trucks: b.live ? 1 : 0, progress: b.progress ?? 0.55 });
      m.cornerRadius = 8;
      r.appendChild(m);
      const p = add(r, panel("Route panel"));
      p.layoutGrow = 1;
      const hd = add(p, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      hd.appendChild(text("Route", { size: 14, font: "s", color: Z.ink }));
      hd.appendChild(dotPill(b.live ? "Live" : "Delivered"));
      await adminBlock(p, { t: "detail", cols: 2, rows: b.facts }, Math.floor((width - 12) * 0.38) - 28);
      b.stops.forEach(([name, status]: string[], i: number) => {
        const row = add(p, box("Stop / " + name, "HORIZONTAL", { gap: 10, align: "CENTER", p: [5, 0, 5, 0] }), true);
        const pin = box("Pin", "HORIZONTAL", { w: 22, h: 22, r: 11, fill: i === 0 ? T.primary : status === "Not reached" ? Z.ink : Z.faint, align: "CENTER", justify: "CENTER" });
        pin.appendChild(text(i === 0 ? "P" : String(i), { size: 10, font: "b", color: "#FFFFFF" }));
        row.appendChild(pin);
        const col = box("Text", "VERTICAL", { gap: 1 });
        col.appendChild(text(name, { size: 13, font: "m", color: Z.ink }));
        col.appendChild(text(status, { size: 11, color: Z.mute }));
        row.appendChild(col);
      });
      add(parent, text(b.caption || "Road route preview · truck position estimated from the trip stage, not live GPS", { size: 11, color: Z.mute }), true);
      return;
    }
    case "fleet": {
      const r = add(parent, box("Fleet", "HORIZONTAL", { gap: 12, align: "MIN" }), true);
      const mw = Math.floor((width - 12) * 0.64);
      const h = b.h || 460;
      const m = await mapArt(mw, h, { wide: true, route: b.route ? undefined : false });
      m.cornerRadius = 8;
      r.appendChild(m);
      const legend = box("Legend", "HORIZONTAL", { p: [6, 10, 6, 10], gap: 12, r: 8, fill: "#FFFFFF", stroke: Z.line, align: "CENTER" });
      for (const [l, col] of [["On a trip", "#3B82F6"], ["Available", T.primary], ["Offline", Z.faint]]) {
        const it = box("Item", "HORIZONTAL", { gap: 5, align: "CENTER" });
        it.appendChild(circle(9, col));
        it.appendChild(text(l, { size: 11, color: Z.text }));
        legend.appendChild(it);
      }
      m.appendChild(legend);
      legend.x = 12;
      legend.y = 12;
      for (const [ini, state, x, y, sel] of b.pins) {
        const col = state === "on_trip" ? "#3B82F6" : state === "available" ? T.primary : Z.faint;
        const s = sel ? 38 : 30;
        const pin = box("Driver / " + ini, "HORIZONTAL", { w: s, h: s, r: s / 2, fill: col, stroke: sel ? Z.ink : "#FFFFFF", align: "CENTER", justify: "CENTER" });
        pin.strokeWeight = sel ? 3 : 2;
        pin.appendChild(text(ini, { size: 10, font: "s", color: "#FFFFFF" }));
        m.appendChild(pin);
        pin.x = x * mw - s / 2;
        pin.y = y * h - s / 2;
      }
      const p = add(r, panel("Driver panel"));
      p.layoutGrow = 1;
      p.appendChild(searchBox("Find driver: name, ID, plate or phone", Math.floor((width - 12) * 0.36) - 28));
      chipRow(p, b.chips, 0);
      if (b.selected) {
        const s = b.selected;
        add(p, text(s.name, { size: 14, font: "s", color: Z.ink }), true);
        add(p, text(s.sub, { size: 12, color: Z.mute }), true);
        const st = add(p, box("States", "HORIZONTAL", { gap: 6 }), true);
        for (const x of s.badges) st.appendChild(dotPill(x));
        await adminBlock(p, { t: "detail", cols: 2, rows: s.facts }, Math.floor((width - 12) * 0.36) - 28);
        if (s.trip) {
          const tc = add(p, box("Current trip", "VERTICAL", { p: 10, gap: 6, r: 6, stroke: Z.line }), true);
          const th = add(tc, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
          th.appendChild(text(s.trip.id, { size: 13, font: "s", color: Z.ink }));
          th.appendChild(dotPill(s.trip.stage));
          for (const line of s.trip.lines) add(tc, text(line, { size: 12, color: Z.text }), true);
          add(tc, webButton("Open trip details", "default"), true);
        }
        add(p, webButton("Open driver profile"), true);
      } else
        for (const [name, sub, state] of b.list) {
          const row = add(p, box("Driver / " + name, "HORIZONTAL", { gap: 10, align: "CENTER", p: [6, 0, 6, 0] }), true);
          row.appendChild(circle(9, state === "on_trip" ? "#3B82F6" : state === "available" ? T.primary : Z.faint));
          const col = box("Text", "VERTICAL", { gap: 1 });
          col.layoutGrow = 1;
          col.appendChild(text(name, { size: 13, font: "m", color: Z.ink }));
          col.appendChild(text(sub, { size: 11, color: Z.mute }));
          row.appendChild(col);
          row.appendChild(icon("chevron-right", 15, Z.faint));
        }
      add(parent, text("Simulated positions · trip stage for drivers on a trip, last drop-off otherwise · not live GPS · refreshed every 4 s", { size: 11, color: Z.mute }), true);
      return;
    }
    case "notice": {
      const tone = b.tone === "amber" ? ["#FFFBEB", "#FDE68A", "#92400E"] : ["#FAFAFA", Z.line, Z.text];
      const n = add(parent, box("Notice", "HORIZONTAL", { p: [8, 12, 8, 12], r: 6, fill: tone[0], stroke: tone[1] }), true);
      n.appendChild(text(b.text, { size: 13, font: b.tone === "amber" ? "m" : "r", color: tone[2] }));
      return;
    }
    case "timeline": {
      const f = add(parent, box("Timeline", "VERTICAL", { gap: 0 }), true);
      for (const [t1, t2] of b.items) {
        const r = add(f, box("Entry", "HORIZONTAL", { gap: 12, p: [6, 0, 6, 0] }), true);
        r.appendChild(circle(8, T.primary));
        const col = add(r, box("Text", "VERTICAL", { gap: 2 }));
        col.layoutGrow = 1;
        inlineStatus(col, t1, { size: 13, font: "m", color: Z.ink });
        add(col, text(t2, { size: 11, color: Z.mute, lh: 140 }), true);
      }
      return;
    }
    case "form": {
      for (const [label, value, kind] of b.fields) {
        const f = add(parent, box("Field / " + label, "VERTICAL", { gap: 6 }), true);
        add(f, text(label, { size: 13, font: "m", color: Z.ink }), true);
        if (kind === "checks") {
          const g = add(f, box("Checkboxes", "HORIZONTAL", { gap: 8, wrap: true, p: 10, r: 8, stroke: Z.line }), true);
          for (const opt of String(value).split("|")) {
            const on = opt.startsWith("✓");
            const it = box("Check / " + opt, "HORIZONTAL", { w: 230, gap: 8, align: "CENTER" });
            const bx = box("Box", "HORIZONTAL", { w: 16, h: 16, r: 4, fill: on ? T.primary : "#FFFFFF", stroke: on ? T.primary : Z.line, align: "CENTER", justify: "CENTER" });
            if (on) bx.appendChild(icon("check", 12, "#FFFFFF", 3));
            it.appendChild(bx);
            it.appendChild(text(opt.replace(/^✓/, ""), { size: 12, color: Z.text }));
            g.appendChild(it);
          }
          continue;
        }
        const i = add(f, box("Input", "HORIZONTAL", { h: kind === "area" ? 72 : 36, p: [0, 10, 0, 10], r: 6, fill: "#FFFFFF", stroke: Z.line, align: kind === "area" ? "MIN" : "CENTER" }), true);
        if (kind === "area") i.paddingTop = 8;
        i.appendChild(text(value, { size: 13, color: value ? Z.ink : Z.faint }));
      }
      const r = add(parent, box("Actions", "HORIZONTAL", { gap: 8, justify: "MAX" }), true);
      r.appendChild(webButton("Cancel", "outline", false));
      r.appendChild(webButton(b.submit, b.danger ? "danger" : "default", false));
      return;
    }
    case "dialoghead": {
      add(parent, text(b.title, { size: 18, font: "s", color: Z.ink }), true);
      if (b.sub) add(parent, text(b.sub, { size: 13, color: Z.mute, lh: 140 }), true);
      if (b.badges) {
        const r = spacerRow(parent, 6);
        for (const x of b.badges) r.appendChild(dotPill(x));
      }
      return;
    }
    case "h3":
      add(parent, text(b.text, { size: 14, font: "s", color: Z.ink }), true);
      return;
    case "map":
      add(parent, await mapArt(width, b.h || 360, b), true);
      return;
    case "field": {
      const f = add(parent, box("Field / " + b.label, "VERTICAL", { gap: 6 }), true);
      add(f, text(b.label, { size: 13, font: "m", color: Z.ink }), true);
      const i = add(f, box("Input", "HORIZONTAL", { h: 36, p: [0, 10, 0, 10], r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER" }), true);
      i.appendChild(text(b.value || b.ph || " ", { size: 13, color: b.value ? Z.ink : Z.faint }));
      return;
    }
    case "btn":
      add(parent, webButton(b.text, b.v === "primary" || !b.v ? "default" : b.v, false), true);
      return;
    case "link":
      add(parent, text(b.text, { size: 13, font: "m", color: T.primary }), true);
      return;
    case "demo": {
      const n = add(parent, box("Demo access", "VERTICAL", { p: [10, 12, 10, 12], gap: 3, r: 8, fill: "#FAFAFA", stroke: Z.line }), true);
      for (const [i, l] of b.lines.entries()) add(n, text(l, { size: 12, font: i ? "r" : "s", color: i ? Z.text : Z.ink }), true);
      return;
    }
    case "profile": {
      // Profile edit card (ProfileEditCard in apps/admin/src/App.tsx).
      const c = add(parent, box("Profile edit card", "VERTICAL", { p: 20, gap: 20, r: 8, fill: "#FFFFFF", stroke: Z.line }), true);
      const hd = add(c, box("Head", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      const id = box("Identity", "VERTICAL", { gap: 2 });
      id.appendChild(text(b.meta, { size: 12, color: Z.mute }));
      id.appendChild(text(b.name, { size: 20, font: "s", color: Z.ink }));
      id.appendChild(text(b.email, { size: 13, color: Z.mute }));
      hd.appendChild(id);
      const bd = box("Badges", "HORIZONTAL", { gap: 6, align: "CENTER" });
      for (const x of b.badges || []) bd.appendChild(dotPill(x));
      hd.appendChild(bd);
      const hr = figma.createRectangle();
      hr.resize(100, 1);
      hr.fills = [solid(Z.line)];
      add(c, hr, true);
      const fields = add(c, box("Fields", "HORIZONTAL", { gap: 28, align: "MIN" }), true);
      const ph = add(fields, box("Profile photo", "HORIZONTAL", { w: 320, gap: 14, align: "CENTER" }));
      const av = box("Avatar", "HORIZONTAL", { w: 72, h: 72, r: 36, fill: b.photo ? "#B7E4C7" : Z.soft, stroke: Z.line, align: "CENTER", justify: "CENTER" });
      av.appendChild(b.photo ? icon("user", 34, "#087443", 1.75) : text(b.initials, { size: 22, font: "s", color: "#52525B" }));
      ph.appendChild(av);
      const pc = box("Upload", "VERTICAL", { gap: 5 });
      pc.appendChild(text("Profile photo", { size: 13, font: "m", color: Z.ink }));
      const pb = box("Buttons", "HORIZONTAL", { gap: 6, align: "CENTER" });
      pb.appendChild(webButton(b.photo ? "Replace photo" : "Upload photo", "outline", false));
      if (b.photo) pb.appendChild(text("Remove", { size: 13, font: "m", color: Z.ink }));
      pc.appendChild(pb);
      pc.appendChild(text("JPG or PNG · Up to 5 MB", { size: 12, color: Z.mute }));
      ph.appendChild(pc);
      for (const [label, value, help, placeholder] of b.fields) {
        const f = add(fields, box("Field / " + label, "VERTICAL", { gap: 6 }));
        f.layoutGrow = 1;
        add(f, text(label, { size: 13, font: "m", color: Z.ink }), true);
        const i = add(f, box("Input", "HORIZONTAL", { h: 40, p: [0, 10, 0, 10], r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER" }), true);
        i.appendChild(text(value || placeholder || " ", { size: 13, color: value ? Z.ink : Z.mute }));
        add(f, text(help, { size: 12, color: Z.mute }), true);
      }
      const ft = add(c, box("Foot", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "CENTER" }), true);
      ft.appendChild(text(b.foot, { size: 12, color: Z.mute }));
      const save = webButton("Save changes", "default", false);
      if (!b.dirty) save.opacity = 0.5;
      ft.appendChild(save);
      return;
    }
    case "device": {
      // App & device section (DeviceCard in apps/admin/src/App.tsx).
      const c = add(parent, box("App & device", "VERTICAL", { p: [16, 20, 16, 20], gap: 6, r: 8, fill: "#FFFFFF", stroke: Z.line }), true);
      const hd = add(c, box("Head", "HORIZONTAL", { gap: 8, align: "CENTER" }), true);
      hd.appendChild(icon("phone", 15, Z.ink));
      hd.appendChild(text("App & device", { size: 14, font: "s", color: Z.ink }));
      add(c, text(b.sub, { size: 12, color: Z.mute }), true);
      if (!b.rows) {
        add(c, text("No device reported yet. It appears after this account next opens the mobile app.", { size: 12, color: Z.mute }), true);
        return;
      }
      await adminBlock(c, { t: "detail", cols: 5, rows: b.rows }, width - 40);
      if (b.earlier?.length) {
        add(c, text("Earlier devices", { size: 11, font: "m", color: Z.mute }), true);
        for (const [t1, t2] of b.earlier) {
          const r = add(c, box("Earlier device", "VERTICAL", { gap: 1 }), true);
          r.appendChild(text(t1, { size: 13, font: "m", color: Z.ink }));
          r.appendChild(text(t2, { size: 12, color: Z.mute }));
        }
      }
      return;
    }
    default:
      add(parent, text(`[${b.t}]`, { size: 12, color: Z.mute }), true);
  }
}

function sidebar(app: any, active: string): FrameNode {
  const s = box("Sidebar", "VERTICAL", { w: SIDEBAR, p: [12, 10, 12, 10], gap: 10, fill: Z.side });
  s.strokes = [solid(Z.line)];
  s.strokeTopWeight = 0;
  s.strokeBottomWeight = 0;
  s.strokeLeftWeight = 0;
  s.strokeRightWeight = 1;
  const brand = add(s, box("Brand", "HORIZONTAL", { gap: 8, p: [6, 8, 4, 8], align: "CENTER" }), true);
  const mark = box("Logo", "HORIZONTAL", { w: 24, h: 24, r: 6, fill: T.primary, align: "CENTER", justify: "CENTER" });
  mark.appendChild(icon("arrow-up-right", 15, "#FFFFFF", 2.5));
  brand.appendChild(mark);
  brand.appendChild(text("LoadMaster", { size: 15, font: "s", color: Z.ink }));
  const org = add(s, box("Workspace", "HORIZONTAL", { p: [6, 8, 6, 8], gap: 8, r: 6, fill: "#FFFFFF", stroke: Z.line, align: "CENTER" }), true);
  const av = box("Avatar", "HORIZONTAL", { w: 24, h: 24, r: 12, fill: Z.soft, align: "CENTER", justify: "CENTER" });
  av.appendChild(text("LM", { size: 9, font: "s", color: Z.text }));
  org.appendChild(av);
  const oc = box("Org", "VERTICAL", { gap: 1 });
  oc.appendChild(text("Cargo operations", { size: 12, font: "m", color: Z.ink }));
  oc.appendChild(text("KAMPALA · V2 DEMO", { size: 10, color: Z.mute, ls: 4 }));
  org.appendChild(oc);
  for (const [label, items] of app.nav || []) {
    const g = add(s, box("Group / " + label, "VERTICAL", { gap: 1 }), true);
    add(g, box("Caption", "HORIZONTAL", { p: [4, 8, 4, 8] }), true).appendChild(text(label, { size: 11, font: "m", color: Z.faint }));
    for (const [path, name] of items) {
      const on = path === active;
      const it = add(g, box("Nav / " + name, "HORIZONTAL", { p: [6, 8, 6, 8], gap: 8, r: 6, fill: on ? "#FFFFFF" : null, stroke: on ? Z.line : undefined, align: "CENTER" }), true);
      const navIcons: Record<string, string> = { dashboard: "dashboard", trips: "package", drivers: "truck", customers: "users", payments: "wallet-cards", payouts: "wallet", transfers: "transfer", reconciliation: "clipboard-check", methods: "wallet-cards", rewards: "gift", support: "help-circle", staff: "shield", audit: "file-text", reports: "chart", settings: "gear" };
      it.appendChild(icon(navIcons[path] || "dot", 15, on ? T.primary : Z.mute));
      it.appendChild(text(name, { size: 13, font: on ? "m" : "r", color: on ? Z.ink : Z.text }));
    }
  }
  const ft = add(s, box("Footer", "VERTICAL", { gap: 4, p: [10, 8, 4, 8] }), true);
  ft.strokes = [solid(Z.line)];
  ft.strokeTopWeight = 1;
  ft.strokeBottomWeight = ft.strokeLeftWeight = ft.strokeRightWeight = 0;
  const sv = add(ft, box("Service", "HORIZONTAL", { gap: 6, align: "CENTER" }));
  sv.appendChild(circle(6, T.primary));
  sv.appendChild(text("Shared demo service", { size: 12, font: "m", color: Z.ink }));
  ft.appendChild(text("Customer · Driver · Operations", { size: 11, color: Z.mute }));
  const so = add(ft, box("Sign out", "HORIZONTAL", { gap: 8, p: [8, 0, 0, 0], align: "CENTER" }));
  so.appendChild(icon("log-out", 15, Z.mute));
  so.appendChild(text("Sign out", { size: 13, color: Z.text }));
  return s;
}
function topbar(app: any, route: string): FrameNode {
  const group = (app.nav || []).find(([, items]: any) => items.some(([p]: string[]) => p === route));
  const name = group ? group[1].find(([p]: string[]) => p === route)[1] : "";
  const t = box("Top bar", "HORIZONTAL", { h: 48, p: [0, 20, 0, 20], fill: "#FFFFFF", align: "CENTER", justify: "SPACE_BETWEEN" });
  t.strokes = [solid(Z.line)];
  t.strokeTopWeight = 0;
  t.strokeLeftWeight = 0;
  t.strokeRightWeight = 0;
  t.strokeBottomWeight = 1;
  const crumb = box("Breadcrumb", "HORIZONTAL", { gap: 6, align: "CENTER" });
  crumb.appendChild(text(group ? group[0] : "", { size: 13, color: Z.mute }));
  crumb.appendChild(icon("chevron-right", 14, Z.mute));
  crumb.appendChild(text(name, { size: 13, font: "m", color: Z.ink }));
  t.appendChild(crumb);
  const right = box("Right", "HORIZONTAL", { gap: 10, align: "CENTER" });
  right.appendChild(text("5 November 2026", { size: 12, color: Z.mute }));
  const demo = box("Demo", "HORIZONTAL", { p: [2, 8, 2, 8], r: 999, stroke: Z.line });
  demo.appendChild(text("DEMO", { size: 10, font: "s", color: T.primary, ls: 6 }));
  right.appendChild(demo);
  const me = box("Me", "HORIZONTAL", { w: 28, h: 28, r: 14, fill: Z.soft, align: "CENTER", justify: "CENTER" });
  me.appendChild(text("IN", { size: 10, font: "s", color: Z.text }));
  right.appendChild(me);
  t.appendChild(right);
  return t;
}
async function adminScreen(app: any, s: any): Promise<FrameNode> {
  const f = box(s.name, "HORIZONTAL", { w: AW, fill: Z.bg, clip: true });
  f.minHeight = 900;
  if (s.layout === "split") {
    const art = add(f, box("Login art", "VERTICAL", { w: AW / 2, p: [32, 40, 32, 40], gap: 8, fill: "#FAFAFA", justify: "SPACE_BETWEEN" }));
    art.layoutSizingVertical = "FILL";
    art.strokes = [solid(Z.line)];
    art.strokeTopWeight = 0;
    art.strokeBottomWeight = 0;
    art.strokeLeftWeight = 0;
    art.strokeRightWeight = 1;
    const brand = box("Brand", "HORIZONTAL", { gap: 8, align: "CENTER" });
    const mark = box("Logo", "HORIZONTAL", { w: 24, h: 24, r: 6, fill: T.primary, align: "CENTER", justify: "CENTER" });
    mark.appendChild(icon("arrow-up-right", 15, "#FFFFFF", 2.5));
    brand.appendChild(mark);
    brand.appendChild(text("LoadMaster", { size: 15, font: "s", color: Z.ink }));
    art.appendChild(brand);
    const art2 = s.blocks.find((b: any) => b.t === "loginart");
    const mid = box("Copy", "VERTICAL", { gap: 6 });
    mid.appendChild(text(art2 ? art2.title : "", { size: 24, font: "s", color: Z.ink }));
    if (art2?.body) mid.appendChild(text(art2.body, { size: 14, color: Z.mute }));
    art.appendChild(mid);
    art.appendChild(text("Demo environment · no real money", { size: 12, color: Z.faint }));
    const form = add(f, box("Login form", "VERTICAL", { w: AW / 2, p: [260, 210, 80, 210], gap: 12 }));
    form.layoutSizingVertical = "FILL";
    add(form, text("Sign in", { size: 20, font: "s", color: Z.ink }), true);
    add(form, text("Sign in with your individual staff account.", { size: 13, color: Z.mute }), true);
    for (const b of s.blocks) if (b.t !== "loginart") await adminBlock(form, b, AW / 2 - 420);
    return f;
  }
  const route = s.route.split(/[ (]/)[0];
  const sb = add(f, sidebar(app, route));
  sb.layoutSizingVertical = "FILL";
  const shell = add(f, box("Shell", "VERTICAL", {}));
  shell.layoutGrow = 1;
  shell.layoutSizingVertical = "FILL";
  add(shell, topbar(app, route), true);
  const main = add(shell, box("Main", "VERTICAL", { p: [16, 20, 32, 20], gap: 12 }), true);
  if (s.page) {
    if (s.page.back) {
      const back = add(main, box("Back", "HORIZONTAL", { gap: 4, align: "CENTER" }));
      back.appendChild(icon("arrow-left", 13, Z.mute));
      back.appendChild(text("Back", { size: 12, color: Z.mute }));
    }
    const hd = add(main, box("Page header", "HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MAX", gap: 12 }), true);
    const col = add(hd, box("Title", "VERTICAL", { gap: 2 }));
    if (s.page.meta) col.appendChild(text(s.page.meta, { size: 12, color: Z.mute }));
    col.appendChild(text(s.page.title, { size: 20, font: "s", color: Z.ink, ls: -1 }));
    if (s.page.desc) col.appendChild(text(s.page.desc, { size: 13, color: Z.mute }));
    const right = box("Header actions", "HORIZONTAL", { gap: 6, align: "CENTER" });
    for (const x of s.page.badges || []) right.appendChild(dotPill(x));
    if (s.page.add) right.appendChild(webButton("+  " + s.page.add, "default", false));
    // An empty auto-layout frame keeps its default 100 px size; only add when used.
    if (right.children.length) hd.appendChild(right);
    else right.remove();
  }
  if (!s.dialog) {
    for (const b of s.blocks) await adminBlock(main, b, MAINW);
    return f;
  }
  // Dialog: the page behind, dimmed, with the modal on top.
  for (const b of s.behind || [{ t: "table", cols: ["Trip", "Pickup", "Destination", "Driver", "Status"], rows: [["—", "—", "—", "—", "—"], ["—", "—", "—", "—", "—"], ["—", "—", "—", "—", "—"]] }]) await adminBlock(main, b, MAINW);
  const dim = figma.createRectangle();
  dim.name = "Scrim";
  f.appendChild(dim);
  dim.layoutPositioning = "ABSOLUTE";
  dim.resize(AW, f.height);
  dim.x = 0;
  dim.y = 0;
  dim.fills = [solid("#000000", 0.4)];
  const dw = s.dialogWidth || 560;
  const d = box("Dialog / " + s.name, "VERTICAL", { w: dw, p: 24, gap: 14, r: 10, fill: "#FFFFFF", stroke: Z.line });
  d.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.16 }, offset: { x: 0, y: 12 }, radius: 40, spread: 0, visible: true, blendMode: "NORMAL" }];
  f.appendChild(d);
  d.layoutPositioning = "ABSOLUTE";
  for (const b of s.blocks) await adminBlock(d, b, dw - 48);
  d.x = (AW - dw) / 2;
  d.y = 90;
  if (d.y + d.height + 40 > f.height) {
    f.minHeight = d.y + d.height + 60;
    dim.resize(AW, f.height);
  }
  return f;
}

// ---------------------------------------------------------------- annotations
function annotation(appId: string, s: any, idx: string): FrameNode {
  const a = box("Annotation / " + s.id, "VERTICAL", { w: 340, p: 20, gap: 12, r: 14, fill: "#FFFFFF", stroke: "#E4E7EC" });
  const head = spacerRow(a, 8);
  head.appendChild(pill(idx, "neutral", true));
  if (s.tag) head.appendChild(pill(s.tag.toUpperCase(), s.tag === "New" ? "blue" : "amber", true));
  para(a, s.name, { size: 18, font: "b", color: "#101828" });
  para(a, "Route · " + s.route, { size: 12, font: "m", color: "#475467" });
  if (s.purpose) para(a, s.purpose, { size: 13, color: "#344054" });
  const section = (label: string) => para(a, label, { size: 10, font: "s", color: "#667085", ls: 8, upper: true });
  if (s.actions?.length) {
    section("Actions");
    for (const ac of s.actions) {
      const c = add(a, box("Action / " + ac.does, "VERTICAL", { p: 12, gap: 6, r: 10, fill: "#F9FAFB", stroke: "#EAECF0" }), true);
      para(c, ac.does, { size: 13, font: "s", color: "#101828" });
      if (ac.api && ac.api !== "—") para(c, ac.api, { size: 11, font: "m", color: "#1D4ED8" });
      if (ac.effect) para(c, ac.effect, { size: 12, color: "#475467" });
      for (const h of ac.affects || []) {
        const r = add(c, box("Affects", "HORIZONTAL", { gap: 8, p: [6, 8, 6, 8], r: 8, fill: "#FFFFFF", stroke: APP_COLOR[h.app] }), true);
        const chip = box("App", "HORIZONTAL", { p: [2, 6, 2, 6], r: 999, fill: APP_COLOR[h.app] });
        chip.itemSpacing = 3;
        chip.counterAxisAlignItems = "CENTER";
        chip.appendChild(icon("arrow-right", 10, "#FFFFFF", 2.5));
        chip.appendChild(text(APP_NAME[h.app], { size: 10, font: "s", color: "#FFFFFF" }));
        r.appendChild(chip);
        const t = add(r, text(`${h.screen} · ${h.what}`, { size: 11, color: "#344054", lh: 135 }));
        t.layoutGrow = 1;
        t.textAutoResize = "HEIGHT";
      }
    }
  }
  if (s.states?.length) {
    section("States & errors");
    for (const st of s.states) para(a, "• " + st, { size: 12, color: "#475467" });
  }
  if (s.notes?.length) {
    section("Developer notes");
    for (const n of s.notes) para(a, "• " + n, { size: 12, color: "#475467" });
  }
  void appId;
  return a;
}

// ---------------------------------------------------------------- pages
const PAGES: Record<string, string> = {
  cover: "LM · 00 Cover & index",
  foundations: "LM · 01 Foundations",
  customer: "LM · 10 Customer app",
  driver: "LM · 20 Driver app",
  admin: "LM · 30 Admin portal",
  flows: "LM · 40 Cross-app flows",
  machines: "LM · 41 State machines",
};
async function pageFor(key: string, replace: boolean): Promise<PageNode> {
  if (replace) {
    for (const p of figma.root.children) {
      if (p.getPluginData(OWNER) === key) {
        await p.loadAsync();
        for (const c of [...p.children]) if (c.getPluginData(OWNER)) c.remove();
        return p;
      }
    }
  }
  const page = figma.createPage();
  const taken = figma.root.children.filter((p) => p.name.startsWith(PAGES[key])).length;
  page.name = PAGES[key] + (taken > 1 ? ` (${taken})` : "");
  page.setPluginData(OWNER, key);
  return page;
}
function own<N extends SceneNode>(n: N, tag = "1"): N {
  n.setPluginData(OWNER, tag);
  return n;
}

function boardHeader(parent: FrameNode, title: string, sub: string, color: string): void {
  const h = add(parent, box("Board header", "VERTICAL", { gap: 10, p: [0, 0, 20, 0] }), true);
  const r = spacerRow(h, 12);
  const dot = circle(18, color);
  r.appendChild(dot);
  r.appendChild(text(title, { size: 48, font: "b", color: "#101828" }));
  add(h, text(sub, { size: 18, color: "#475467", lh: 140 }), true);
}

let progressDone = 0;
let progressTotal = 1;
function report(textValue: string): void {
  figma.ui.postMessage({ type: "status", text: textValue, progress: progressDone / progressTotal });
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

// ------------------------------------------------------- captured screens
// Screens captured from the running apps (scripts/capture) are rebuilt layer by
// layer from what the browser painted: exact boxes, colours, type and icons.
let CAPTURES: any = {};
const FONT_OK = new Map<string, FontName>();
const WEIGHT: Record<number, string> = { 100: "Thin", 200: "Extra Light", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold", 800: "Extra Bold", 900: "Black" };
async function capFont(family: string, weight: number, italic: boolean): Promise<FontName> {
  const style = (WEIGHT[Math.round(weight / 100) * 100] || "Regular") + (italic ? " Italic" : "");
  const want = /inter/i.test(family) ? "Inter" : /^(-apple-system|system-ui|blinkmacsystemfont|sf pro)/i.test(family) ? "SF Pro" : family;
  const key = want + "|" + style;
  if (FONT_OK.has(key)) return FONT_OK.get(key)!;
  for (const f of [{ family: want, style }, { family: "Inter", style }, { family: "Inter", style: "Regular" }]) {
    try {
      await figma.loadFontAsync(f);
      FONT_OK.set(key, f);
      return f;
    } catch {
      // Try the next fallback.
    }
  }
  return F.r;
}
function cssColor(c: string): { color: RGB; a: number } | null {
  const m = String(c || "").match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { color: { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255 }, a: p[3] ?? 1 };
}
function cssPaint(c: string): SolidPaint | null {
  const x = cssColor(c);
  return x && x.a > 0 ? { type: "SOLID", color: x.color, opacity: x.a } : null;
}
function cssGradient(g: string): GradientPaint | null {
  const m = g.match(/linear-gradient\((.*)\)$/);
  if (!m) return null;
  const parts = m[1].split(/,(?![^(]*\))/).map((s) => s.trim());
  let deg = 180;
  if (/deg$/.test(parts[0])) deg = parseFloat(parts.shift()!);
  else if (/^to /.test(parts[0])) {
    const d = parts.shift()!;
    deg = /right/.test(d) ? 90 : /left/.test(d) ? 270 : /top/.test(d) ? 0 : 180;
  }
  const stops = parts.map((s, i) => {
    const col = cssColor(s);
    const pos = s.match(/([\d.]+)%\s*$/);
    return { position: pos ? parseFloat(pos[1]) / 100 : i / Math.max(1, parts.length - 1), color: { ...(col ? col.color : { r: 0, g: 0, b: 0 }), a: col ? col.a : 1 } };
  });
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const L = Math.abs(dx) + Math.abs(dy);
  return {
    type: "GRADIENT_LINEAR",
    gradientStops: stops,
    gradientTransform: [
      [dx / L, dy / L, 0.5 - (0.5 * dx + 0.5 * dy) / L],
      [-dy / L, dx / L, 0.5 - (-0.5 * dy + 0.5 * dx) / L],
    ],
  };
}
function cssShadows(s: string): Effect[] {
  const out: Effect[] = [];
  s.split(/,(?![^(]*\))/).forEach((one) => {
    const col = cssColor(one);
    const nums = one.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g)?.map(parseFloat) || [];
    if (!col || nums.length < 2 || col.a === 0) return;
    out.push({ type: /inset/.test(one) ? "INNER_SHADOW" : "DROP_SHADOW", color: { ...col.color, a: col.a }, offset: { x: nums[0], y: nums[1] }, radius: nums[2] || 0, spread: nums[3] || 0, visible: true, blendMode: "NORMAL" });
  });
  return out;
}
function imagePaint(data: string, mode: "FILL" | "FIT"): ImagePaint | null {
  const b64 = String(data || "").split(",")[1];
  if (!b64) return null;
  try {
    return { type: "IMAGE", imageHash: figma.createImage(figma.base64Decode(b64)).hash, scaleMode: mode };
  } catch {
    return null;
  }
}
async function capNode(n: any, parent: FrameNode, ox: number, oy: number): Promise<void> {
  if (n.k === "text") {
    const t = figma.createText();
    const st = n.st;
    t.fontName = await capFont(st.f, st.w, !!st.i);
    t.characters = st.tt === "uppercase" ? n.t.toUpperCase() : st.tt === "lowercase" ? n.t.toLowerCase() : n.t;
    t.fontSize = st.s;
    const p = cssPaint(st.c);
    t.fills = p ? [p] : [];
    if (st.lh) t.lineHeight = { value: st.lh, unit: "PIXELS" };
    if (st.ls) t.letterSpacing = { value: st.ls, unit: "PIXELS" };
    if (st.td === "underline") t.textDecoration = "UNDERLINE";
    if (st.td === "line-through") t.textDecoration = "STRIKETHROUGH";
    const align = st.a === "center" ? "CENTER" : st.a === "right" || st.a === "end" ? "RIGHT" : "LEFT";
    t.name = n.t.slice(0, 40);
    parent.appendChild(t);
    if (n.lines > 1) {
      t.textAlignHorizontal = align;
      t.resize(Math.ceil(n.w) + 1, Math.max(1, n.h));
      t.textAutoResize = "HEIGHT";
      t.x = n.x - ox;
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
      t.x = n.x - ox;
    }
    t.y = n.y - oy + (n.lines > 1 ? 0 : (n.h - t.height) / 2);
    return;
  }
  if (n.k === "svg") {
    try {
      const v = figma.createNodeFromSvg(n.svg);
      v.name = "Icon";
      parent.appendChild(v);
      v.x = n.x - ox;
      v.y = n.y - oy;
      if (n.o !== undefined && n.o < 1) v.opacity = n.o;
    } catch {
      // Unsupported SVG features: skip the icon rather than fail the screen.
    }
    return;
  }
  if (n.k === "img") {
    const r = figma.createRectangle();
    r.name = "Image";
    r.resize(Math.max(1, n.w), Math.max(1, n.h));
    const paint = imagePaint(n.data, n.fit === "contain" ? "FIT" : "FILL");
    r.fills = paint ? [paint] : [solid("#E5E7EB")];
    if (n.r) r.cornerRadius = n.r;
    parent.appendChild(r);
    r.x = n.x - ox;
    r.y = n.y - oy;
    return;
  }
  const f = figma.createFrame();
  f.name = n.n && n.n !== "div" ? n.n : "Box";
  f.resize(Math.max(0.01, n.w), Math.max(0.01, n.h));
  const fills: Paint[] = [];
  const bg = n.bg && cssPaint(n.bg);
  if (bg) fills.push(bg);
  const gr = n.grad && cssGradient(n.grad);
  if (gr) fills.push(gr);
  const im = n.bgImg && imagePaint(n.bgImg, /contain/.test(n.bgSize || "") ? "FIT" : "FILL");
  if (im) fills.push(im);
  f.fills = fills;
  if (n.rad) {
    f.topLeftRadius = n.rad[0];
    f.topRightRadius = n.rad[1];
    f.bottomRightRadius = n.rad[2];
    f.bottomLeftRadius = n.rad[3];
  }
  if (n.bw) {
    const sp = cssPaint(n.bc);
    if (sp) {
      f.strokes = [sp];
      f.strokeAlign = "INSIDE";
      f.strokeTopWeight = n.bw[0];
      f.strokeRightWeight = n.bw[1];
      f.strokeBottomWeight = n.bw[2];
      f.strokeLeftWeight = n.bw[3];
      if (n.dash) f.dashPattern = [4, 4];
    }
  }
  if (n.sh) f.effects = cssShadows(n.sh);
  if (n.o !== undefined) f.opacity = n.o;
  f.clipsContent = !!n.clip;
  parent.appendChild(f);
  f.x = n.x - ox;
  f.y = n.y - oy;
  for (const k of n.kids || []) await capNode(k, f, n.x, n.y);
}
async function drawCapture(cap: any, name: string): Promise<FrameNode> {
  const f = figma.createFrame();
  f.name = name;
  f.resize(cap.w, cap.h);
  const bg = cssPaint(cap.bg);
  f.fills = bg ? [bg] : [solid("#FFFFFF")];
  f.clipsContent = true;
  for (const k of cap.kids || []) await capNode(k, f, 0, 0);
  return f;
}

async function buildApp(app: any, page: PageNode, notes: boolean, registry: Map<string, ComponentNode>): Promise<void> {
  await figma.setCurrentPageAsync(page);
  const board = own(box(app.name + " · handoff", "VERTICAL", { gap: 120, p: 120, fill: "#F2F4F7" }));
  page.appendChild(board);
  const count = app.sections.reduce((n: number, s: any) => n + s.screens.length, 0);
  boardHeader(
    board,
    app.name,
    `${count} screens · ${app.platform === "mobile" ? "iOS & Android (React Native, 390 × 844 pt)" : "Web (React + shadcn/ui, 1440 px)"} · Each screen is a component; flows reuse instances. Purple/blue/green chips mark effects on other apps.`,
    APP_COLOR[app.id],
  );
  let n = 0;
  for (const section of app.sections) {
    const sec = add(board, box("Section / " + section.section, "VERTICAL", { gap: 40 }));
    sec.appendChild(text(section.section, { size: 32, font: "b", color: "#101828" }));
    const row = add(sec, box("Screens", "HORIZONTAL", { gap: 100, align: "MIN" }));
    for (const s of section.screens) {
      n++;
      report(`${app.name}: ${s.name}`);
      const idx = `${app.id[0].toUpperCase()}-${String(n).padStart(2, "0")}`;
      const pair = add(row, box("Screen / " + s.id, "VERTICAL", { gap: 16 }));
      const label = spacerRow(pair, 10);
      label.layoutSizingHorizontal = "HUG";
      label.appendChild(text(`${idx}  ${s.name}`, { size: 20, font: "s", color: "#101828" }));
      if (s.tag) label.appendChild(pill(s.tag.toUpperCase(), s.tag === "New" ? "blue" : "amber", true));
      const body = add(pair, box("Body", "HORIZONTAL", { gap: 32, align: "MIN" }));
      const cap = CAPTURES[s.id];
      const frame = cap ? await drawCapture(cap, s.name) : app.platform === "mobile" ? await mobileScreen(app, s) : await adminScreen(app, s);
      body.appendChild(frame);
      const comp = figma.createComponentFromNode(frame);
      comp.name = `${app.name} / ${idx} ${s.name}`;
      comp.description = [s.purpose, "Route: " + s.route].filter(Boolean).join("\n");
      comp.setPluginData("lm-screen", s.id);
      if (app.platform === "mobile") {
        comp.cornerRadius = 36;
        comp.effects = [{ type: "DROP_SHADOW", color: { r: 0.06, g: 0.09, b: 0.16, a: 0.12 }, offset: { x: 0, y: 12 }, radius: 32, spread: 0, visible: true, blendMode: "NORMAL" }];
      }
      registry.set(s.id, comp);
      if (notes) body.appendChild(annotation(app.id, s, idx));
      progressDone++;
      await tick();
    }
  }
  board.x = 0;
  board.y = 0;
  board.setRelaunchData({ [RELAUNCH_KEY]: "Regenerate this handoff" });
}

async function findScreen(id: string, registry: Map<string, ComponentNode>): Promise<ComponentNode | null> {
  if (registry.has(id)) return registry.get(id) || null;
  for (const p of figma.root.children) {
    const key = p.getPluginData(OWNER);
    if (!["customer", "driver", "admin"].includes(key)) continue;
    await p.loadAsync();
    const found = p.findOne((n) => n.type === "COMPONENT" && n.getPluginData("lm-screen") === id) as ComponentNode | null;
    if (found) {
      registry.set(id, found);
      return found;
    }
  }
  return null;
}

async function arrow(parent: FrameNode, pts: { x: number; y: number }[], color: string, dashed = false): Promise<VectorNode> {
  const v = figma.createVector();
  v.name = "Arrow";
  parent.appendChild(v);
  v.x = 0;
  v.y = 0;
  const vertices: any[] = pts.map((p) => ({ x: p.x, y: p.y }));
  vertices[vertices.length - 1].strokeCap = "ARROW_EQUILATERAL";
  await v.setVectorNetworkAsync({
    vertices,
    segments: pts.slice(1).map((_, i) => ({ start: i, end: i + 1 })),
  });
  v.strokes = [solid(color)];
  v.strokeWeight = 2;
  v.strokeJoin = "ROUND";
  if (dashed) v.dashPattern = [6, 6];
  return v;
}

const LANES = ["customer", "system", "driver", "admin"];
const COL_W = 360;
const CARD_W = 280;
const LANE_LABEL = 200;

async function flowBoard(flow: any, registry: Map<string, ComponentNode>): Promise<FrameNode> {
  const cols = Math.max(...flow.steps.map((s: any) => s.col)) + 1;
  const rowsPer: Record<string, number> = {};
  for (const l of LANES) rowsPer[l] = Math.max(0, ...flow.steps.filter((s: any) => s.lane === l).map((s: any) => (s.row || 0) + 1));
  // Journeys (flow.big) show each captured step large enough to read.
  const shotH = flow.big ? 640 : 400;
  const cardH = (st: any) => (st.screen ? shotH : 120);
  const laneH: Record<string, number> = {};
  for (const l of LANES) {
    const steps = flow.steps.filter((s: any) => s.lane === l);
    const rows = rowsPer[l];
    const tallest = steps.some((s: any) => s.screen) ? shotH : 120;
    laneH[l] = rows ? rows * (tallest + 30) + 30 : 70;
  }
  const head = 170;
  const width = LANE_LABEL + cols * COL_W + 60;
  const height = head + LANES.reduce((n, l) => n + laneH[l], 0) + 40;
  const f = own(figma.createFrame());
  f.name = "Flow / " + flow.title;
  f.resize(width, height);
  f.cornerRadius = 24;
  f.fills = [solid("#FFFFFF")];
  f.strokes = [solid("#E4E7EC")];
  const t = text(flow.title, { size: 30, font: "b", color: "#101828" });
  f.appendChild(t);
  t.x = 40;
  t.y = 36;
  const sum = text(flow.summary, { size: 15, color: "#475467", lh: 145 });
  f.appendChild(sum);
  sum.x = 40;
  sum.y = 86;
  sum.resize(Math.min(width - 80, 1200), sum.height);
  sum.textAutoResize = "HEIGHT";
  const laneY: Record<string, number> = {};
  let y = head;
  for (const l of LANES) {
    laneY[l] = y;
    const band = figma.createRectangle();
    band.name = "Lane / " + APP_NAME[l];
    band.resize(width - 40, laneH[l]);
    band.x = 20;
    band.y = y;
    band.cornerRadius = 16;
    band.fills = [solid(APP_COLOR[l], 0.05)];
    f.appendChild(band);
    const lab = text(APP_NAME[l], { size: 15, font: "b", color: APP_COLOR[l] });
    f.appendChild(lab);
    lab.x = 40;
    lab.y = y + 20;
    y += laneH[l];
  }
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (const [i, st] of flow.steps.entries()) {
    const card = box("Step / " + st.label, "VERTICAL", { w: CARD_W, p: 14, gap: 8, r: 14, fill: "#FFFFFF", stroke: APP_COLOR[st.lane] });
    const top = spacerRow(card, 8);
    top.appendChild(pill(String(i + 1), "neutral", true));
    const lt = add(top, text(st.label, { size: 13, font: "s", color: "#101828", lh: 135 }));
    lt.layoutGrow = 1;
    lt.textAutoResize = "HEIGHT";
    if (st.api) para(card, st.api, { size: 11, font: "m", color: "#1D4ED8" });
    if (st.screen) {
      const comp = await findScreen(st.screen, registry);
      const room = flow.big ? 520 : 280;
      const holder = add(card, box("Screen thumbnail", "VERTICAL", { h: room + 10, r: 10, fill: "#F2F4F7", align: "CENTER", clip: true, p: [8, 0, 0, 0] }), true);
      const cap = CAPTURES[st.screen];
      if (comp) {
        const inst = comp.createInstance();
        inst.rescale(Math.min((CARD_W - 28) / comp.width, room / comp.height));
        holder.appendChild(inst);
      } else if (cap) {
        const shot = await drawCapture(cap, st.label);
        shot.rescale(Math.min((CARD_W - 28) / cap.w, room / cap.h));
        holder.appendChild(shot);
      } else
        para(holder, "Generate the " + APP_NAME[st.lane] + " page to show this screen.", { size: 11, color: "#667085", align: "CENTER" });
      para(card, st.screen, { size: 10, font: "m", color: "#667085" });
    }
    f.appendChild(card);
    card.x = LANE_LABEL + st.col * COL_W;
    card.y = laneY[st.lane] + 20 + (st.row || 0) * (cardH(st) + 30);
    rects.push({ x: card.x, y: card.y, w: card.width, h: card.height });
    await tick();
  }
  for (const [a, b, label] of flow.edges) {
    const A = rects[a];
    const B = rects[b];
    const color = APP_COLOR[flow.steps[b].lane];
    let pts;
    if (B.x > A.x + A.w) {
      const y1 = A.y + 40;
      const y2 = B.y + 40;
      const mx = A.x + A.w + (B.x - A.x - A.w) / 2;
      pts = [{ x: A.x + A.w, y: y1 }, { x: mx, y: y1 }, { x: mx, y: y2 }, { x: B.x, y: y2 }];
    } else {
      const x = A.x + A.w / 2;
      const down = B.y > A.y;
      pts = [{ x, y: down ? A.y + A.h : A.y }, { x, y: down ? B.y : B.y + B.h }];
    }
    await arrow(f, pts, color, label === "no change");
    if (label) {
      const l = box("Edge label", "HORIZONTAL", { p: [3, 8, 3, 8], r: 999, fill: "#FFFFFF", stroke: color });
      l.appendChild(text(label, { size: 10, font: "s", color }));
      f.appendChild(l);
      const mid = pts[Math.floor(pts.length / 2)];
      l.x = mid.x - l.width / 2;
      l.y = mid.y - l.height / 2 - (pts.length > 2 ? 0 : 0);
    }
  }
  return f;
}

async function buildFlows(spec: any, page: PageNode, registry: Map<string, ComponentNode>): Promise<void> {
  await figma.setCurrentPageAsync(page);
  const intro = own(box("Cross-app flows · intro", "VERTICAL", { w: 1600, gap: 14, p: 48, r: 24, fill: "#101828" }));
  page.appendChild(intro);
  para(intro, "Cross-app flows", { size: 48, font: "b", color: "#FFFFFF" });
  para(intro, "How an action in one app changes the others. Lanes: Customer app, Demo service, Driver app, Admin portal. Cards reuse the screen components, so they update when the screens are regenerated.", { size: 18, color: "#D0D5DD" });
  for (const s of spec.sync || []) para(intro, "• " + s, { size: 15, color: "#D0D5DD" });
  const legend = spacerRow(intro, 12);
  for (const l of LANES) {
    const c = box("Legend", "HORIZONTAL", { p: [6, 12, 6, 12], r: 999, fill: APP_COLOR[l] });
    c.appendChild(text(APP_NAME[l], { size: 13, font: "s", color: "#FFFFFF" }));
    legend.appendChild(c);
  }
  const dash = text("Dashed arrow = no visible change on that app", { size: 13, color: "#D0D5DD" });
  legend.appendChild(dash);
  intro.x = 0;
  intro.y = 0;
  let y = intro.height + 120;
  for (const flow of spec.flows) {
    report("Flow: " + flow.title);
    const f = await flowBoard(flow, registry);
    page.appendChild(f);
    f.x = 0;
    f.y = y;
    y += f.height + 160;
    progressDone++;
    await tick();
  }
}

async function buildMachines(spec: any, page: PageNode): Promise<void> {
  await figma.setCurrentPageAsync(page);
  let y = 0;
  for (const m of spec.machines || []) {
    const f = own(box("State machine / " + m.title, "VERTICAL", { w: 1600, p: 48, gap: 24, r: 24, fill: "#FFFFFF", stroke: "#E4E7EC" }));
    page.appendChild(f);
    para(f, m.title, { size: 32, font: "b", color: "#101828" });
    para(f, "Source: " + m.source, { size: 13, font: "m", color: "#1D4ED8" });
    const states = add(f, box("States", "HORIZONTAL", { gap: 12, wrap: true }), true);
    for (const s of m.states) states.appendChild(pill(s, statusTone(s)));
    const list = add(f, box("Transitions", "VERTICAL", { gap: 0, r: 12, stroke: "#EAECF0", clip: true }), true);
    for (const [a, b, why] of m.transitions) {
      const r = add(list, box("Transition", "HORIZONTAL", { p: [12, 16, 12, 16], gap: 14, align: "CENTER" }), true);
      r.strokes = [solid("#EAECF0")];
      r.strokeTopWeight = 1;
      r.strokeBottomWeight = 0;
      r.strokeLeftWeight = 0;
      r.strokeRightWeight = 0;
      r.appendChild(pill(a, statusTone(a), true));
      r.appendChild(icon("arrow-right", 16, "#667085"));
      r.appendChild(pill(b, statusTone(b), true));
      r.appendChild(text(why, { size: 13, color: "#344054" }));
    }
    f.x = 0;
    f.y = y;
    y += f.height + 120;
  }
}

async function buildFoundations(spec: any, page: PageNode): Promise<void> {
  await figma.setCurrentPageAsync(page);
  const board = own(box("Foundations", "VERTICAL", { w: 1800, gap: 48, p: 80, fill: "#FFFFFF", r: 24 }));
  page.appendChild(board);
  boardHeader(board, "Foundations", "Colour tokens and components exactly as used in packages/mobile/src/ui.tsx, customerTheme.ts and apps/admin/src/index.css.", "#101828");
  for (const [group, toks] of Object.entries(spec.tokens) as [string, any][]) {
    para(board, group === "mobile" ? "Mobile tokens (C in ui.tsx)" : group === "cargo" ? "Customer & cargo tokens (customerTheme.ts)" : "Admin tokens (index.css)", { size: 22, font: "b", color: "#101828" });
    const r = add(board, box("Swatches", "HORIZONTAL", { gap: 20, wrap: true }), true);
    for (const [name, hex] of Object.entries(toks) as [string, string][]) {
      const s = box("Token / " + name, "VERTICAL", { w: 150, gap: 8 });
      const sw = figma.createRectangle();
      sw.resize(150, 90);
      sw.cornerRadius = 12;
      sw.fills = [solid(hex)];
      sw.strokes = [solid("#EAECF0")];
      s.appendChild(sw);
      s.appendChild(text(name, { size: 13, font: "s", color: "#101828" }));
      s.appendChild(text(hex, { size: 12, color: "#667085" }));
      r.appendChild(s);
    }
  }
  T = { ...spec.tokens.mobile, ...(spec.tokens.cargo || {}) };
  para(board, "Mobile components", { size: 22, font: "b", color: "#101828" });
  const comps = add(board, box("Mobile components", "HORIZONTAL", { gap: 32, wrap: true }), true);
  const samples: [string, any[]][] = [
    ["Buttons", [{ t: "btn", text: "Order a truck" }, { t: "btn", text: "Use my current location", v: "ghost" }, { t: "btn", text: "Cancel order", v: "danger" }]],
    ["Home actions", [{ t: "ctabar", title: "Order a cargo truck", sub: "Set pickup and destination" }, { t: "wallet", label: "Wallet balance", value: "UGX 0", cta: "Add funds" }]],
    ["Field & chips", [{ t: "field", label: "Search orders", ph: "Order ID or location" }, { t: "chips", items: ["All", "Active", "Completed"], sel: 0 }]],
    ["Card & list", [{ t: "card", heading: "Stop 1 · Nakawa Market", lines: ["1 × Furniture boxes"], note: "Recipient PIN required" }, { t: "list", items: [{ title: "LM-1EA1A628", sub: "Ntinda → Acacia Mall", badge: "ACCEPTED", tone: "green" }] }]],
    ["Badges & toggle", [{ t: "badges", items: [["DELIVERED", "green"], ["SCHEDULED", "amber"], ["MISSED", "red"]] }, { t: "toggle", label: "You’re online", on: true }]],
  ];
  for (const [name, blocks] of samples) {
    const col = box("Sample / " + name, "VERTICAL", { w: 350, gap: 12, p: 20, r: 18, fill: T.paper });
    col.appendChild(text(name, { size: 13, font: "s", color: "#667085" }));
    for (const b of blocks) await mobileBlock(col, b, {});
    comps.appendChild(col);
  }
  para(board, "Typography · Inter (iOS uses SF Pro, Android Roboto at runtime)", { size: 22, font: "b", color: "#101828" });
  for (const [label, o] of [["Screen title · 20 Bold", { size: 20, font: "b" }], ["Section · 17 Bold", { size: 17, font: "b" }], ["Body · 14 Regular", { size: 14 }], ["EYEBROW · 11 SEMI BOLD · +6%", { size: 11, font: "s", ls: 6, color: T.green }]] as [string, TextOpts][])
    para(board, label, o);
  board.x = 0;
  board.y = 0;
}

async function buildCover(spec: any, page: PageNode, made: string[]): Promise<FrameNode> {
  await figma.setCurrentPageAsync(page);
  const c = own(box("Cover", "VERTICAL", { w: 1600, p: 96, gap: 28, r: 32, fill: "#087443" }));
  page.appendChild(c);
  para(c, "↗ LoadMaster", { size: 28, font: "b", color: "#DBF394" });
  para(c, spec.name, { size: 64, font: "b", color: "#FFFFFF", lh: 110 });
  const counts = spec.apps.map((a: any) => `${a.name}: ${a.sections.reduce((n: number, s: any) => n + s.screens.length, 0)} screens`).join(" · ");
  para(c, `${counts} · ${spec.flows.length} cross-app flows`, { size: 20, color: "#DDF3E6" });
  para(c, "Generated " + new Date(spec.generatedAt || Date.now()).toLocaleString() + " from the LoadMaster V2 codebase (design/handoff/spec.mjs, validated by npm run handoff).", { size: 15, color: "#C8EBD5" });
  para(c, "Pages", { size: 14, font: "s", color: "#DBF394", ls: 8, upper: true });
  for (const key of made) para(c, PAGES[key], { size: 20, font: "m", color: "#FFFFFF" });
  para(c, "How to read this file", { size: 14, font: "s", color: "#DBF394", ls: 8, upper: true });
  for (const line of [
    "Every screen is a component named “App / ID Name”. Its annotation lists the route, purpose, actions with API calls, states and errors.",
    "Coloured “→ App” chips show what an action changes in another app, so developers can trace cross-app impact screen by screen.",
    "NEW = added in this release (4-step wizard, multi-stop PIN handover, pairing, cash, chat, missed/declined requests). UPDATED = changed screen.",
    "Cross-app flows reuse instances of the screens in swim lanes for Customer, Demo service, Driver and Admin.",
  ])
    para(c, "• " + line, { size: 16, color: "#E9F7EE" });
  c.x = 0;
  c.y = 0;
  c.setRelaunchData({ [RELAUNCH_KEY]: "Regenerate this handoff" });
  return c;
}

// ---------------------------------------------------------------- run
function summary(spec: any) {
  return {
    name: spec.name,
    generatedAt: spec.generatedAt,
    apps: spec.apps.map((a: any) => [a.id, a.sections.reduce((n: number, s: any) => n + s.screens.length, 0)]),
    flows: spec.flows.length,
  };
}
function checkSpec(spec: any): string | null {
  if (!spec || !Array.isArray(spec.apps) || !Array.isArray(spec.flows)) return "This file isn’t a LoadMaster handoff spec. Use loadmaster-handoff.json from design/handoff.";
  for (const id of ["customer", "driver", "admin"]) if (!spec.apps.some((a: any) => a.id === id)) return `The spec is missing the ${id} app.`;
  return null;
}

async function storedSpec(): Promise<any> {
  try {
    const raw = await figma.clientStorage.getAsync(STORE_KEY);
    return typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function generate(msg: Extract<UiMessage, { type: "generate" }>): Promise<void> {
  let spec = DEFAULT_SPEC;
  if (msg.specText) {
    try {
      spec = JSON.parse(msg.specText);
    } catch {
      figma.ui.postMessage({ type: "error", text: "The uploaded file isn’t valid JSON." });
      return;
    }
  } else spec = (await storedSpec()) || DEFAULT_SPEC;
  if (!spec) {
    figma.ui.postMessage({ type: "error", text: "Choose loadmaster-handoff.json first." });
    return;
  }
  const problem = checkSpec(spec);
  if (problem) {
    figma.ui.postMessage({ type: "error", text: problem });
    return;
  }
  if (msg.specText) {
    try {
      await figma.clientStorage.setAsync(STORE_KEY, msg.specText);
    } catch {
      // Not fatal: the spec just has to be chosen again next time.
    }
  }
  const parts = msg.parts;
  const appsWanted = spec.apps.filter((a: any) => (parts as any)[a.id]);
  if (!appsWanted.length && !parts.flows && !parts.foundations) {
    figma.ui.postMessage({ type: "error", text: "Choose at least one part to generate." });
    return;
  }
  try {
    report("Loading fonts…");
    await loadFonts();
  } catch {
    figma.ui.postMessage({ type: "error", text: "Inter isn’t available in this file, so the plugin can’t draw text." });
    return;
  }
  progressDone = 0;
  progressTotal =
    appsWanted.reduce((n: number, a: any) => n + a.sections.reduce((m: number, s: any) => m + s.screens.length, 0), 0) +
    (parts.flows ? spec.flows.length : 0) +
    1;
  CARGO_T = spec.tokens.cargo || {};
  ICON_PATHS = { ...ICON_PATHS, ...(spec.icons || {}) };
  CAPTURES = spec.captures || {};
  const registry = new Map<string, ComponentNode>();
  const made: string[] = [];
  const start = figma.currentPage;
  try {
    if (parts.foundations) {
      report("Foundations");
      await buildFoundations(spec, await pageFor("foundations", msg.replace));
      made.push("foundations");
    }
    for (const app of appsWanted) {
      T = app.platform === "mobile" ? { ...spec.tokens.mobile } : { ...spec.tokens.admin, ...spec.tokens.mobile, ...spec.tokens.admin };
      await buildApp(app, await pageFor(app.id, msg.replace), msg.notes, registry);
      made.push(app.id);
    }
    if (parts.flows) {
      T = { ...spec.tokens.mobile, ...spec.tokens.admin };
      await buildFlows(spec, await pageFor("flows", msg.replace), registry);
      await buildMachines(spec, await pageFor("machines", msg.replace));
      made.push("flows", "machines");
    }
    T = { ...spec.tokens.mobile };
    const coverPage = await pageFor("cover", msg.replace);
    const cover = await buildCover(spec, coverPage, ["cover", ...made]);
    // Keep the generated pages in a predictable order after the cover.
    const order = ["cover", "foundations", "customer", "driver", "admin", "flows", "machines"];
    let at = 0;
    for (const key of order) {
      const p = figma.root.children.find((x) => x.getPluginData(OWNER) === key);
      if (p) figma.root.insertChild(at++, p);
    }
    figma.viewport.scrollAndZoomIntoView([cover]);
    const screens = registry.size;
    figma.ui.postMessage({
      type: "done",
      text: `Handoff ready: ${made.length + 1} pages${screens ? `, ${screens} screen components` : ""}${parts.flows ? `, ${spec.flows.length} flows` : ""}.`,
    });
    figma.notify("LoadMaster handoff generated");
  } catch (e) {
    await figma.setCurrentPageAsync(start).catch(() => undefined);
    figma.ui.postMessage({ type: "error", text: "Generation stopped: " + (e instanceof Error ? e.message : String(e)) });
  }
}

figma.showUI(__html__, { width: PANEL_WIDTH, height: 460 });
figma.root.setRelaunchData({ [RELAUNCH_KEY]: "Generate the LoadMaster developer handoff" });
figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === "resize") {
    figma.ui.resize(PANEL_WIDTH, Math.max(120, Math.min(900, Math.round(message.height))));
    return;
  }
  if (message.type === "ready") {
    const existing = figma.root.children.filter((p) => p.getPluginData(OWNER)).length;
    const spec = (await storedSpec()) || DEFAULT_SPEC;
    figma.ui.postMessage({ type: "info", spec: spec && !checkSpec(spec) ? summary(spec) : null, existing });
    return;
  }
  if (message.type === "generate") await generate(message);
};
