// Minimal TrueType reader: turns icon-font glyphs (Ionicons and friends, as used by
// @expo/vector-icons) into SVG markup so captured icons land in Figma as vectors.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const FONT_DIR = req.resolve("@expo/vector-icons/package.json").replace(/package\.json$/, "build/vendor/react-native-vector-icons/Fonts/");
const FILES = {
  ionicons: "Ionicons.ttf",
  feather: "Feather.ttf",
  material: "MaterialIcons.ttf",
  materialcommunityicons: "MaterialCommunityIcons.ttf",
  fontawesome: "FontAwesome.ttf",
  antdesign: "AntDesign.ttf",
  entypo: "Entypo.ttf",
  octicons: "Octicons.ttf",
};
const fonts = new Map();

export function isIconFont(family) {
  return Boolean(FILES[String(family).toLowerCase().replace(/[^a-z]/g, "")]);
}

function load(family) {
  const key = String(family).toLowerCase().replace(/[^a-z]/g, "");
  if (fonts.has(key)) return fonts.get(key);
  const buf = readFileSync(FONT_DIR + FILES[key]);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tables = {};
  const n = dv.getUint16(4);
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    tables[String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3])] = dv.getUint32(o + 8);
  }
  const upm = dv.getUint16(tables.head + 18);
  const locFormat = dv.getInt16(tables.head + 50);
  const asc = dv.getInt16(tables.hhea + 4);
  const desc = dv.getInt16(tables.hhea + 6);
  const numH = dv.getUint16(tables.hhea + 34);
  const numGlyphs = dv.getUint16(tables.maxp + 4);
  const loca = (g) => (locFormat ? dv.getUint32(tables.loca + g * 4) : dv.getUint16(tables.loca + g * 2) * 2);
  const advance = (g) => dv.getUint16(tables.hmtx + Math.min(g, numH - 1) * 4);
  // cmap: prefer format 12, else format 4.
  const cmap = new Map();
  const nSub = dv.getUint16(tables.cmap + 2);
  for (let i = 0; i < nSub; i++) {
    const off = tables.cmap + dv.getUint32(tables.cmap + 4 + i * 8 + 4);
    const fmt = dv.getUint16(off);
    if (fmt === 12) {
      const groups = dv.getUint32(off + 12);
      for (let gi = 0; gi < groups; gi++) {
        const g = off + 16 + gi * 12;
        const s = dv.getUint32(g);
        const e = dv.getUint32(g + 4);
        const id = dv.getUint32(g + 8);
        for (let c = s; c <= e; c++) cmap.set(c, id + c - s);
      }
    } else if (fmt === 4) {
      const segX2 = dv.getUint16(off + 6);
      const ends = off + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const ranges = deltas + segX2;
      for (let si = 0; si < segX2 / 2; si++) {
        const e = dv.getUint16(ends + si * 2);
        const s = dv.getUint16(starts + si * 2);
        const d = dv.getInt16(deltas + si * 2);
        const ro = dv.getUint16(ranges + si * 2);
        for (let c = s; c <= e && c !== 0xffff; c++) {
          let g;
          if (!ro) g = (c + d) & 0xffff;
          else {
            const at = ranges + si * 2 + ro + (c - s) * 2;
            g = dv.getUint16(at);
            if (g) g = (g + d) & 0xffff;
          }
          if (!cmap.has(c)) cmap.set(c, g);
        }
      }
    }
  }
  const outline = (g, dx = 0, dy = 0) => {
    if (g >= numGlyphs) return "";
    const start = tables.glyf + loca(g);
    if (loca(g + 1) === loca(g)) return "";
    const nc = dv.getInt16(start);
    if (nc < 0) {
      // Composite glyph: concatenate components with their x/y offsets.
      let p = start + 10;
      let d = "";
      for (;;) {
        const flags = dv.getUint16(p);
        const gi = dv.getUint16(p + 2);
        p += 4;
        let ox;
        let oy;
        if (flags & 1) {
          ox = dv.getInt16(p);
          oy = dv.getInt16(p + 2);
          p += 4;
        } else {
          ox = dv.getInt8(p);
          oy = dv.getInt8(p + 1);
          p += 2;
        }
        if (flags & 8) p += 2;
        else if (flags & 0x40) p += 4;
        else if (flags & 0x80) p += 8;
        d += outline(gi, dx + ox, dy + oy);
        if (!(flags & 0x20)) break;
      }
      return d;
    }
    let p = start + 10;
    const endPts = [];
    for (let i = 0; i < nc; i++) endPts.push(dv.getUint16(p + i * 2));
    p += nc * 2;
    p += 2 + dv.getUint16(p);
    const total = endPts[nc - 1] + 1;
    const flags = [];
    while (flags.length < total) {
      const f = buf[p++];
      flags.push(f);
      if (f & 8) {
        let r = buf[p++];
        while (r--) flags.push(f);
      }
    }
    const coord = (short, same) => {
      const out = [];
      let v = 0;
      for (const f of flags) {
        if (f & short) {
          const b = buf[p++];
          v += f & same ? b : -b;
        } else if (!(f & same)) {
          v += dv.getInt16(p);
          p += 2;
        }
        out.push(v);
      }
      return out;
    };
    const xs = coord(2, 16);
    const ys = coord(4, 32);
    let d = "";
    let s = 0;
    const P = (i) => [xs[i] + dx, -(ys[i] + dy)];
    for (const e of endPts) {
      const pts = [];
      for (let i = s; i <= e; i++) pts.push({ p: P(i), on: flags[i] & 1 });
      s = e + 1;
      if (!pts.length) continue;
      // Start on an on-curve point (or the midpoint of two off-curve points).
      let first = pts.findIndex((q) => q.on);
      let startPt;
      if (first < 0) {
        startPt = [(pts[0].p[0] + pts[1 % pts.length].p[0]) / 2, (pts[0].p[1] + pts[1 % pts.length].p[1]) / 2];
        first = 0;
      } else startPt = pts[first].p;
      d += `M${startPt[0]} ${startPt[1]}`;
      let ctrl = null;
      for (let k = 1; k <= pts.length; k++) {
        const q = pts[(first + k) % pts.length];
        if (q.on) {
          d += ctrl ? `Q${ctrl[0]} ${ctrl[1]} ${q.p[0]} ${q.p[1]}` : `L${q.p[0]} ${q.p[1]}`;
          ctrl = null;
        } else if (ctrl) {
          const mid = [(ctrl[0] + q.p[0]) / 2, (ctrl[1] + q.p[1]) / 2];
          d += `Q${ctrl[0]} ${ctrl[1]} ${mid[0]} ${mid[1]}`;
          ctrl = q.p;
        } else ctrl = q.p;
      }
      if (ctrl) d += `Q${ctrl[0]} ${ctrl[1]} ${startPt[0]} ${startPt[1]}`;
      d += "Z";
    }
    return d;
  };
  const font = { upm, asc, desc, cmap, outline, advance };
  fonts.set(key, font);
  return font;
}

/** SVG for one glyph at `size` px, laid out in a box of (w × h) the way the browser did. */
export function glyphSvg(family, char, size, color, w, h) {
  const f = load(family);
  const cp = char.codePointAt(0);
  const g = f.cmap.get(cp);
  if (g === undefined) return null;
  const d = f.outline(g);
  const scale = size / f.upm;
  const adv = f.advance(g);
  const boxH = (f.asc - f.desc) * scale;
  const top = (h - boxH) / 2;
  const svgW = Math.max(w, adv * scale);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${h}" viewBox="0 ${-f.asc - top / scale} ${svgW / scale} ${h / scale}"><path d="${d}" fill="${color}"/></svg>`,
    w: svgW,
  };
}
