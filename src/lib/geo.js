// Approximate real-world coordinates for place names used across the app's mock
// data (Kampala metro area). Not survey-grade — good enough to put trips on an
// actual map instead of a fabricated curve.
const KNOWN_PLACES = {
  'kampala': [32.5811, 0.3136],
  'kampala central': [32.5816, 0.3152],
  'nakasero': [32.5811, 0.3136],
  'ntinda': [32.6119, 0.3492],
  'ntinda trading centre': [32.6119, 0.3492],
  'nakawa': [32.618, 0.3286],
  'kira': [32.6408, 0.3743],
  'kira, bulindo': [32.6497, 0.3853],
  'bulindo': [32.6497, 0.3853],
  'wandegeya': [32.5697, 0.3376],
  'kasubi': [32.5539, 0.3323],
  'kasubi, dam': [32.55, 0.33],
  'mukono': [32.7553, 0.3533],
  'mukono town': [32.7553, 0.3533],
  'jinja': [33.2026, 0.4478],
  'jinja road industrial area': [32.611, 0.322],
  'bwebajja': [32.4667, 0.2167],
  'entebbe': [32.4637, 0.0512],
  'entebbe international airport': [32.4435, 0.0424],
  'garden city mall': [32.587, 0.326],
  'acacia mall': [32.589, 0.338],
  'kisementi': [32.589, 0.338],
  'pickup': [32.588, 0.335],
  'drop-off': [32.63, 0.36],
  'dropoff': [32.63, 0.36],
  'destination': [32.63, 0.36],
};

export const KAMPALA_CENTER = [32.5825, 0.3476];

function normalize(label) {
  return String(label ?? '').toLowerCase().trim();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Deterministic fallback point scattered within the wider Kampala metro area
// (Kampala–Entebbe–Mukono–Jinja triangle) so unmatched free-text labels still
// land somewhere plausible instead of stacking on one spot.
function hashPoint(key) {
  const hash = hashString(key);
  const angle = ((hash % 360) + 360) % 360;
  const radius = 0.06 + (Math.abs(hash >> 8) % 100) / 1000; // ~0.06–0.16 deg
  const rad = (angle * Math.PI) / 180;
  return [KAMPALA_CENTER[0] + Math.cos(rad) * radius, KAMPALA_CENTER[1] + Math.sin(rad) * radius];
}

// Resolves a free-text place label to [lng, lat]. Tries an exact match against
// known places first, then a substring match in either direction, then falls
// back to a deterministic scattered point so the same label always resolves
// to the same spot.
export function resolvePlace(label) {
  const key = normalize(label);
  if (!key) return hashPoint('fallback');
  if (KNOWN_PLACES[key]) return KNOWN_PLACES[key];

  // Labels are commonly "Specific place, general area" (e.g. "Ntinda, Kampala").
  // Resolving against the first segment alone first means the specific place wins
  // even when the trailing area name (e.g. "kampala") is itself a known key that
  // would otherwise be found first by a plain substring scan over the whole string.
  const firstSegment = key.split(',')[0].trim();
  if (firstSegment && firstSegment !== key) {
    if (KNOWN_PLACES[firstSegment]) return KNOWN_PLACES[firstSegment];
    const segmentMatch = Object.keys(KNOWN_PLACES).find((k) => firstSegment.includes(k) || k.includes(firstSegment));
    if (segmentMatch) return KNOWN_PLACES[segmentMatch];
  }

  const match = Object.keys(KNOWN_PLACES).find((k) => key.includes(k) || k.includes(key));
  if (match) return KNOWN_PLACES[match];
  return hashPoint(key);
}

// A plausible "driver's current location" a short distance from the pickup
// point, on a deterministic bearing derived from the label so it's stable
// across re-renders.
// `angleOffsetDeg` lets a caller place several points around the same origin with a
// guaranteed angular separation (e.g. three decorative "nearby trucks"). Without it, two
// seeds that differ by only a trailing character (e.g. "...-truck2" vs "...-truck3") can
// hash to nearly the same angle — this simple hash doesn't have a strong avalanche effect
// for near-identical short strings — putting two points within meters of each other.
export function nearbyPoint(origin, seed, angleOffsetDeg = 0) {
  const hash = hashString(`driver-${seed}`);
  const angle = (((hash % 360) + 360) % 360 + angleOffsetDeg) % 360;
  const rad = (angle * Math.PI) / 180;
  const distance = 0.012 + (Math.abs(hash >> 4) % 10) / 1000; // ~1.2–2.2km
  return [origin[0] + Math.cos(rad) * distance, origin[1] + Math.sin(rad) * distance];
}

function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Returns { lng, lat, bearing } for the point `t` (0–1) of the way along a
// route's cumulative distance.
export function pointAlongRoute(coords, t) {
  if (!coords || coords.length === 0) return null;
  if (coords.length === 1) return { lng: coords[0][0], lat: coords[0][1], bearing: 0 };

  const segLengths = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversine(coords[i], coords[i + 1]);
    segLengths.push(d);
    total += d;
  }
  if (total === 0) return { lng: coords[0][0], lat: coords[0][1], bearing: 0 };

  const target = Math.max(0, Math.min(1, t)) * total;
  let covered = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (covered + segLen >= target || i === segLengths.length - 1) {
      const segT = segLen === 0 ? 0 : (target - covered) / segLen;
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      const lng = lng1 + (lng2 - lng1) * segT;
      const lat = lat1 + (lat2 - lat1) * segT;
      const bearing = (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI;
      return { lng, lat, bearing };
    }
    covered += segLen;
  }
  const last = coords[coords.length - 1];
  return { lng: last[0], lat: last[1], bearing: 0 };
}

// Returns the leading slice of `coords` covering the first `t` (0–1) fraction
// of cumulative distance — used to draw the "traveled" portion of a route.
export function sliceRoute(coords, t) {
  if (!coords || coords.length < 2) return coords ?? [];
  if (t <= 0) return [coords[0]];
  if (t >= 1) return coords;

  const point = pointAlongRoute(coords, t);
  const segLengths = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversine(coords[i], coords[i + 1]);
    segLengths.push(d);
    total += d;
  }
  const target = t * total;
  let covered = 0;
  const result = [coords[0]];
  for (let i = 0; i < segLengths.length; i++) {
    covered += segLengths[i];
    if (covered >= target) break;
    result.push(coords[i + 1]);
  }
  if (point) result.push([point.lng, point.lat]);
  return result;
}

const routeCache = new Map();

// Fetches a real driving route from OSRM's public demo router (no API key).
// Falls back to a straight line between the two points on any failure, so the
// UI never breaks if the free demo server is down or rate-limited.
export async function fetchRoute(origin, destination) {
  const cacheKey = `${origin[0].toFixed(5)},${origin[1].toFixed(5)};${destination[0].toFixed(5)},${destination[1].toFixed(5)}`;
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) throw new Error('No route geometry');
      return coords;
    } catch {
      return [origin, destination];
    }
  })();

  routeCache.set(cacheKey, promise);
  return promise;
}
