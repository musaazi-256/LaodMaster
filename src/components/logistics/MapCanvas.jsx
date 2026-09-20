import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Map as MaplibreMap, Marker as MaplibreMarker, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { CheckCircle2, Navigation } from 'lucide-react';
import { cx } from '../../lib/cx';
import { resolvePlace, fetchRoute, pointAlongRoute, sliceRoute } from '../../lib/geo';
import smallTruckBackSide from '../../assets/trucks/Small truck back side.png';
import smallTruckFrontSide from '../../assets/trucks/Small truck front side.png';

// MapLibre normally locates its worker script relative to its own module URL, but
// that guess breaks under this project's bundler (the worker never gets emitted as a
// build asset, so the request silently 404s / falls through to index.html and the map
// never renders). `?url` is a core Vite feature independent of worker-bundling
// heuristics, so this points MapLibre at the real file directly, in both dev and prod.
setWorkerUrl(maplibreWorkerUrl);

// Free, keyless vector tiles (OpenFreeMap "liberty" style, built on OpenStreetMap data).
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * LoadMastr Geo Map Colour Specification Tokens (Exact Match to THD Spec Sheet v1.0)
 */
export const MAP_TOKENS = {
  // Base Map Colors
  land: '#F7F8F7',
  urban: '#F1F3F2',
  park: '#E8F2E9',
  water: '#DCEFF3',

  // Road Colors (Lightened grey tones by 40%)
  roadHighway: '#D0EAD6',
  roadPrimary: '#BCE3C5',
  roadSecondary: '#EFF1F0',
  roadMinor: '#FFFFFF',
  roadOutline: '#E7ECEB',

  // Label Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#6B7280',
  transit: '#6B7280',
  poi: '#6B7280',

  // Brand / Interaction Colors
  brandPrimary: '#50BB7F',
  brandDark: '#369663',
  brandLight: '#E8F7EF',
  brandVeryLight: '#F2FAF5',

  // Route Colors
  routeActive: '#50BB7F',
  routeOutline: '#369663',
  routeInactive: '#A8B5AE',
  routeSuggested: '#50BB7F',
  routeCompleted: '#7BBF99',
  routeCancelled: '#B8BFC0',

  // Pickup & Destination Markers
  pickupOuter: '#50BB7F',
  pickupFill: '#FFFFFF',
  pickupCenter: '#50BB7F',

  destOuter: '#1F2937',
  destFill: '#FFFFFF',
  destCenter: '#1F2937',

  // Customer GPS Location
  userCenter: '#50BB7F',
  userOuter: '#FFFFFF',
  userAccuracy: 'rgba(80, 187, 127, 0.18)',

  // Truck Markers
  truckAvailable: '#50BB7F',
  truckSelected: '#369663',
  truckBusy: '#F59E0B',
  truckOffline: '#94A3A8',
  truckArrived: '#50BB7F',

  // Map Controls
  controlBg: '#FFFFFF',
  controlIcon: '#263238',
  controlBorder: '#E2E8E5',
  controlActiveBg: '#E8F7EF',
  controlActiveIcon: '#369663',
  controlActiveBorder: '#50BB7F',
};

let styleCache = null;
let styleFetchPromise = null;

/**
 * Fetch and transform OpenFreeMap Liberty vector style JSON to strictly adhere to LoadMastr Geo Map Spec
 */
async function getLoadMastrMapStyle() {
  if (styleCache) return styleCache;
  if (!styleFetchPromise) {
    styleFetchPromise = fetch(MAP_STYLE_URL)
      .then((res) => res.json())
      .then((style) => {
        styleCache = transformLoadMastrStyle(style);
        return styleCache;
      })
      .catch((err) => {
        console.warn('Failed to fetch vector style JSON, fallback to URL:', err);
        styleFetchPromise = null;
        return MAP_STYLE_URL;
      });
  }
  return styleFetchPromise;
}

function transformLoadMastrStyle(rawStyle) {
  const style = JSON.parse(JSON.stringify(rawStyle));
  if (!style.layers) return style;

  style.layers.forEach((layer) => {
    const id = layer.id;
    const type = layer.type;

    // 1. Background / Land -> Soft Grey (#F7F8F7)
    if (type === 'background') {
      layer.paint = { ...layer.paint, 'background-color': MAP_TOKENS.land };
    }

    // Hide shaded relief raster overlay so land is smooth & clean
    if (id === 'natural_earth') {
      layer.paint = { ...layer.paint, 'raster-opacity': 0 };
    }

    // 2. Built-up / Urban areas -> Light Grey (#F1F3F2)
    if (
      id.startsWith('landuse_residential') ||
      id.startsWith('landuse_hospital') ||
      id.startsWith('landuse_school') ||
      id.startsWith('aeroway_fill') ||
      id.startsWith('landuse_commercial') ||
      id.startsWith('landuse_industrial')
    ) {
      if (type === 'fill') {
        layer.paint = { ...layer.paint, 'fill-color': MAP_TOKENS.urban };
      }
    }

    // 3. Parks / Vegetation -> Soft Green (#E8F2E9)
    if (
      id === 'park' ||
      id === 'landcover_wood' ||
      id === 'landcover_grass' ||
      id.startsWith('landuse_pitch') ||
      id.startsWith('landuse_track') ||
      id.startsWith('landuse_cemetery') ||
      id.startsWith('leisure_')
    ) {
      if (type === 'fill') {
        layer.paint = { ...layer.paint, 'fill-color': MAP_TOKENS.park, 'fill-opacity': 0.95 };
      }
    }
    if (id === 'park_outline') {
      layer.paint = { ...layer.paint, 'line-color': '#D0E5D7' };
    }

    // 4. Water -> Pale Blue (#DCEFF3)
    if (id === 'water') {
      layer.paint = { ...layer.paint, 'fill-color': MAP_TOKENS.water };
    }
    if (id.startsWith('waterway_')) {
      if (type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': '#B8E2EA' };
      }
    }

    // 5. Buildings -> Flat Light Grey (#F1F3F2) without dark outline or 3D shadows
    if (id.includes('building') || type === 'fill-extrusion') {
      if (type === 'fill-extrusion') {
        layer.layout = { ...layer.layout, visibility: 'none' };
      } else if (type === 'fill') {
        layer.paint = {
          ...layer.paint,
          'fill-color': MAP_TOKENS.urban,
          'fill-outline-color': MAP_TOKENS.urban,
        };
      }
    }

    // 6. Road Outlines / Casings -> Soft Light Grey (#E7ECEB)
    if (id.endsWith('_casing') || id.includes('casing')) {
      if (type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': MAP_TOKENS.roadOutline, 'line-opacity': 0.65 };
      }
    }

    // 7. Road Fills (THD Spec Exact Match)
    // - Highways / Motorways / Trunks -> Soft Pastel Green (#D0EAD6)
    // - Primary roads -> Light Pastel Green (#BCE3C5)
    // - Secondary roads -> Warm Grey (#E5E8E7)
    // - Minor roads -> White (#FFFFFF)
    if (id.includes('motorway') || id.includes('freeway') || id.includes('trunk')) {
      if (!id.endsWith('_casing') && type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': MAP_TOKENS.roadHighway };
      }
    } else if (id.includes('primary')) {
      if (!id.endsWith('_casing') && type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': MAP_TOKENS.roadPrimary };
      }
    } else if (id.includes('secondary') || id.includes('tertiary') || id.includes('link')) {
      if (!id.endsWith('_casing') && type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': MAP_TOKENS.roadSecondary };
      }
    } else if (
      id.includes('minor') ||
      id.includes('street') ||
      id.includes('service') ||
      id.includes('path') ||
      id.includes('pedestrian')
    ) {
      if (!id.endsWith('_casing') && type === 'line') {
        layer.paint = { ...layer.paint, 'line-color': MAP_TOKENS.roadMinor };
      }
    }

    // 8. Labels & Typography (THD Spec Exact Match)
    // - Primary labels -> #1F2937
    // - Secondary / POI labels -> #6B7280
    if (type === 'symbol' && layer.paint) {
      if (
        id.startsWith('label_city') ||
        id.startsWith('label_town') ||
        id.startsWith('label_village') ||
        id.startsWith('label_country') ||
        id.startsWith('label_state')
      ) {
        layer.paint = { ...layer.paint, 'text-color': MAP_TOKENS.textPrimary };
      } else if (id.startsWith('highway-name') || id === 'label_other') {
        layer.paint = { ...layer.paint, 'text-color': MAP_TOKENS.textSecondary };
      } else if (id.startsWith('poi_transit') || id.startsWith('poi_') || id === 'airport') {
        layer.paint = { ...layer.paint, 'text-color': MAP_TOKENS.poi };
      }
    }

    // 9. POI de-emphasis
    if (id === 'poi_r1') {
      layer.minzoom = Math.max(layer.minzoom ?? 0, 16);
    } else if (id === 'poi_r7') {
      layer.minzoom = Math.max(layer.minzoom ?? 0, 17);
      layer.paint = { ...layer.paint, 'icon-opacity': 0.75, 'text-opacity': 0.75 };
    } else if (id === 'poi_r20') {
      layer.minzoom = Math.max(layer.minzoom ?? 0, 18);
      layer.paint = { ...layer.paint, 'icon-opacity': 0.55, 'text-opacity': 0.55 };
    }
  });

  return style;
}

const STATE_CONFIG = {
  idle: { label: 'Ntinda, Kampala', phase: 'pre', progress: 0, showApproach: false, pulse: false, truckState: 'available' },
  searching: { label: 'Searching for drivers nearby…', phase: 'pre', progress: 0, showApproach: false, pulse: true, truckState: 'available' },
  driver_assigned: { label: 'Driver assigned', phase: 'pre', progress: 0.04, showApproach: true, truckState: 'selected' },
  driver_approaching: { label: 'Driver is heading to pickup', phase: 'pre', progress: 0.55, showApproach: true, truckState: 'selected' },
  driver_arrived: { label: 'Driver has arrived at pickup', phase: 'pre', progress: 1, showApproach: true, truckState: 'arrived' },
  trip_started: { label: 'Trip started', phase: 'main', progress: 0.02, showApproach: false, truckState: 'selected' },
  en_route: { label: 'En route to destination', phase: 'main', progress: 0.42, showApproach: false, truckState: 'selected' },
  near_destination: { label: 'Nearing destination', phase: 'main', progress: 0.82, showApproach: false, truckState: 'selected' },
  arrived: { label: 'Arrived at destination', phase: 'main', progress: 1, showApproach: false, truckState: 'arrived' },
  completed: { label: 'Trip completed', phase: 'main', progress: 1, showApproach: false, done: true, truckState: 'selected' },
};

const CHECK_ICON = renderToStaticMarkup(<CheckCircle2 size={16} color={MAP_TOKENS.brandPrimary} />);

let pulseStyleInjected = false;
function ensurePulseStyle() {
  if (pulseStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lm-map-pulse { 
      0% { transform: scale(0.6); opacity: 0.85; box-shadow: 0 0 0 0 rgba(80, 187, 127, 0.6); } 
      70% { transform: scale(2.2); opacity: 0.15; box-shadow: 0 0 20px 10px rgba(80, 187, 127, 0.4); } 
      100% { transform: scale(2.6); opacity: 0; } 
    }
    .lm-map-pulse-ring { position: absolute; inset: -14px; border-radius: 9999px; border: 3px solid ${MAP_TOKENS.brandPrimary}; background: rgba(80, 187, 127, 0.15); animation: lm-map-pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; pointer-events: none; transform-origin: center center; }
  `;
  document.head.appendChild(style);
  pulseStyleInjected = true;
}

function lineFC(coords) {
  return {
    type: 'FeatureCollection',
    features: coords && coords.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : [],
  };
}

function setLineSource(map, id, coords) {
  const source = map.getSource(id);
  if (source) source.setData(lineFC(coords));
}

/**
 * Concentric Circle Pickup Marker ◉ (#50BB7F outer, #FFFFFF fill, #50BB7F center)
 */
function buildPickupMarkerEl(showPulse = false) {
  ensurePulseStyle();
  const wrap = document.createElement('div');
  // No `position` here: MapLibre's own `.maplibregl-marker { position: absolute }` rule is
  // what makes its `transform: translate()` positioning work at all. An inline `position`
  // on this root element (this used to say `relative`) beats that stylesheet rule, silently
  // dropping the marker into normal document flow instead — it still "renders", just at
  // whatever position document flow gives it, nowhere near its real map coordinate. It's
  // still a valid containing block for the absolutely-positioned children below.
  wrap.style.cssText =
    'width:22px;height:22px;border-radius:9999px;background:#50BB7F;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(80,187,127,0.4);';

  if (showPulse) {
    const ring = document.createElement('div');
    ring.className = 'lm-map-pulse-ring';
    wrap.appendChild(ring);
  }

  const innerFill = document.createElement('div');
  innerFill.style.cssText =
    'position:relative;z-index:2;width:14px;height:14px;border-radius:9999px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;';
  const centerDot = document.createElement('div');
  centerDot.style.cssText = 'width:8px;height:8px;border-radius:9999px;background:#50BB7F;';
  innerFill.appendChild(centerDot);
  wrap.appendChild(innerFill);
  return wrap;
}

function applyPickupMarkerPulse(el, showPulse) {
  ensurePulseStyle();
  let ring = el.querySelector('.lm-map-pulse-ring');
  if (showPulse) {
    if (!ring) {
      ring = document.createElement('div');
      ring.className = 'lm-map-pulse-ring';
      el.insertBefore(ring, el.firstChild);
    }
  } else if (ring) {
    ring.remove();
  }
}

/**
 * Destination Marker ◉ (#263238 outer, #FFFFFF fill, #263238 center)
 */
function buildDestinationMarkerEl() {
  const wrap = document.createElement('div');
  // See buildPickupMarkerEl: no `position` here on purpose, so MapLibre's own
  // `.maplibregl-marker { position: absolute }` positions this correctly.
  wrap.style.cssText =
    'width:22px;height:22px;border-radius:9999px;background:#1F2937;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(38,50,56,0.4);';
  const innerFill = document.createElement('div');
  innerFill.style.cssText =
    'position:relative;z-index:2;width:14px;height:14px;border-radius:9999px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;';
  const centerDot = document.createElement('div');
  centerDot.style.cssText = 'width:8px;height:8px;border-radius:9999px;background:#1F2937;';
  innerFill.appendChild(centerDot);
  wrap.appendChild(innerFill);
  return wrap;
}

/**
 * User GPS Location — exact THD Spec Sheet match (#50BB7F dot, white border, soft green rgba(80,187,127,0.18) accuracy circle).
 */
function buildUserGpsLocationEl() {
  const wrap = document.createElement('div');
  // See buildPickupMarkerEl: no `position` here on purpose.
  wrap.style.cssText = 'width:56px;height:56px;display:flex;align-items:center;justify-content:center;';

  const accuracyCircle = document.createElement('div');
  accuracyCircle.style.cssText =
    'position:absolute;inset:0;border-radius:9999px;background:rgba(80, 187, 127, 0.18);pointer-events:none;';

  const locationDot = document.createElement('div');
  locationDot.style.cssText =
    'width:18px;height:18px;border-radius:9999px;background:#50BB7F;border:3.5px solid #FFFFFF;box-shadow:0 3px 10px rgba(80, 187, 127, 0.4);z-index:2;';

  wrap.appendChild(accuracyCircle);
  wrap.appendChild(locationDot);
  return wrap;
}

/**
 * Truck marker state → { background, boxShadow }. Available #50BB7F, Selected #369663 + outer
 * glow, Busy #F59E0B, Offline #94A3A8, Arrived #50BB7F
 */
function getTruckMarkerStyle(truckState) {
  if (truckState === 'selected') {
    return { bg: MAP_TOKENS.truckSelected, boxShadow: '0 0 0 4px rgba(80, 187, 127, 0.4), 0 6px 16px rgba(54, 150, 99, 0.5)' };
  }
  if (truckState === 'busy') {
    return { bg: MAP_TOKENS.truckBusy, boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)' };
  }
  if (truckState === 'offline') {
    return { bg: MAP_TOKENS.truckOffline, boxShadow: '0 4px 10px rgba(148, 163, 168, 0.3)' };
  }
  return { bg: MAP_TOKENS.truckAvailable, boxShadow: '0 6px 16px rgba(80, 187, 127, 0.45)' };
}

function buildTruckMarkerEl(truckState = 'available', facing = 'front', flip = false) {
  const { bg, boxShadow } = getTruckMarkerStyle(truckState);
  const imgSrc = facing === 'back' ? smallTruckBackSide : smallTruckFrontSide;
  const flipTransform = flip ? 'scaleX(-1)' : 'scaleX(1)';

  const el = document.createElement('div');
  el.style.cssText = `
    width: 58px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 300ms ease;
    pointer-events: auto;
    cursor: pointer;
  `;

  // Driver-status halo behind the truck artwork. The PNG itself doesn't change across
  // states — recoloring detailed truck art via CSS filters reads as broken, not "busy" or
  // "offline" — so the status signal that used to live on a plain colored circle marker
  // lives in this glow instead, restoring the available/selected/busy/offline/arrived
  // distinction the switch to real truck images had silently dropped.
  const halo = document.createElement('div');
  halo.className = 'lm-truck-halo';
  halo.style.cssText = `position:absolute;width:42px;height:42px;border-radius:9999px;background:${bg};opacity:0.28;box-shadow:${boxShadow};transition:background-color 300ms ease, box-shadow 300ms ease;`;

  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = 'LoadMastr Truck';
  img.style.cssText = `position:relative;width: 54px; height: 54px; object-fit: contain; display: block; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28)); transform: ${flipTransform}; transition: transform 300ms ease;`;
  img.dataset.facing = facing;
  img.dataset.flip = flip ? 'true' : 'false';

  el.appendChild(halo);
  el.appendChild(img);
  return el;
}

// The truck marker element persists across renders (ensureMarker only builds it once), so a
// driver-status change — e.g. "selected" (green) to "busy" (amber) — needs to repaint the
// existing element in place; rebuilding via buildTruckMarkerEl again would be a no-op on reuse.
function applyTruckMarkerState(el, truckState, facing = 'front', flip = false) {
  const { bg, boxShadow } = getTruckMarkerStyle(truckState);
  let halo = el.querySelector('.lm-truck-halo');
  let img = el.querySelector('img');
  const flipTransform = flip ? 'scaleX(-1)' : 'scaleX(1)';
  const newSrc = facing === 'back' ? smallTruckBackSide : smallTruckFrontSide;

  if (!img || !halo) {
    el.innerHTML = '';
    el.style.cssText = `
      width: 58px;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 300ms ease;
      pointer-events: auto;
      cursor: pointer;
    `;
    halo = document.createElement('div');
    halo.className = 'lm-truck-halo';
    halo.style.cssText = `position:absolute;width:42px;height:42px;border-radius:9999px;background:${bg};opacity:0.28;box-shadow:${boxShadow};transition:background-color 300ms ease, box-shadow 300ms ease;`;
    img = document.createElement('img');
    img.alt = 'LoadMastr Truck';
    img.style.cssText = `position:relative;width: 54px; height: 54px; object-fit: contain; display: block; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28)); transform: ${flipTransform}; transition: transform 300ms ease;`;
    img.dataset.facing = facing;
    img.dataset.flip = flip ? 'true' : 'false';
    img.src = newSrc;
    el.appendChild(halo);
    el.appendChild(img);
    return;
  }

  halo.style.background = bg;
  halo.style.boxShadow = boxShadow;

  if (img.dataset.facing !== facing || img.src !== newSrc) {
    img.src = newSrc;
    img.dataset.facing = facing;
  }
  if (img.dataset.flip !== (flip ? 'true' : 'false')) {
    img.style.transform = flipTransform;
    img.dataset.flip = flip ? 'true' : 'false';
  }
}

function buildSearchEl() {
  ensurePulseStyle();
  const wrap = document.createElement('div');
  // See buildPickupMarkerEl: no `position` here on purpose.
  wrap.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;';
  const ring = document.createElement('div');
  ring.className = 'lm-map-pulse-ring';
  wrap.appendChild(ring);
  wrap.appendChild(buildTruckMarkerEl('available', 'front'));
  return wrap;
}

function buildDoneEl() {
  const el = document.createElement('div');
  el.style.cssText = `width:26px;height:26px;border-radius:9999px;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(38,50,56,0.15);border:1px solid ${MAP_TOKENS.brandLight};`;
  el.innerHTML = CHECK_ICON;
  return el;
}

const PICKUP_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40.54 61" width="38" height="57" style="display:block;">
  <g>
    <path fill="#059447" d="M20.27,0C9.08,0,0,9.08,0,20.27s20.27,40.73,20.27,40.73c0,0,20.27-29.54,20.27-40.73S31.46,0,20.27,0Z"/>
    <path fill="#007f36" d="M15.49,53.25c2.76,4.63,4.78,7.75,4.78,7.75,0,0,20.27-29.54,20.27-40.73,0-.59-.03-1.17-.08-1.74-.8,3.11-1.93,6.14-3.32,9.03-3.84,7.99-9.51,13.1-15.55,19.58-1.95,2.09-3.98,4.15-6.1,6.11Z"/>
    <polygon fill="#fff" points="30.97 12.88 20.27 18.28 9.57 12.88 20.27 8.53 30.97 12.88"/>
    <polygon fill="#fff" points="19.66 29.37 9.57 24.24 9.57 14.16 19.66 19.28 19.66 29.37"/>
    <polygon fill="#fff" points="20.88 29.37 30.97 24.24 30.97 14.16 20.88 19.28 20.88 29.37"/>
  </g>
</svg>
`;

function buildPickupBannerLabelEl(title, subtitle, showTag = true, cardSide = 'right') {
  const container = document.createElement('div');
  container.className = 'lm-pickup-banner-container';
  container.style.cssText = `
    display: inline-flex;
    align-items: flex-start;
    pointer-events: none;
    z-index: 10;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.14));
  `;

  // Green Teardrop Pin
  const pinWrap = document.createElement('div');
  pinWrap.className = 'lm-pin-wrap';
  pinWrap.style.cssText = 'position:relative;z-index:2;flex-shrink:0;width:38px;height:57px;';
  pinWrap.innerHTML = PICKUP_PIN_SVG;

  // White Banner Card attached seamlessly behind the pin head
  const bannerCard = document.createElement('div');
  bannerCard.className = 'lm-banner-card';
  bannerCard.style.cssText = `
    position: relative;
    z-index: 1;
    ${cardSide === 'left' ? 'margin-right: -20px; border-radius: 16px 0 0 16px; padding: 7px 24px 7px 16px;' : 'margin-left: -20px; border-radius: 0 16px 16px 0; padding: 7px 16px 7px 24px;'}
    margin-top: 1px;
    background: #FFFFFF;
    display: ${showTag ? 'flex' : 'none'};
    flex-direction: column;
    justify-content: center;
    min-height: 42px;
    white-space: nowrap;
    width: max-content;
    max-width: 220px;
    box-sizing: border-box;
  `;

  const titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-size: 13px; font-weight: 800; color: #1E293B; line-height: 1.2; display: block; letter-spacing: -0.01em;';
  titleEl.textContent = title || 'Pickup location';

  const subtitleEl = document.createElement('span');
  subtitleEl.style.cssText = 'font-size: 11.5px; font-weight: 500; color: #64748B; line-height: 1.3; margin-top: 2px; display: block; max-width: 165px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
  subtitleEl.dataset.label = 'true';
  subtitleEl.textContent = subtitle;

  bannerCard.appendChild(titleEl);
  bannerCard.appendChild(subtitleEl);

  if (cardSide === 'left') {
    container.appendChild(bannerCard);
    container.appendChild(pinWrap);
  } else {
    container.appendChild(pinWrap);
    container.appendChild(bannerCard);
  }

  return container;
}

function buildSpeechBubbleLabelEl(title, subtitle) {
  const wrap = document.createElement('div');
  // No `position` here (this used to say `relative`): see buildPickupMarkerEl for why an
  // inline `position` on a marker's root element breaks MapLibre's own absolute positioning.
  // This was the single most visible instance of that bug — every "You are here" /
  // "Destination" / "Trucks nearby" bubble on the map was affected.
  wrap.style.cssText = `
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    background: #FFFFFF;
    border-radius: 10px;
    padding: 6px 13px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    border: 1px solid #E2E8E5;
    white-space: nowrap;
    pointer-events: none;
    width: max-content;
    max-width: 210px;
    box-sizing: border-box;
    z-index: 10;
  `;

  const titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-size: 10px; font-weight: 700; color: #6B7280; line-height: 1.2; display: block;';
  titleEl.textContent = title;

  const subtitleEl = document.createElement('span');
  subtitleEl.style.cssText = 'font-size: 12.5px; font-weight: 800; color: #1F2937; line-height: 1.3; margin-top: 1px; display: block; max-width: 184px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
  subtitleEl.dataset.label = 'true';
  subtitleEl.textContent = subtitle;

  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #FFFFFF;
    border-right: 1px solid #E2E8E5;
    border-bottom: 1px solid #E2E8E5;
  `;

  wrap.appendChild(titleEl);
  wrap.appendChild(subtitleEl);
  wrap.appendChild(arrow);
  return wrap;
}

function ensureMarker(markersRef, map, key, buildEl, lngLat, options) {
  let marker = markersRef.current[key];
  const targetAnchor = options?.anchor ?? 'center';
  const targetOffset = options?.offset;

  if (marker && marker._anchor !== targetAnchor) {
    marker.remove();
    marker = null;
  }

  if (!marker) {
    const el = buildEl();
    marker = new MaplibreMarker({ element: el, anchor: targetAnchor, offset: targetOffset });
    marker._anchor = targetAnchor;
    marker.setLngLat(lngLat).addTo(map);
    markersRef.current[key] = marker;
  } else {
    marker.setLngLat(lngLat);
    if (targetOffset) {
      marker.setOffset(targetOffset);
    }
  }
  return marker;
}

function removeMarker(markersRef, key) {
  const marker = markersRef.current[key];
  if (marker) {
    marker.remove();
    delete markersRef.current[key];
  }
}

export default function MapCanvas({
  state = 'idle',
  originLabel = '',
  destinationLabel = '',
  className,
  fullBleed = false,
  visiblePadding,
}) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.idle;
  const showDestination = Boolean(destinationLabel) && destinationLabel !== 'Destination';

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const mapResizeObserverRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [controlsActive, setControlsActive] = useState(false);
  const [routes, setRoutes] = useState({ approach: null, main: null });

  const originCoord = useMemo(() => resolvePlace(originLabel), [originLabel]);
  const destCoord = useMemo(() => resolvePlace(destinationLabel), [destinationLabel]);
  // Truck 1 sat north-east of the pickup point, which is exactly where the "Pickup
  // location" banner (anchored bottom-left, extending up and to the right) renders —
  // it was hidden behind that banner for the app's default pickup label. Moved it due
  // west, clear of the banner, and kept 2/3 south so all three stay visually separated.
  const driverStart = useMemo(() => [originCoord[0] - 0.003, originCoord[1] + 0.0005], [originCoord]);
  const driverStart2 = useMemo(() => [originCoord[0] - 0.001, originCoord[1] - 0.0035], [originCoord]);
  const driverStart3 = useMemo(() => [originCoord[0] + 0.0028, originCoord[1] - 0.002], [originCoord]);

  // Create the map once per mount after loading transformed LoadMastr style JSON.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    let isCancelled = false;

    getLoadMastrMapStyle().then((mapStyle) => {
      if (isCancelled || !containerRef.current) return;

      const map = new MaplibreMap({
        container: containerRef.current,
        style: mapStyle,
        center: originCoord,
        zoom: 13.5,
        attributionControl: { compact: true },
        scrollZoom: fullBleed,
        dragPan: fullBleed,
        doubleClickZoom: fullBleed,
        touchZoomRotate: fullBleed,
        dragRotate: false,
        pitchWithRotate: false,
        keyboard: false,
      });
      mapRef.current = map;

      // MapLibre measures its container once at construction. This component's map div
      // sits inside a flex layout (RequestEntry's fullBleed screen, cards mid-mount, etc.)
      // that may not have settled to its final size yet at that exact instant — the canvas
      // element itself gets resized correctly later, but MapLibre's *internal* transform
      // dimensions (what project()/fitBounds/marker positioning all use) silently keep the
      // stale initial measurement, so every marker ends up positioned as if the map were
      // still that original, wrong size. A ResizeObserver keeps it synced with reality.
      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      mapResizeObserverRef.current = resizeObserver;

      map.on('load', () => {
        map.addSource('approach-route', { type: 'geojson', data: lineFC([]) });
        map.addSource('approach-progress', { type: 'geojson', data: lineFC([]) });
        map.addSource('main-route', { type: 'geojson', data: lineFC([]) });
        map.addSource('main-progress', { type: 'geojson', data: lineFC([]) });

        // Spec Section 3: Active route double-layer treatment (Outline #369663 under Primary #50BB7F)
        map.addLayer({
          id: 'approach-route-casing',
          type: 'line',
          source: 'approach-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeOutline, 'line-width': 7, 'line-opacity': 0.7 },
        });
        map.addLayer({
          id: 'approach-route-line',
          type: 'line',
          source: 'approach-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeActive, 'line-width': 4.5, 'line-opacity': 0.5, 'line-dasharray': [1, 1.6] },
        });
        map.addLayer({
          id: 'approach-progress-casing',
          type: 'line',
          source: 'approach-progress',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeOutline, 'line-width': 7, 'line-opacity': 0.95 },
        });
        map.addLayer({
          id: 'approach-progress-line',
          type: 'line',
          source: 'approach-progress',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeActive, 'line-width': 4.5 },
        });

        // Main route double-layer treatment
        map.addLayer({
          id: 'main-route-casing',
          type: 'line',
          source: 'main-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeOutline, 'line-width': 8, 'line-opacity': 0.8 },
        });
        map.addLayer({
          id: 'main-route-line',
          type: 'line',
          source: 'main-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeActive, 'line-width': 5, 'line-opacity': 0.5, 'line-dasharray': [1, 1.5] },
        });

        // Progress route double-layer treatment
        map.addLayer({
          id: 'main-progress-casing',
          type: 'line',
          source: 'main-progress',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeOutline, 'line-width': 8, 'line-opacity': 1.0 },
        });
        map.addLayer({
          id: 'main-progress-line',
          type: 'line',
          source: 'main-progress',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': MAP_TOKENS.routeActive, 'line-width': 5 },
        });

        setMapLoaded(true);
      });
    });

    return () => {
      isCancelled = true;
      if (mapResizeObserverRef.current) {
        mapResizeObserverRef.current.disconnect();
        mapResizeObserverRef.current = null;
      }
      Object.keys(markersRef.current).forEach((key) => removeMarker(markersRef, key));
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
    // Map is created once; it isn't recreated when props change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch a real driving route whenever the resolved places change.
  useEffect(() => {
    let cancelled = false;
    setRoutes({ approach: null, main: null });
    (async () => {
      const approachPromise = config.showApproach ? fetchRoute(driverStart, originCoord) : Promise.resolve(null);
      const mainPromise = showDestination ? fetchRoute(originCoord, destCoord) : Promise.resolve(null);
      const [approach, main] = await Promise.all([approachPromise, mainPromise]);
      if (!cancelled) setRoutes({ approach, main });
    })();
    return () => {
      cancelled = true;
    };
  }, [driverStart, originCoord, destCoord, showDestination, config.showApproach]);

  // Frame the map on the relevant points whenever the places change.
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // MapLibre's `padding` option is sticky: flyTo/easeTo/fitBounds all persist whatever
    // padding they're given onto the map's transform, and fitBounds' own camera math then
    // adds ITS padding argument on top of that already-persisted value rather than replacing
    // it. Resetting padding to zero before every call keeps each one's own padding argument
    // as the sole source of truth.
    map.stop();
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });

    const containerHeight = containerRef.current?.clientHeight || 850;
    const safeBottomPadding = visiblePadding?.bottom ?? Math.min(345, Math.floor(containerHeight * 0.44));
    const safeTopPadding = visiblePadding?.top ?? Math.min(105, Math.floor(containerHeight * 0.13));
    const safeLeftPadding = visiblePadding?.left ?? 36;
    const safeRightPadding = visiblePadding?.right ?? 36;

    const activePadding = {
      top: safeTopPadding,
      bottom: safeBottomPadding,
      left: safeLeftPadding,
      right: safeRightPadding,
    };

    if (!showDestination && (state === 'idle' || state === 'searching')) {
      // Before ordering: Keep current location centered in the VISIBLE map area with a relaxed zoom out (13.5)
      map.flyTo({ center: originCoord, zoom: 13.5, padding: activePadding, duration: 600 });
    } else {
      // Once destination is set or during active trip: zoom out and fit bounds to encompass both locations & route (maxZoom 12.8)
      const bounds = new LngLatBounds();
      bounds.extend(originCoord);
      if (showDestination && destCoord) {
        bounds.extend(destCoord);
      }
      if (config.showApproach && driverStart) {
        bounds.extend(driverStart);
      }
      // If OSRM route geometry is ready, extend bounds across route points for full polyline visibility
      if (showDestination && routes.main && routes.main.length > 0) {
        routes.main.forEach((pt) => bounds.extend(pt));
      }

      // fitBounds places a bounds corner exactly ON the padding edge — a point at the
      // fitted extreme lands with zero margin. Markers have their own visual footprint
      // (pickup/destination dots plus their label bubbles), so without extra clearance
      // beyond the raw UI-obstruction padding, a boundary marker renders clipped right at
      // the edge of the bottom sheet / status bar instead of comfortably inside it.
      const markerClearance = 36;
      const fitPadding = {
        top: activePadding.top + markerClearance,
        bottom: activePadding.bottom + markerClearance,
        left: activePadding.left + markerClearance,
        right: activePadding.right + markerClearance,
      };

      map.fitBounds(bounds, { padding: fitPadding, maxZoom: 12.8, duration: 700 });
    }

    setControlsActive(true);
    setTimeout(() => setControlsActive(false), 1200);
  };

  useEffect(() => {
    handleRecenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, driverStart, originCoord, destCoord, showDestination, routes.main, fullBleed]);

  // Dynamic calculation for pickup banner tag side (left vs right)
  const updatePickupBannerSide = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !originCoord) return;

    let cardSide = 'right';
    try {
      const pt = map.project(originCoord);
      const w = map.getContainer()?.clientWidth || 390;
      if (pt.x > w * 0.55) {
        cardSide = 'left';
      }
    } catch {
      cardSide = 'right';
    }

    const hasPickupTag = Boolean(originLabel && originLabel.trim() !== '');
    const targetAnchor = cardSide === 'left' ? 'bottom-right' : 'bottom-left';
    const targetOffset = cardSide === 'left' ? [19, 0] : [-19, 0];

    const originLabelMarker = ensureMarker(
      markersRef,
      map,
      'origin-label',
      () => buildPickupBannerLabelEl('Pickup location', originLabel || '', hasPickupTag, cardSide),
      originCoord,
      {
        anchor: targetAnchor,
        offset: targetOffset,
      }
    );

    const containerEl = originLabelMarker.getElement();
    if (containerEl) {
      const bannerCard = containerEl.querySelector('.lm-banner-card');
      if (bannerCard) {
        bannerCard.style.display = hasPickupTag ? 'flex' : 'none';
        const labelEl = bannerCard.querySelector('[data-label]');
        if (labelEl) labelEl.textContent = originLabel || '';
      }
    }
  }, [mapLoaded, originCoord, originLabel]);

  // Subscribe to map camera movements so the tag automatically flips side during fitBounds or dragPan
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return undefined;

    const handleMove = () => updatePickupBannerSide();
    // Fire immediately in case map was panned/fitted
    handleMove();
    map.on('move', handleMove);
    map.on('moveend', handleMove);
    return () => {
      map.off('move', handleMove);
      map.off('moveend', handleMove);
    };
  }, [mapLoaded, updatePickupBannerSide]);

  // Sync route lines and markers with the current trip state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const approachCoords = routes.approach ?? (config.showApproach ? [driverStart, originCoord] : []);
    const mainCoords = routes.main ?? (showDestination ? [originCoord, destCoord] : []);

    setLineSource(map, 'approach-route', config.showApproach ? approachCoords : []);
    setLineSource(map, 'approach-progress', config.showApproach ? sliceRoute(approachCoords, config.progress) : []);

    const showMainPreview = showDestination && (config.phase === 'main' || state === 'idle' || state === 'searching');
    setLineSource(map, 'main-route', showMainPreview ? mainCoords : []);
    setLineSource(map, 'main-progress', showDestination && config.phase === 'main' ? sliceRoute(mainCoords, config.progress) : []);

    // Spec Section 3: a finished trip's travelled line reads as "completed" (#7BBF99),
    // distinct from an in-progress trip's "active" green (#50BB7F). The layer is created once
    // at map load, so its paint has to be repainted here rather than set once at creation.
    map.setPaintProperty('main-progress-line', 'line-color', config.done ? MAP_TOKENS.routeCompleted : MAP_TOKENS.routeActive);

    // Spec Section 5: Customer GPS Location (Blue dot convention) when in idle/searching
    if (state === 'idle' || state === 'searching') {
      ensureMarker(markersRef, map, 'user-gps', buildUserGpsLocationEl, originCoord, { anchor: 'center' });
    } else {
      removeMarker(markersRef, 'user-gps');
    }

    // Spec Section 4: Pickup Marker ◉ (#50BB7F outer, #FFFFFF fill, #50BB7F center) + Label
    const isPulseActive = state === 'idle';
    const originMarker = ensureMarker(
      markersRef,
      map,
      'origin',
      () => buildPickupMarkerEl(isPulseActive),
      originCoord,
      { anchor: 'center' }
    );
    applyPickupMarkerPulse(originMarker.getElement(), isPulseActive);

    // Dynamic pickup banner side (left vs right) based on active projected screen X coordinate
    updatePickupBannerSide();

    // Spec Section 4: Destination Marker ◉ (#1F2937 outer, #FFFFFF fill, #1F2937 center) + Label
    if (showDestination) {
      ensureMarker(markersRef, map, 'destination', buildDestinationMarkerEl, destCoord, { anchor: 'center' });
      const destLabelMarker = ensureMarker(
        markersRef,
        map,
        'destination-label',
        () => buildSpeechBubbleLabelEl('Destination', destinationLabel),
        destCoord,
        {
          anchor: 'bottom',
          offset: [0, -16],
        }
      );
      destLabelMarker.getElement().querySelector('[data-label]').textContent = destinationLabel;
    } else {
      removeMarker(markersRef, 'destination');
      removeMarker(markersRef, 'destination-label');
    }

    // Nearby 3 Truck Markers (THD Spec Sheet v1.0 match)
    if (state === 'idle' || state === 'searching') {
      removeMarker(markersRef, 'trucks-nearby-label');

      // Truck 1: Main nearby driver (front view, facing south-east)
      const t1 = ensureMarker(
        markersRef,
        map,
        'trucks-nearby',
        () => buildTruckMarkerEl('available', 'front', false),
        driverStart,
        { anchor: 'center' }
      );
      applyTruckMarkerState(t1.getElement(), 'available', 'front', false);

      // Truck 2: Second driver nearby (front view, flipped horizontally -> facing south-west)
      const t2 = ensureMarker(
        markersRef,
        map,
        'trucks-nearby-2',
        () => buildTruckMarkerEl('available', 'front', true),
        driverStart2,
        { anchor: 'center' }
      );
      applyTruckMarkerState(t2.getElement(), 'available', 'front', true);

      // Truck 3: Third driver nearby (back view, flipped horizontally -> facing north-east)
      const t3 = ensureMarker(
        markersRef,
        map,
        'trucks-nearby-3',
        () => buildTruckMarkerEl('available', 'back', true),
        driverStart3,
        { anchor: 'center' }
      );
      applyTruckMarkerState(t3.getElement(), 'available', 'back', true);
    } else {
      removeMarker(markersRef, 'trucks-nearby');
      removeMarker(markersRef, 'trucks-nearby-label');
      removeMarker(markersRef, 'trucks-nearby-2');
      removeMarker(markersRef, 'trucks-nearby-3');
    }

    // Moving marker: idle pulse ring, searching indicator, or truck along the route with dynamic segment orientation
    removeMarker(markersRef, 'idle-pulse');
    if (config.pulse) {
      removeMarker(markersRef, 'truck');
      ensureMarker(markersRef, map, 'search', buildSearchEl, originCoord, { anchor: 'center' });
    } else {
      removeMarker(markersRef, 'search');
      if (state !== 'idle') {
        const curveCoords = config.phase === 'pre' ? approachCoords : mainCoords;
        const point = pointAlongRoute(curveCoords, config.progress);

        // Dynamic segment bearing calculation for truck direction (front/back + left/right flip)
        let facingDir = 'front';
        let flipDir = false;
        if (curveCoords && curveCoords.length >= 2) {
          const idx = Math.min(
            Math.floor(config.progress * (curveCoords.length - 1)),
            curveCoords.length - 2
          );
          const p1 = curveCoords[idx];
          const p2 = curveCoords[idx + 1];
          if (p1 && p2) {
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            if (dy < 0) {
              // Heading South / towards bottom
              facingDir = 'front';
              flipDir = dx < 0; // if heading west, flip
            } else {
              // Heading North / towards top
              facingDir = 'back';
              flipDir = dx >= 0; // if heading east, flip
            }
          }
        }

        const truckMarker = ensureMarker(
          markersRef,
          map,
          'truck',
          () => buildTruckMarkerEl(config.truckState || 'selected', facingDir, flipDir),
          [point.lng, point.lat],
          { anchor: 'center' }
        );
        applyTruckMarkerState(truckMarker.getElement(), config.truckState || 'selected', facingDir, flipDir);
      } else {
        removeMarker(markersRef, 'truck');
      }
    }

    // Completion badge
    if (config.done && showDestination) {
      ensureMarker(markersRef, map, 'done', buildDoneEl, destCoord, { anchor: 'center', offset: [16, -16] });
    } else {
      removeMarker(markersRef, 'done');
    }
  }, [mapLoaded, routes, state, config, originLabel, destinationLabel, showDestination, driverStart, driverStart2, driverStart3, originCoord, destCoord, updatePickupBannerSide]);

  return (
    <div
      className={cx(
        'relative w-full overflow-hidden bg-[#F7F8F7]',
        fullBleed ? 'h-full' : 'rounded-card border border-neutral-200',
        className
      )}
      style={fullBleed ? undefined : { aspectRatio: '400 / 280' }}
    >
      {/* MapLibre Canvas Container */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* State badge overlay */}
      {!fullBleed && state !== 'idle' && (
        <span className="absolute z-20 left-3 top-3 text-[11.5px] font-semibold text-[#263238] bg-white/95 backdrop-blur-md rounded-full px-3.5 py-1 shadow-sm border border-[#E2E8E5]">
          {config.label}
        </span>
      )}

      {/* Spec Section 8: Map controls button (Recenter / GPS) */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Recenter Map"
        className={cx(
          'absolute z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 border',
          fullBleed ? 'top-12 right-4' : 'top-3.5 right-3.5',
          controlsActive
            ? 'bg-[#E8F7EF] text-[#369663] border-[#50BB7F] scale-105'
            : 'bg-white text-[#263238] border-[#E2E8E5] hover:bg-[#F2FAF5]'
        )}
      >
        <Navigation size={17} className={controlsActive ? 'rotate-45 transition-transform' : ''} />
      </button>
    </div>
  );
}

