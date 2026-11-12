import React from "react";
import type { Place } from "../../contracts/src";
import { RouteMap } from "./RouteMap";
export function OrderLocationCanvas({
  pickup,
  destination,
  onSelect,
}: {
  pickup?: Place;
  destination?: Place;
  onSelect?: (point: { latitude: number; longitude: number }) => void;
}) {
  return (
    <RouteMap
      points={[pickup, destination].filter(Boolean) as Place[]}
      onSelect={onSelect}
    />
  );
}
