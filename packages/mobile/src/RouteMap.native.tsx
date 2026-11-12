import { typography } from "./mobileDesign";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  ViewAnnotation,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import type { Place, Stage } from "../../contracts/src";
import { useDemo } from "./state";
import { customerTheme as T } from "./customerTheme";
import { FigmaIcon } from "./figmaAssets";
import truck from "../assets/figma/order-small-truck-back-side1.png";
import { loadMasterMapStyle as mapStyle, mapColors } from "./mapAppearance";
import { simulatedTruckPosition } from "./routeGeometry";
import { Icon } from "./ui";
export function RouteMap({
  points,
  orderId,
  onSelect,
  radar = false,
  stage,
  currentStop = 0,
}: {
  points: Place[];
  orderId?: string;
  onSelect?: (point: { latitude: number; longitude: number }) => void;
  radar?: boolean;
  stage?: Stage;
  currentStop?: number;
}) {
  const { client } = useDemo();
  const camera = useRef<CameraRef>(null);
  const [route, setRoute] = useState<{
    coordinates: number[][];
    label: string;
    source: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ids = points.map((p) => p.id).join("|");
  useEffect(() => {
    let active = true;
    setRoute(null);
    if (points.length >= 2)
      void client
        .request<typeof route>(
          "/routes",
          orderId ? { orderId } : { placeIds: points.map((p) => p.id) },
        )
        .then((r) => {
          if (active) setRoute(r);
        })
        .catch(() => {
          if (active)
            setRoute({
              coordinates: points.map((p) => [p.longitude, p.latitude]),
              source: "direct-preview",
              label: "Routing unavailable · approximate direct line only",
            });
        });
    return () => {
      active = false;
    };
  }, [client, ids, orderId, retry]);
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setFailed(true), 18000);
    return () => clearTimeout(t);
  }, [loaded, retry]);
  const fallback = points[0] || { longitude: 32.599, latitude: 0.343 };
  const bounds = useMemo(() => {
    const coordinates = route?.coordinates?.length
      ? route.coordinates
      : points.length
        ? points.map((p) => [p.longitude, p.latitude])
        : [[fallback.longitude, fallback.latitude]];
    const xs = coordinates.map((p) => p[0]),
      ys = coordinates.map((p) => p[1]);
    return [
      Math.min(...xs) - 0.004,
      Math.min(...ys) - 0.004,
      Math.max(...xs) + 0.004,
      Math.max(...ys) + 0.004,
    ] as [number, number, number, number];
  }, [ids, route]);
  const truckPosition = simulatedTruckPosition(
    points,
    route?.coordinates || [],
    stage,
    currentStop,
  );
  useEffect(() => {
    camera.current?.fitBounds(bounds, {
      padding: { top: 65, bottom: 45, left: 45, right: 45 },
      duration: 0,
    });
  }, [bounds]);
  if (failed)
    return (
      <View
        style={{
          flex: 1,
          minHeight: 220,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F0FAF4",
          padding: 24,
          gap: 12,
        }}
      >
        <FigmaIcon name="home-lucide-icons-map-pin" />
        <Text style={{ color: T.muted, textAlign: "center" }}>
          Map tiles could not load. Your selected locations remain available in
          the form.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFailed(false);
            setLoaded(false);
            setRetry(retry + 1);
          }}
          style={{ padding: 12 }}
        >
          <Text style={{ color: T.green, fontWeight: "600" }}>Retry map</Text>
        </Pressable>
      </View>
    );
  return (
    <View style={{ flex: 1, minHeight: 220 }}>
      <Map
        key={retry}
        style={{ flex: 1 }}
        mapStyle={mapStyle}
        onDidFailLoadingMap={() => setFailed(true)}
        onDidFinishRenderingMapFully={() => setLoaded(true)}
        onPress={(e) => {
          if (onSelect) setPin(e.nativeEvent.lngLat);
        }}
      >
        <Camera
          ref={camera}
          key={ids}
          initialViewState={{
            bounds,
            padding: { top: 65, bottom: 55, left: 55, right: 55 },
          }}
        />
        {route && (
          <GeoJSONSource
            id="cargo-route"
            data={{
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: route.coordinates },
            }}
          >
            <Layer
              id="cargo-route-outline"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": mapColors.outline,
                "line-width": 8,
                "line-opacity": 0.95,
              }}
            />
            <Layer
              layout={{ "line-cap": "round", "line-join": "round" }}
              id="cargo-route-line"
              type="line"
              paint={{
                "line-color": mapColors.route,
                "line-width": 5,
                "line-opacity": 0.9,
                ...(route.source === "direct-preview"
                  ? { "line-dasharray": [2, 2] }
                  : {}),
              }}
            />
          </GeoJSONSource>
        )}
        {radar && points[0] && (
          <ViewAnnotation
            id="pickup-radar"
            lngLat={[points[0].longitude, points[0].latitude]}
          >
            <View
              pointerEvents="none"
              style={{
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: "rgba(8, 116, 67, 0.10)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 106,
                  height: 106,
                  borderRadius: 53,
                  backgroundColor: "rgba(8, 116, 67, 0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(8, 116, 67, 0.28)",
                }}
              />
            </View>
          </ViewAnnotation>
        )}
        {points.map((p, i) => (
          <ViewAnnotation
            key={p.id}
            id={"point-" + i}
            lngLat={[p.longitude, p.latitude]}
            anchor="bottom"
          >
            <View style={{ alignItems: "center", maxWidth: 180 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: i === 0 ? "#087443" : "white",
                  shadowColor: "#000",
                  shadowOpacity: 0.14,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    ...typography.caption,
                    fontWeight: "700",
                    color: i === 0 ? "white" : T.ink,
                  }}
                >
                  {i === 0 ? "Pickup here" : `Stop ${i}`} · {p.name}
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: i === 0 ? "#087443" : T.blue,
                  borderWidth: 3.5,
                  borderColor: "white",
                  marginTop: 4,
                }}
              />
            </View>
          </ViewAnnotation>
        ))}
        {truckPosition && (
          <ViewAnnotation id="demo-truck" lngLat={truckPosition}>
            <Image source={truck} style={{ width: 61, height: 41 }} />
          </ViewAnnotation>
        )}
        {pin && (
          <ViewAnnotation id="selected-pin" lngLat={pin}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: T.green,
                borderWidth: 3,
                borderColor: "white",
              }}
            />
          </ViewAnnotation>
        )}
      </Map>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 12,
          left: 68,
          right: 68,
          backgroundColor: "#FFFFFFE8",
          padding: 7,
          borderRadius: 10,
        }}
      >
        <Text
          style={{ ...typography.caption, color: T.muted, textAlign: "center" }}
        >
          {onSelect
            ? "Tap to choose location"
            : route
              ? route.source === "road-preview"
                ? "Road route · Demo GPS"
                : "Approximate route · Offline routing"
              : points.length < 2
                ? "Map preview"
                : "Loading road route…"}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show entire route"
        onPress={() =>
          camera.current?.fitBounds(bounds, {
            padding: { top: 65, bottom: 45, left: 45, right: 45 },
            duration: 0,
          })
        }
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: T.border,
        }}
      >
        <Icon name="locate-outline" size={22} color={T.green} />
      </Pressable>
      {onSelect && pin && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirm map location"
          onPress={() => onSelect({ longitude: pin[0], latitude: pin[1] })}
          style={{
            position: "absolute",
            bottom: 24,
            alignSelf: "center",
            backgroundColor: T.green,
            padding: 14,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Use this map location
          </Text>
        </Pressable>
      )}
    </View>
  );
}
