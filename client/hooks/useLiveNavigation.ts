// client/hooks/useLiveNavigation.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import * as Speech from "expo-speech";

type Step = {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  // Optionally: a "point" (lat,lon) for the maneuver; Geoapify steps may include geometry
  lat?: number;
  lon?: number;
};

type LatLng = { latitude: number; longitude: number };

function haversine(a: LatLng, b: LatLng) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useLiveNavigation(opts?: { speak?: boolean; rerouteDistance?: number }) {
  const speakEnabled = opts?.speak ?? true;
  const rerouteDistance = opts?.rerouteDistance ?? 80; // meters from nearest step point to trigger reroute

  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [progressText, setProgressText] = useState<string>("");

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const currentStep = steps[currentIndex];
  const nextStep = steps[currentIndex + 1];

  // Speak helper
  const speak = useCallback((msg: string) => {
    if (!speakEnabled || !msg) return;
    try {
      Speech.stop();
      Speech.speak(msg, { language: "en-US", pitch: 1, rate: 1 });
    } catch {}
  }, [speakEnabled]);

  const stop = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setActive(false);
    setProgressText("");
    try { Speech.stop(); } catch {}
  }, []);

  const start = useCallback(async (routeSteps: Step[]) => {
    if (!routeSteps?.length) return;
    setSteps(routeSteps);
    setCurrentIndex(0);
    setActive(true);

    speak(routeSteps[0]?.instruction || "Starting navigation");

    // start location updates
    try {
      const sub = await Location.watchPositionAsync(
        {
          // good balance for nav
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5, // meters
          timeInterval: 1500,  // ms
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          // Track progress toward next maneuver point, if available
          const c: LatLng = { latitude, longitude };

          let maneuverPoint: LatLng | null = null;
          if (currentStep?.lat != null && currentStep?.lon != null) {
            maneuverPoint = { latitude: currentStep.lat, longitude: currentStep.lon };
          } else if (nextStep?.lat != null && nextStep?.lon != null) {
            // fallback: head towards next step point
            maneuverPoint = { latitude: nextStep.lat, longitude: nextStep.lon };
          }

          if (maneuverPoint) {
            const d = haversine(c, maneuverPoint);
            setProgressText(`${Math.round(d)} m to next turn`);
            // Advance to next step when close enough
            if (d < 18) {
              setCurrentIndex((idx) => {
                const newIdx = Math.min(idx + 1, routeSteps.length - 1);
                const line = routeSteps[newIdx]?.instruction || (newIdx === routeSteps.length - 1 ? "You have arrived" : "Continue");
                speak(line);
                return newIdx;
              });
            }

            // Reroute heuristic: if you're far from the path target
            if (d > rerouteDistance) {
              // Flag to caller that we should reroute from current position
              // We keep it simple: just set a text; the screen can watch and decide
              setProgressText("Off route. Recalculating…");
            }
          } else {
            setProgressText("Navigating…");
          }
        }
      );
      watchRef.current = sub;
    } catch (e) {
      console.warn("[useLiveNavigation] watchPosition error", e);
    }
  }, [currentStep, nextStep, speak, rerouteDistance]);

  // cleanup
  useEffect(() => stop, [stop]);

  return {
    // state
    active,
    currentIndex,
    currentStep,
    nextStep,
    steps,
    progressText,
    // controls
    start,
    stop,
  };
}
