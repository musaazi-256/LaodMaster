import test from "node:test";
import assert from "node:assert/strict";
import {
  pointAlongRoute,
  simulatedTruckPosition,
} from "../packages/mobile/src/routeGeometry.ts";
test("truck interpolation follows road length around corners rather than crossing blocks", () => {
  assert.deepEqual(
    pointAlongRoute(
      [
        [0, 0],
        [1, 0],
        [1, 3],
      ],
      0.5,
    ),
    [1, 1],
  );
  assert.deepEqual(
    pointAlongRoute(
      [
        [0, 0],
        [1, 0],
      ],
      -1,
    ),
    [0, 0],
  );
  assert.deepEqual(
    pointAlongRoute(
      [
        [0, 0],
        [1, 0],
      ],
      2,
    ),
    [1, 0],
  );
});
test("simulated truck uses the current delivery leg and respects pickup and handover stages", () => {
  const points = [
    { longitude: 0, latitude: 0 },
    { longitude: 1, latitude: 0 },
    { longitude: 1, latitude: 3 },
  ];
  const road = [
    [0, 0],
    [1, 0],
    [1, 3],
  ];
  assert.equal(simulatedTruckPosition(points, road, "searching"), null);
  assert.deepEqual(simulatedTruckPosition(points, road, "loading"), [0, 0]);
  assert.deepEqual(
    simulatedTruckPosition(points, road, "offloading", 1),
    [1, 3],
  );
  const p = simulatedTruckPosition(points, road, "in_transit", 1);
  assert.equal(p[0], 1);
  assert.ok(p[1] > 0 && p[1] < 3);
  assert.deepEqual(simulatedTruckPosition(points, road, "returned"), [0, 0]);
});
