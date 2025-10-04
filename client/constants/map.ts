import Constants from "expo-constants";

/** Keys from app.json -> expo.extra */
export const GEOAPIFY_KEY: string =
  (Constants.expoConfig?.extra as any)?.GEOAPIFY_KEY || "7ce1866e9a854276bcad7b6ca897f1fd";

/** Iloilo City (lng, lat) */
export const ILOILO_CENTER: [number, number] = [122.564, 10.72];

/** Default zoom for the city */
export const DEFAULT_ZOOM = 13;

/** Keep bounds (Panay) if you want to avoid accidental “world view” */
export const PANAY_MAX_BOUNDS = {
  sw: [121.7, 10.1] as [number, number],
  ne: [123.3, 11.9] as [number, number],
};

/**
 * ✅ RASTER style (no sprites/glyphs = avoids your timeouts)
 * Source: Geoapify raster tiles (osm-bright).
 */
export const GEOAPIFY_RASTER_STYLE: any = {
  version: 8,
  name: "geoapify-osm-bright-raster",
  sources: {
    default: {
      type: "raster",
      tiles: [
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © Geoapify",
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: "raster-tiles",
      type: "raster",
      source: "default",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/** AOI overlay: disabled (no dataset). Put your own GeoJSON URL to re-enable. */
export const AOI_GEOJSON_URL = ""; // ""
