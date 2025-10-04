/* eslint-disable @typescript-eslint/array-type */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, View, Platform, ToastAndroid, Alert, LogBox } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/authContext";
import * as Clipboard from "expo-clipboard";
import Logger from "@maplibre/maplibre-react-native";
import {
  MapView,
  Camera,
  UserLocation,
  type CameraRef,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";
import {
  DEFAULT_ZOOM,
  ILOILO_CENTER,
  GEOAPIFY_RASTER_STYLE,
  PANAY_MAX_BOUNDS,
  AOI_GEOJSON_URL,
  GEOAPIFY_KEY,
} from "@/constants/map";
import LocationHeader from "@/components/LocationHeader";
import RequestStepper from "@/components/RequestStepper";
import { useCurrentAddress } from "@/hooks/useCurrentAddress";
import { BlurView } from "expo-blur";
import NavBanner from "@/components/NavBanner";
import { useLiveNavigation } from "@/hooks/useLiveNavigation";

/* ---------- DEV: silence MapLibre spam EARLY (before first render) ---------- */
if (__DEV__) {
  LogBox.ignoreLogs([
    "Mbgl-HttpRequest",
    "Request failed due to a permanent error: Canceled",
    "MapLibre error",
    "Failed to load tile",
    "{TextureViewRend}[Style]",
  ]);
  const shouldSkip = (args: any[]) =>
    args?.some(
      (a: any) =>
        typeof a === "string" &&
        (a.includes("Mbgl-HttpRequest") ||
          a.includes("Request failed due to a permanent error: Canceled") ||
          a.includes("MapLibre error") ||
          a.includes("Failed to load tile") ||
          a.includes("{TextureViewRend}[Style]"))
    );
  const __orig = { log: console.log, warn: console.warn, info: console.info, error: console.error };
  // eslint-disable-next-line no-console
  console.log = (...a: any[]) => (shouldSkip(a) ? undefined : __orig.log(...a));
  // eslint-disable-next-line no-console
  console.warn = (...a: any[]) => (shouldSkip(a) ? undefined : __orig.warn(...a));
  // eslint-disable-next-line no-console
  console.info = (...a: any[]) => (shouldSkip(a) ? undefined : __orig.info(...a));
  // eslint-disable-next-line no-console
  console.error = (...a: any[]) => (shouldSkip(a) ? undefined : __orig.error(...a));
}
/* -------------------------------------------------------------------------- */

// ---------- Dev-only raster fallback (if Geoapify host is unreachable) ----------
const OSM_FALLBACK_RASTER_STYLE: any = {
  version: 8,
  name: "osm-fallback",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 22 }],
};
// -----------------------------------------------------------------------------

// Liquid Glass (SDK 54+). Safe import & fallback.
let GlassView: any, isLiquidGlassAvailable: (() => boolean) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require("expo-glass-effect");
  GlassView = m.GlassView;
  isLiquidGlassAvailable = m.isLiquidGlassAvailable;
} catch {}

const SHEET_MARGIN_BOTTOM = 110;

const LiquidGlassBackdrop: React.FC<{ opacity?: number }> = ({ opacity = 0.55 }) => {
  const canLiquid = Platform.OS === "ios" && GlassView && (isLiquidGlassAvailable?.() ?? true);
  if (canLiquid) {
    return (
      <GlassView
        pointerEvents="none"
        glassEffectStyle="regular"
        style={[StyleSheet.absoluteFill, { opacity }]}
      />
    );
  }
  return <BlurView pointerEvents="none" tint="dark" intensity={20} style={[StyleSheet.absoluteFill, { opacity }]} />;
};

const Home = () => {
  const { user: currentUser } = useAuth();
  const cameraRef = useRef<CameraRef | null>(null);
  const movedOnceRef = useRef(false);

  const { locating, hasLocation, address, fix, recenter } = useCurrentAddress();

  const [showAoi, setShowAoi] = useState(false);

  // Stepper UI
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  // Route state
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [routeSteps, setRouteSteps] = useState<
    { instruction: string; distance: number; duration: number; lat?: number; lon?: number }[]
  >([]);

  // Live navigation controller
  const { active, progressText, start, stop } = useLiveNavigation({ speak: true, rerouteDistance: 80 });

  // IMPORTANT: start with no style; decide after reachability probe to avoid first-frame errors
  const [mapStyle, setMapStyle] = useState<any | null>(null);

  // Try to disable MapLibre bridge logs as well
  useEffect(() => {
    try {
      (Logger as any).setLogLevel?.("off");
      (Logger as any).setLogLevel?.("none");
      (Logger as any).setLogLevel?.(0);
    } catch {}
  }, []);

  // ---- Reachability probe (no expo-network). Decide style BEFORE rendering MapView. ----
  const verifyGeoapifyReachable = useCallback(async () => {
    try {
      const testUrl = `https://maps.geoapify.com/v1/tile/osm-bright/1/1/1.png?apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(testUrl, { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await verifyGeoapifyReachable();
      setMapStyle(ok ? GEOAPIFY_RASTER_STYLE : OSM_FALLBACK_RASTER_STYLE);
      if (!ok) {
        if (Platform.OS === "android") ToastAndroid.show("Geoapify unreachable — using OSM fallback", ToastAndroid.LONG);
        else Alert.alert("Map tiles", "Geoapify unreachable — using OSM fallback");
      }
    })();
  }, [verifyGeoapifyReachable]);

  /** Geoapify Routing API (GeoJSON output + instructions) */
  const fetchRoute = async (origin: [number, number], dest: [number, number]) => {
    try {
      const waypoints = `${origin[1]},${origin[0]}|${dest[1]},${dest[0]}`; // lat,lon|lat,lon
      const url =
        `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(
          waypoints
        )}&mode=drive&details=instruction_details,route_details&format=geojson&apiKey=${GEOAPIFY_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json && json.type === "FeatureCollection" && json.features?.length) {
        setRouteGeoJSON(json);

        const legs = json.features[0]?.properties?.legs || [];
        const firstLeg = legs[0] || {};
        const steps = (firstLeg.steps || []).map((s: any) => {
          const coord = s?.from?.location || s?.to?.location || null; // [lon, lat]
          return {
            instruction: s?.instruction?.text || s?.instruction || "Continue",
            distance: s?.distance || 0,
            duration: s?.time || s?.duration || 0,
            lat: coord ? coord[1] : undefined,
            lon: coord ? coord[0] : undefined,
          };
        });
        setRouteSteps(steps);
      }
    } catch (err) {
      // This stays quiet due to dev filter; still useful in production logs if needed.
      console.warn("Geoapify route error", err);
    }
  };

  // Initial camera + route (once)
  useEffect(() => {
    if (!locating && fix && cameraRef.current && !movedOnceRef.current) {
      // Instant camera changes (0ms) to reduce intermediate tile churn
      // @ts-ignore
      cameraRef.current.moveTo(fix, 0);
      setTimeout(() => {
        // @ts-ignore
        cameraRef.current?.zoomTo(DEFAULT_ZOOM, 0);
      }, 0);
      movedOnceRef.current = true;
      setTimeout(() => setShowAoi(true), 300);

      // Demo: route to Iloilo center
      fetchRoute([fix[0], fix[1]], ILOILO_CENTER);
    }
  }, [locating, fix]);

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(locating ? "Locating…" : address || "");
      if (Platform.OS === "android") ToastAndroid.show("Location copied", ToastAndroid.SHORT);
      else Alert.alert("Copied", "Location copied to clipboard");
    } catch {}
  };

  const handleStartNav = () => {
    if (!routeSteps.length) {
      if (Platform.OS === "android") ToastAndroid.show("No route yet", ToastAndroid.SHORT);
      else Alert.alert("Navigation", "No route yet");
      return;
    }
    start(routeSteps);
  };
  const handleStopNav = () => stop();

  // Don’t render MapView until tile host decision is made (prevents the red LogBox pill)
  if (!mapStyle) {
    return (
      <ScreenWrapper style={{ paddingTop: 0 }}>
        <View style={styles.container} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={mapStyle}
          attributionEnabled
          compassEnabled
          logoEnabled={false}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{ centerCoordinate: ILOILO_CENTER, zoomLevel: DEFAULT_ZOOM }}
            maxBounds={PANAY_MAX_BOUNDS}
            followUserLocation={hasLocation}
            followZoomLevel={DEFAULT_ZOOM}
          />

          <UserLocation visible renderMode="native" showsUserHeadingIndicator androidRenderMode="gps" />

          {/* AOI overlay (only if you set a URL) */}
          {showAoi && !!AOI_GEOJSON_URL && (
            <ShapeSource id="aoi-geojson" url={AOI_GEOJSON_URL}>
              <FillLayer id="aoi-fill" style={{ fillOpacity: 0.08, fillColor: "#000000" }} />
              <LineLayer id="aoi-line" style={{ lineColor: "#000000", lineWidth: 1.5 }} />
              <SymbolLayer
                id="aoi-labels"
                style={{
                  textField: ["get", "name"] as any,
                  textSize: 12,
                  textColor: "#111111",
                  textHaloColor: "#FFFFFF",
                  textHaloWidth: 1,
                  textAllowOverlap: false,
                }}
              />
            </ShapeSource>
          )}

          {/* Route line (GeoJSON from Geoapify) */}
          {routeGeoJSON && (
            <ShapeSource id="route" shape={routeGeoJSON}>
              <LineLayer
                id="route-line"
                style={{ lineColor: "#00AEEF", lineWidth: 5, lineCap: "round", lineJoin: "round" }}
              />
            </ShapeSource>
          )}
        </MapView>

        {/* Frosted backdrop layer */}
        <LiquidGlassBackdrop opacity={0.55} />

        {/* Header */}
        <LocationHeader username={currentUser?.name} address={address} locating={locating} onCopy={handleCopyAddress} />

        {/* Live navigation banner */}
        <NavBanner active={active} text={progressText} onStart={handleStartNav} onStop={handleStopNav} />

        {/* Bottom request sheet */}
        <RequestStepper
          step={step}
          setStep={setStep as any}
          vehicleModel={vehicleModel}
          setVehicleModel={setVehicleModel}
          plateNumber={plateNumber}
          setPlateNumber={setPlateNumber}
          otherInfo={otherInfo}
          setOtherInfo={setOtherInfo}
          onRecenter={recenter}
          bottomInset={SHEET_MARGIN_BOTTOM}
          steps={routeSteps}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
