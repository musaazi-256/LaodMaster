import { DomainError } from "./model.mjs";
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const cache = new Map();
export async function routePreview(store, actor, b) {
  let places = b.orderId ? [] : store.snapshot(actor).places;
  let ids = b.placeIds;
  if (b.orderId) {
    const staff = store.seesTrips?.(actor);
    const o = staff
      ? store.state.orders.find((o) => o.id === b.orderId)
      : store.order(b.orderId, actor);
    if (!o) throw new DomainError("NOT_FOUND", "Trip not found.", 404);
    if (!staff && o.customerId !== actor && o.driverId !== actor)
      throw new DomainError(
        "FORBIDDEN",
        "This route belongs to another order.",
        403,
      );
    places = [
      o.quote.pickup,
      ...(o.cargoPlan?.stops.map((s) => s.place) || [o.quote.destination]),
    ];
    ids = places.map((p) => p.id);
  }
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 6)
    throw new DomainError(
      "ROUTE_INVALID",
      "Select pickup and up to five destinations.",
      422,
    );
  const points = ids.map((id) => places.find((p) => p.id === id));
  if (points.some((p) => !p))
    throw new DomainError("ROUTE_INVALID", "Choose supported locations.", 422);
  const coords = points.map((p) => [p.longitude, p.latitude]);
  const key = JSON.stringify(coords);
  if (cache.get(key)?.expires > Date.now()) return cache.get(key).value;
  let result;
  try {
    const r = await fetch(
      "https://router.project-osrm.org/route/v1/driving/" +
        coords.map((p) => p.join(",")).join(";") +
        "?overview=full&geometries=geojson",
      { signal: AbortSignal.timeout(5000) },
    );
    const json = await r.json();
    const route = json.routes?.[0];
    if (!r.ok || !route?.geometry?.coordinates?.length) throw Error("No route");
    result = {
      coordinates: route.geometry.coordinates,
      distanceKm: route.distance / 1000,
      durationMinutes: Math.ceil(route.duration / 60),
      source: "road-preview",
      label:
        "Road preview · estimated travel time; not live driver GPS or truck clearance guidance",
    };
  } catch {
    result = {
      coordinates: coords,
      source: "direct-preview",
      label:
        "Road routing unavailable. Approximate direct connection shown; not a road route.",
    };
  }
  cache.set(key, { value: result, expires: Date.now() + 300000 });
  return result;
}
export function publicPage(kind, token, data) {
  const tracking = kind === "track";
  const title = tracking ? "Delivery updates" : "Recipient transport payment";
  const content = tracking
    ? `<p>${escape(data.id)} · ${escape(data.stage)}</p><p>${escape(data.pickup)} → ${escape(data.destination)}</p><p>${escape(data.tracking)}</p>${(data.stops || []).map((s, i) => `<p>${i + 1}. ${escape(s.name)} · ${escape(s.status)}</p>`).join("")}<p>${data.driver ? escape(data.driver.name + " · " + data.driver.vehicle + " · " + data.driver.plate) : "Awaiting driver"}</p><button onclick="location.reload()">Refresh updates</button>`
    : `<p>${escape(data.id)}</p><h2>UGX ${Number(data.amount).toLocaleString()}</h2><p>Method: ${escape(data.method)} · Delivery: ${escape(data.stage)}</p><p>Payment: ${escape(data.status)}</p><p>Demo only. This page simulates recipient acceptance and payment. No real money, card numbers or PINs are required.</p>${!data.accepted ? '<button data-action="accept">Accept transport payment request</button>' : data.status === "paid" ? "<p>Payment confirmed. Your receipt reference is this order ID.</p>" : ["delivered", "returned"].includes(data.stage) ? `<button data-action="${data.method === "cash" ? "confirm-cash" : data.status === "unknown" ? "resolve" : data.status === "failed" ? "retry" : "approve"}">${data.method === "cash" ? "Confirm cash handed to driver" : "Approve demo payment"}</button>` : "<p>You have accepted. Payment becomes available after handover.</p>"}<button onclick="location.reload()">Refresh status</button><p id="error" role="alert"></p>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · LoadMaster</title><style>body{font:16px system-ui;background:#fafbfa;color:#111827;margin:0;padding:24px}main{max-width:560px;margin:30px auto;background:white;border:1px solid #e5e7eb;border-radius:24px;padding:24px}h1{font-size:24px}button{display:block;background:#087443;color:white;border:0;border-radius:12px;padding:14px;margin:16px 0;font:inherit}#error{color:#a62f37}</style></head><body><main><h1>${title}</h1>${content}</main><script>document.querySelectorAll('[data-action]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const response=await fetch('/pay/${token}/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:button.dataset.action,scenario:'success',method:${JSON.stringify(data.method || "mtn")}})});const result=await response.json();if(!response.ok)throw Error(result.error?.message||'Unable to confirm');location.reload();}catch(e){document.getElementById('error').textContent=e.message;button.disabled=false;}});</script></body></html>`;
}
