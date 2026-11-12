// Runs inside the browser page. Walks the rendered DOM and returns a compact tree
// of what is actually painted: boxes (fill, border, radius, shadow, clipping),
// text runs with their computed type styles, inline SVG icons and images.
// Positions are absolute page coordinates; the Figma side makes them relative.
async (opts) => {
  const W = opts.width;
  const H = opts.height;
  const px = (v) => Math.round(parseFloat(v) * 100) / 100 || 0;
  const visibleColor = (c) => c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);
  const imgCache = new Map();
  const toData = async (src) => {
    if (imgCache.has(src)) return imgCache.get(src);
    let out = null;
    try {
      const blob = await (await fetch(src)).blob();
      out = await new Promise((r) => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result);
        fr.readAsDataURL(blob);
      });
    } catch {
      out = null;
    }
    imgCache.set(src, out);
    return out;
  };
  // Big images (map tiles, photos) are re-encoded as JPEG at 2x their shown size.
  const shrink = async (data, w, h) => {
    if (!data || data.length < 150000) return data;
    try {
      const im = new Image();
      im.src = data;
      await im.decode();
      const scale = Math.min(1, (2 * Math.max(w, 1)) / im.naturalWidth, (2 * Math.max(h, 1)) / im.naturalHeight);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * scale));
      c.height = Math.max(1, Math.round(im.naturalHeight * scale));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      const jpg = c.toDataURL("image/jpeg", 0.82);
      return jpg.length < data.length ? jpg : data;
    } catch {
      return data;
    }
  };
  const inView = (r) => r.width > 0.5 && r.height > 0.5 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H;

  const svgMarkup = (svg, color) => {
    const clone = svg.cloneNode(true);
    const r = svg.getBoundingClientRect();
    clone.setAttribute("width", String(r.width));
    clone.setAttribute("height", String(r.height));
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Inline computed paint so currentColor and CSS-driven fills survive.
    const src = [svg, ...svg.querySelectorAll("*")];
    const dst = [clone, ...clone.querySelectorAll("*")];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      for (const k of ["fill", "stroke"]) {
        const v = cs[k];
        if (v && v !== "none") dst[i].setAttribute(k, v === "currentcolor" || v === "currentColor" ? color : v);
        else if (v === "none") dst[i].setAttribute(k, "none");
      }
      if (cs.strokeWidth && el !== svg) dst[i].setAttribute("stroke-width", cs.strokeWidth);
      if (cs.opacity !== "1") dst[i].setAttribute("opacity", cs.opacity);
    });
    return clone.outerHTML.replace(/currentColor/g, color);
  };

  const textStyle = (cs) => ({
    f: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
    s: px(cs.fontSize),
    w: parseInt(cs.fontWeight, 10) || 400,
    i: cs.fontStyle === "italic" ? 1 : 0,
    c: cs.color,
    lh: cs.lineHeight === "normal" ? 0 : px(cs.lineHeight),
    ls: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
    a: cs.textAlign,
    tt: cs.textTransform !== "none" ? cs.textTransform : undefined,
    td: cs.textDecorationLine !== "none" ? cs.textDecorationLine : undefined,
  });

  async function walk(el, inheritedOpacity) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return null;
    // Inactive navigator screens stay mounted, hidden behind the active one.
    if (el.getAttribute("aria-hidden") === "true" && el.getBoundingClientRect().width >= W * 0.9) return null;
    const op = parseFloat(cs.opacity);
    if (op === 0) return null;
    const r = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const name = el.getAttribute("data-testid") || el.getAttribute("aria-label") || el.getAttribute("role") || tag;

    if (tag === "svg") {
      if (!inView(r)) return null;
      return { k: "svg", n: name, x: r.left, y: r.top, w: r.width, h: r.height, o: op, svg: svgMarkup(el, cs.color) };
    }
    if (tag === "img" || tag === "canvas" || tag === "video") {
      if (!inView(r)) return null;
      let data = null;
      if (tag === "img") data = await shrink(await toData(el.currentSrc || el.src), r.width, r.height);
      else if (tag === "canvas") {
        try {
          data = await shrink(el.toDataURL("image/png"), r.width, r.height);
        } catch {
          data = null;
        }
      }
      return { k: "img", n: name, x: r.left, y: r.top, w: r.width, h: r.height, o: op, r: px(cs.borderTopLeftRadius), fit: cs.objectFit, data };
    }

    const node = { k: "box", n: name, x: r.left, y: r.top, w: r.width, h: r.height, kids: [] };
    if (tag === "input" || tag === "textarea") {
      const value = el.value || el.placeholder || "";
      if (value && el.type !== "hidden" && el.type !== "checkbox") {
        const ph = !el.value;
        const st = textStyle(ph ? getComputedStyle(el, "::placeholder") : cs);
        if (ph) st.c = getComputedStyle(el, "::placeholder").color;
        const left = r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth);
        const lh = st.lh || st.s * 1.2;
        const top = tag === "textarea" ? r.top + px(cs.paddingTop) + px(cs.borderTopWidth) : r.top + (r.height - lh) / 2;
        const shown = el.type === "password" && el.value ? "•".repeat(el.value.length) : value;
        node.kids.push({ k: "text", x: left, y: top, w: r.width - px(cs.paddingLeft) - px(cs.paddingRight), h: lh, t: shown, lines: 1, st });
      }
    }
    if (op < 1) node.o = op;
    if (visibleColor(cs.backgroundColor)) node.bg = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      const m = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (m) node.bgImg = await shrink(await toData(m[1]), r.width, r.height);
      else node.grad = cs.backgroundImage;
      if (m) node.bgSize = cs.backgroundSize;
    }
    const bw = ["Top", "Right", "Bottom", "Left"].map((s) => px(cs["border" + s + "Width"]));
    const bc = ["Top", "Right", "Bottom", "Left"].map((s) => cs["border" + s + "Color"]);
    const bs = ["Top", "Right", "Bottom", "Left"].map((s) => cs["border" + s + "Style"]);
    if (bw.some((w, i) => w > 0 && bs[i] !== "none" && visibleColor(bc[i]))) {
      node.bw = bw.map((w, i) => (bs[i] === "none" || !visibleColor(bc[i]) ? 0 : w));
      node.bc = bc.find((c, i) => node.bw[i] > 0);
      if (bs.includes("dashed")) node.dash = 1;
    }
    const rad = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((s) => Math.min(px(cs["border" + s + "Radius"]), r.width / 2, r.height / 2));
    if (rad.some((x) => x > 0)) node.rad = rad;
    if (cs.boxShadow && cs.boxShadow !== "none") node.sh = cs.boxShadow;
    if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") node.clip = 1;
    if (cs.transform && cs.transform !== "none") node.tf = cs.transform;

    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const t = child.textContent;
        if (!t || !t.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(child);
        const rects = [...range.getClientRects()].filter((q) => q.width > 0);
        if (!rects.length) continue;
        const left = Math.min(...rects.map((q) => q.left));
        const top = Math.min(...rects.map((q) => q.top));
        const right = Math.max(...rects.map((q) => q.right));
        const bottom = Math.max(...rects.map((q) => q.bottom));
        if (!inView({ left, top, right, bottom, width: right - left, height: bottom - top })) continue;
        const lines = new Set(rects.map((q) => Math.round(q.top))).size;
        node.kids.push({ k: "text", x: left, y: top, w: right - left, h: bottom - top, t: t.replace(/\s+/g, " ").trim(), lines, st: textStyle(cs) });
      } else if (child.nodeType === 1) {
        const k = await walk(child, op);
        if (k) node.kids.push(k);
      }
    }
    // Pure layout wrappers paint nothing: hoist their children to keep layers lean.
    const paints = node.bg || node.grad || node.bgImg || node.bw || node.sh;
    if (!inView(r) && !paints) return node.kids.length ? { k: "group", kids: node.kids } : null;
    if (!paints && !(node.clip && node.kids.length) && !node.o) return node.kids.length ? { k: "group", kids: node.kids } : null;
    if (!inView(r)) return null;
    return node;
  }

  const flat = (n) => (n && n.k === "group" ? n.kids.flatMap(flat) : n ? [n] : []);
  const fix = (n) => {
    if (n.kids) n.kids = n.kids.flatMap(flat).map(fix);
    return n;
  };
  const root = await walk(document.body, 1);
  const kids = flat(root).map(fix);
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  return { w: W, h: H, bg: visibleColor(bodyBg) ? bodyBg : "rgb(255, 255, 255)", kids };
};
