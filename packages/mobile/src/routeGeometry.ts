import type { Place, Stage } from "../../contracts/src";
export type Coordinate = [number, number];
const distance = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Route-length interpolation, adapted from the backup. It is visual simulation, not GPS. */
export function pointAlongRoute(
  coords: number[][],
  fraction: number,
): Coordinate {
  if (!coords.length) return [32.599, 0.343];
  if (coords.length === 1) return coords[0].slice(0, 2) as Coordinate;
  const lengths = coords.slice(1).map((p, i) => distance(coords[i], p));
  let remaining =
    lengths.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, fraction));
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] ? remaining / lengths[i] : 0;
      return [
        coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t,
        coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t,
      ];
    }
    remaining -= lengths[i];
  }
  return coords.at(-1)!.slice(0, 2) as Coordinate;
}
export function simulatedTruckPosition(
  points: Place[],
  coordinates: number[][],
  stage?: Stage,
  currentStop = 0,
): Coordinate | null {
  const pickup = points[0];
  if (
    !pickup ||
    !stage ||
    ["scheduled", "searching", "cancelled"].includes(stage)
  )
    return null;
  if (["at_pickup", "loading", "returned"].includes(stage))
    return [pickup.longitude, pickup.latitude];
  if (["assigned", "to_pickup", "returning"].includes(stage))
    return [pickup.longitude + 0.001, pickup.latitude - 0.001];
  const destination =
    points[Math.min(points.length - 1, currentStop + 1)] || pickup;
  if (["at_destination", "offloading", "delivered"].includes(stage))
    return [destination.longitude, destination.latitude];
  const closest = (p: Place) =>
    coordinates.reduce(
      (best, c, i) =>
        distance(c, [p.longitude, p.latitude]) <
        distance(coordinates[best], [p.longitude, p.latitude])
          ? i
          : best,
      0,
    );
  if (coordinates.length >= 2) {
    const start = closest(points[currentStop] || pickup),
      end = closest(destination);
    return pointAlongRoute(
      coordinates.slice(start, Math.max(start + 1, end) + 1),
      0.45,
    );
  }
  return pointAlongRoute(
    [
      [pickup.longitude, pickup.latitude],
      [destination.longitude, destination.latitude],
    ],
    0.45,
  );
}
