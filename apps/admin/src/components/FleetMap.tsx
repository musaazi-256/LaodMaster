import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import style from "../../../../packages/mobile/assets/maps/loadmaster-style.json";
import type { TripStop } from "./tripGeometry";

export interface FleetDriver {
  id: string;
  name: string;
  plate?: string;
  latitude: number;
  longitude: number;
  state: "on_trip" | "available" | "offline";
}

/**
 * All drivers on one map. Positions are simulated (stage-based for drivers on
 * a trip, last drop-off or a base otherwise); the demo collects no GPS.
 */
export default function FleetMap({
  drivers,
  selected,
  onSelect,
  route,
  stops,
}: {
  drivers: FleetDriver[];
  selected?: string;
  onSelect: (id: string) => void;
  /** Road route of the selected driver's trip, if any. */
  route?: number[][];
  stops?: TripStop[];
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const stopMarkers = useRef<maplibregl.Marker[]>([]);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const pick = useRef(onSelect);
  pick.current = onSelect;

  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: style as unknown as StyleSpecification,
      center: [32.599, 0.343],
      zoom: 11,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    m.on("load", () => {
      m.resize();
      setReady(true);
    });
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(box.current);
    map.current = m;
    const all = markers.current;
    return () => {
      observer.disconnect();
      all.clear();
      m.remove();
      map.current = null;
    };
  }, []);

  // Driver markers: created once per driver, then moved and restyled.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const seen = new Set<string>();
    for (const d of drivers) {
      seen.add(d.id);
      let marker = markers.current.get(d.id);
      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          pick.current(d.id);
        });
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([d.longitude, d.latitude])
          .addTo(m);
        markers.current.set(d.id, marker);
      }
      const el = marker.getElement();
      el.className =
        "fleet-pin " + d.state + (d.id === selected ? " selected" : "");
      el.title = d.name + (d.plate ? " · " + d.plate : "");
      el.setAttribute("aria-label", "Select " + el.title);
      el.textContent = d.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("");
      marker.setLngLat([d.longitude, d.latitude]);
    }
    for (const [id, marker] of markers.current)
      if (!seen.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    if (!fitted.current && drivers.length) {
      const b = new maplibregl.LngLatBounds();
      drivers.forEach((d) => b.extend([d.longitude, d.latitude]));
      m.fitBounds(b, { padding: 70, maxZoom: 13, duration: 0 });
      fitted.current = true;
    }
  }, [ready, drivers, selected]);

  // Selected driver's trip route and stops.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const geo = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: route || [] },
    };
    const src = m.getSource("fleet-route") as
      maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geo);
    else {
      m.addSource("fleet-route", { type: "geojson", data: geo });
      m.addLayer({
        id: "fleet-route-casing",
        type: "line",
        source: "fleet-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#FFFFFF", "line-width": 8 },
      });
      m.addLayer({
        id: "fleet-route",
        type: "line",
        source: "fleet-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#087443", "line-width": 4 },
      });
    }
    stopMarkers.current.forEach((s) => s.remove());
    stopMarkers.current = (stops || []).map((s, i) => {
      const el = document.createElement("div");
      el.className = "trip-pin small " + s.kind + " " + (s.status || "");
      el.textContent = s.kind === "pickup" ? "P" : String(i);
      el.title = s.label;
      return new maplibregl.Marker({ element: el })
        .setLngLat([s.longitude, s.latitude])
        .addTo(m);
    });
  }, [ready, route, stops]);

  // Fly to the selected driver.
  useEffect(() => {
    const m = map.current;
    const d = drivers.find((d) => d.id === selected);
    if (!m || !ready || !d) return;
    if (route && route.length > 1) {
      const b = new maplibregl.LngLatBounds();
      route.forEach((c) => b.extend(c as [number, number]));
      b.extend([d.longitude, d.latitude]);
      m.fitBounds(b, { padding: 70, maxZoom: 14 });
    } else
      m.flyTo({
        center: [d.longitude, d.latitude],
        zoom: Math.max(m.getZoom(), 13),
      });
    // Only when the selection changes, not on every position refresh.
  }, [selected, ready, route?.length]);

  return <div ref={box} className="fleet-map-canvas" aria-label="Fleet map" />;
}
