/* eslint-disable @typescript-eslint/array-type */
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Platform,
  ToastAndroid,
  Alert,
  LogBox,
} from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/authContext";
import * as Clipboard from "expo-clipboard";
import Logger from "@maplibre/maplibre-react-native";
import {
  MapView,
  Camera,
  // UserLocation,  // ⛔ removed (we'll draw our own avatar marker)
  type CameraRef,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
  PointAnnotation, // ✅ use a custom annotation for the avatar
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
import RequestStatusOverlay from "@/components/RequestStatusOverlay";
import { addActivityItem, updateActivityItem } from "@/utils/activityStore";
import { getSocket } from "@/socket/socket";
// ⚠️ replaced: import { assistRequest } from "@/socket/socketEvents";
import {
  assistCreate,
  onAssistApproved,
  onAssistStatus,
} from "@/socket/socketEvents";
import Avatar from "@/components/Avatar"; // ✅ reuse your Avatar component

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
  const __orig = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    error: console.error,
  };
  // eslint-disable-next-line no-console
  console.log = (...a: any[]) => (shouldSkip(a) ? undefined : __orig.log(...a));
  // eslint-disable-next-line no-console
  console.warn = (...a: any[]) =>
    shouldSkip(a) ? undefined : __orig.warn(...a);
  // eslint-disable-next-line no-console
  console.info = (...a: any[]) =>
    shouldSkip(a) ? undefined : __orig.info(...a);
  // eslint-disable-next-line no-console
  console.error = (...a: any[]) =>
    shouldSkip(a) ? undefined : __orig.error(...a);
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
  layers: [
    { id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 22 },
  ],
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

const LiquidGlassBackdrop: React.FC<{ opacity?: number }> = ({
  opacity = 0.55,
}) => {
  const canLiquid =
    Platform.OS === "ios" && GlassView && (isLiquidGlassAvailable?.() ?? true);
  if (canLiquid) {
    return (
      <GlassView
        pointerEvents="none"
        glassEffectStyle="regular"
        style={[StyleSheet.absoluteFill, { opacity }]}
      />
    );
  }
  return (
    <BlurView
      pointerEvents="none"
      tint="dark"
      intensity={20}
      style={[StyleSheet.absoluteFill, { opacity }]}
    />
  );
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

  // Map style after reachability probe
  const [mapStyle, setMapStyle] = useState<any | null>(null);

  // Request status overlay
  const [overlay, setOverlay] = useState<{
    visible: boolean;
    kind: "requesting" | "accepted";
    caption?: string;
  }>({
    visible: false,
    kind: "requesting",
    caption: undefined,
  });

  // local refs to correlate ack/approval
  const pendingLocalIdRef = useRef<string | null>(null);
  const serverAssistIdRef = useRef<string | null>(null);

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
        if (Platform.OS === "android")
          ToastAndroid.show(
            "Geoapify unreachable — using OSM fallback",
            ToastAndroid.LONG
          );
        else
          Alert.alert("Map tiles", "Geoapify unreachable — using OSM fallback");
      }
    })();
  }, [verifyGeoapifyReachable]);

  // Initial camera (once)
  useEffect(() => {
    if (!locating && fix && cameraRef.current && !movedOnceRef.current) {
      // @ts-ignore
      cameraRef.current.moveTo(fix, 0);
      setTimeout(() => {
        // @ts-ignore
        cameraRef.current?.zoomTo(DEFAULT_ZOOM, 0);
      }, 0);
      movedOnceRef.current = true;
      setTimeout(() => setShowAoi(true), 300);
    }
  }, [locating, fix]);

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(locating ? "Locating…" : address || "");
      if (Platform.OS === "android")
        ToastAndroid.show("Location copied", ToastAndroid.SHORT);
      else Alert.alert("Copied", "Location copied to clipboard");
    } catch {}
  };

  /** =======================
   *  REQUEST ASSIST FLOW (FINAL)
   *  ======================= */
  const onRequestAssist = async () => {
    if (!currentUser) {
      Alert.alert("Login required", "Please sign in first.");
      return;
    }
    if (!fix) {
      Alert.alert("Location", "Waiting for GPS fix. Please try again.");
      return;
    }

    // 1) Create a local activity entry
    const localId = `act_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    pendingLocalIdRef.current = localId;

    await addActivityItem({
      id: localId,
      title: "Request assistance",
      placeName: address || "Unknown location",
      createdAt: new Date().toISOString(),
      status: "pending",
      meta: {
        vehicleModel,
        plateNumber,
        otherInfo,
        // will be filled after server ack:
        assistId: null as unknown as string | null,
      },
    });

    // 2) Show “requesting…”
    setOverlay({ visible: true, kind: "requesting" });

    // 3) Emit the correct payload that your server expects
    const payload = {
      vehicle: {
        model: vehicleModel.trim(),
        plate: plateNumber.trim(),
        notes: otherInfo.trim(),
      },
      location: {
        lat: fix[1],
        lng: fix[0],
        address: address || "",
      },
    };

    // 4) Send and capture ack once (will include mongo document id)
    assistCreate(payload, async (ack) => {
      if (ack?.success && ack?.data?.id && pendingLocalIdRef.current) {
        serverAssistIdRef.current = String(ack.data.id);
        await updateActivityItem(pendingLocalIdRef.current, {
          meta: {
            vehicleModel,
            plateNumber,
            otherInfo,
            assistId: serverAssistIdRef.current,
          },
        });
      }
    });

    // 5) Listen for “approved” (operator accepted)
    const socket = getSocket();
    if (!socket) return;

    const onApproved = async (evt: any) => {
      const srvId = String(evt?.data?.id || "");
      if (!evt?.success || !srvId) return;

      // Only accept if it matches the last created assist (if known)
      if (serverAssistIdRef.current && srvId !== serverAssistIdRef.current)
        return;

      const targetLocalId = pendingLocalIdRef.current;
      if (targetLocalId) {
        await updateActivityItem(targetLocalId, { status: "accepted" });
      }

      setOverlay({
        visible: true,
        kind: "accepted",
        caption:
          "Please check your Inbox to communicate with your service provider",
      });

      setTimeout(() => setOverlay((o) => ({ ...o, visible: false })), 1600);

      onAssistApproved(onApproved, true);
      onAssistStatus(onStatus, true);
    };

    const onStatus = async (evt: any) => {
      // Optional: react to completed/cancelled etc.
      const srvId = String(evt?.data?.id || "");
      if (!evt?.success || !srvId) return;

      // Map server status -> local store labels
      const raw = String(evt?.data?.status || "").toLowerCase();
      const map: Record<string, "done" | "canceled" | "pending" | "accepted"> =
        {
          completed: "done",
          cancelled: "canceled",
          canceled: "canceled",
          rejected: "canceled",
          pending: "pending",
          accepted: "accepted",
        };
      const localStatus = map[raw] || "pending";

      // Try to find the local pending item
      const targetLocalId = pendingLocalIdRef.current;
      if (targetLocalId) {
        await updateActivityItem(targetLocalId, { status: localStatus });
      }
    };

    onAssistApproved(onApproved);
    onAssistStatus(onStatus);
  };

  // Don’t render MapView until tile host decision is made
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
            defaultSettings={{
              centerCoordinate: ILOILO_CENTER,
              zoomLevel: DEFAULT_ZOOM,
            }}
            maxBounds={PANAY_MAX_BOUNDS}
            followUserLocation={hasLocation}
            followZoomLevel={DEFAULT_ZOOM}
          />

          {/* ⛔ Original arrow marker removed */}
          {/* <UserLocation visible renderMode="native" showsUserHeadingIndicator androidRenderMode="gps" /> */}

          {/* ✅ Custom user marker with the account avatar */}
          {!!fix && (
            <PointAnnotation
              id="me"
              coordinate={fix}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.avatarMarker}>
                {/* Your Avatar already accepts string/require/object uris */}
                <Avatar uri={(currentUser as any)?.avatar} size={42} />
              </View>
            </PointAnnotation>
          )}

          {/* AOI overlay (only if you set a URL) */}
          {showAoi && !!AOI_GEOJSON_URL && (
            <ShapeSource id="aoi-geojson" url={AOI_GEOJSON_URL}>
              <FillLayer
                id="aoi-fill"
                style={{ fillOpacity: 0.08, fillColor: "#000000" }}
              />
              <LineLayer
                id="aoi-line"
                style={{ lineColor: "#000000", lineWidth: 1.5 }}
              />
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
        </MapView>

        {/* Frosted backdrop layer */}
        <LiquidGlassBackdrop opacity={0.55} />

        {/* Header */}
        <LocationHeader
          username={currentUser?.name}
          address={address}
          locating={locating}
          onCopy={handleCopyAddress}
        />

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
          onRequest={onRequestAssist}
        />

        {/* Status overlays */}
        <RequestStatusOverlay
          visible={overlay.visible}
          kind={overlay.kind}
          caption={overlay.caption}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Small soft container so the avatar pops on all basemaps
  avatarMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    // subtle shadow (Android/iOS)
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
