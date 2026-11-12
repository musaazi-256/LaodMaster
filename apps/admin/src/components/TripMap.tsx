import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import style from "../../../../packages/mobile/assets/maps/loadmaster-style.json";

import type { TripStop } from "./tripGeometry";
type Coord = [number, number];

/**
 * Trip route map for operations. The line is the road route between the
 * trip's pickup and stops (OSRM preview from the demo service). The truck
 * marker is placed from the trip stage, not from GPS: the demo does not
 * record driver positions.
 */
export default function TripMap({
  stops,
  coordinates,
  truck,
  completedTo,
  caption,
}: {
  stops: TripStop[];
  coordinates: number[][];
  truck?: Coord | null;
  /** Index into `coordinates` up to which the route has been driven. */
  completedTo?: number;
  caption: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!box.current) return;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: box.current,
        style: style as unknown as StyleSpecification,
        center: [32.599, 0.343],
        zoom: 11,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    m.on("load", () => {
      m.resize();
      setReady(true);
    });
    m.on("error", () => undefined);
    map.current = m;
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(box.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const line = coordinates.length
      ? coordinates
      : stops.map((s) => [s.longitude, s.latitude]);
    const done = line.slice(0, Math.max(0, (completedTo ?? -1) + 1));
    const set = (
      id: string,
      coords: number[][],
      color: string,
      width: number,
    ) => {
      const geo = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: coords },
      };
      const src = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(geo);
      else {
        m.addSource(id, { type: "geojson", data: geo });
        m.addLayer({
          id,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": color, "line-width": width },
        });
      }
    };
    set("route-casing", line, "#FFFFFF", 9);
    set("route", line, "#087443", 5);
    set("route-done", done.length > 1 ? done : [], "#9CA3AF", 5);

    markers.current.forEach((k) => k.remove());
    markers.current = stops.map((s, i) => {
      const el = document.createElement("div");
      el.className =
        "trip-pin " +
        s.kind +
        (s.status ? " " + s.status.replace(/\s/g, "_") : "");
      el.textContent = s.kind === "pickup" ? "P" : String(i);
      el.title = s.label;
      return new maplibregl.Marker({ element: el })
        .setLngLat([s.longitude, s.latitude])
        .setPopup(new maplibregl.Popup({ offset: 14 }).setText(s.label))
        .addTo(m);
    });
    if (truck) {
      const el = document.createElement("div");
      el.className = "trip-truck";
      el.title = "Truck position estimated from the trip stage";
      markers.current.push(
        new maplibregl.Marker({ element: el }).setLngLat(truck).addTo(m),
      );
    }
    const bounds = new maplibregl.LngLatBounds();
    line.forEach((c) => bounds.extend(c as Coord));
    if (!bounds.isEmpty())
      m.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
  }, [ready, coordinates, stops, truck, completedTo]);

  return (
    <div className="trip-map">
      {failed ? (
        <div className="trip-map-fallback">
          The map could not start in this browser. The stop list below shows the
          route.
        </div>
      ) : (
        <div
          ref={box}
          className="trip-map-canvas"
          aria-label="Trip route map"
        />
      )}
      <div className="map-caption">{caption}</div>
    </div>
  );
}
