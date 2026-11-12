export interface TripStop {
  name: string;
  latitude: number;
  longitude: number;
  kind: "pickup" | "stop";
  status?: string;
  label: string;
}
export type Coord = [number, number];
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const closest = (coords: number[][], p: number[]) =>
  coords.reduce(
    (best, c, i) => (dist(c, p) < dist(coords[best], p) ? i : best),
    0,
  );

/** Estimated truck position and driven portion from the trip stage. */
export function stagePosition(
  stops: TripStop[],
  coords: number[][],
  stage: string,
  currentStop = 0,
): { truck: Coord | null; completedTo: number } {
  const line = coords.length
    ? coords
    : stops.map((s) => [s.longitude, s.latitude]);
  const pickup = stops[0];
  if (!pickup || ["scheduled", "searching", "cancelled"].includes(stage))
    return { truck: null, completedTo: -1 };
  const at = (s: TripStop) => [s.longitude, s.latitude] as Coord;
  if (["assigned", "to_pickup"].includes(stage))
    return {
      truck: [pickup.longitude + 0.004, pickup.latitude - 0.003],
      completedTo: -1,
    };
  if (["at_pickup", "loading"].includes(stage))
    return { truck: at(pickup), completedTo: 0 };
  if (["delivered"].includes(stage))
    return { truck: null, completedTo: line.length - 1 };
  if (["returning", "returned"].includes(stage))
    return {
      truck: stage === "returned" ? at(pickup) : null,
      completedTo: line.length - 1,
    };
  const target = stops[Math.min(stops.length - 1, currentStop + 1)];
  const from = stops[Math.min(stops.length - 1, currentStop)];
  const end = closest(line, at(target));
  if (["at_destination", "offloading"].includes(stage))
    return { truck: at(target), completedTo: end };
  const start = closest(line, at(from));
  const mid = Math.max(start, Math.round(start + (end - start) * 0.55));
  return { truck: (line[mid] as Coord) || at(target), completedTo: mid };
}
