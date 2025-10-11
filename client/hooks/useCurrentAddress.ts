import { useEffect, useRef, useState, useCallback } from "react";
import * as Location from "expo-location";
import { GEOAPIFY_KEY } from "@/constants/map";

type Fix = [number, number];

function joinClean(parts: Array<string | undefined | null>, sep = ", ") {
  return parts.map(p => (p ?? "").toString().trim()).filter(Boolean).join(sep);
}
function formatFullAddress(r: Partial<Location.LocationGeocodedAddress>) {
  return joinClean(
    [r.name || r.street, r.district, r.city || r.subregion, r.region, r.postalCode],
    ", "
  );
}

export function useCurrentAddress() {
  const mounted = useRef(true);
  const [locating, setLocating] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [fix, setFix] = useState<Fix | null>(null);

  useEffect(() => () => { mounted.current = false; }, []);

  // Reverse-geocode: native first, then Geoapify fallback
  const reverseGeocodeSmart = useCallback(async (lat: number, lng: number) => {
    try {
      const basic = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = basic?.[0];
      if (r) {
        const full = formatFullAddress(r);
        const decent = !!(full && (r.city || r.subregion) && (r.name || r.street));
        if (decent) return full;
      }

      if (GEOAPIFY_KEY) {
        const url =
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const f = data?.features?.[0];
        if (f) {
          const p = f.properties || {};
          const merged: Partial<Location.LocationGeocodedAddress> = {
            name: p.name || p.street,
            street: p.street,
            district: p.suburb || p.district,
            city: p.city || p.town || p.village || p.county,
            region: p.state,
            postalCode: p.postcode,
          };
          const full = formatFullAddress(merged);
          if (full) return full;
        }
      }
    } catch (e) {
      console.warn("[reverseGeocodeSmart]", e);
    }
    return "Location found";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!mounted.current) return;
          setHasLocation(false);
          setLocating(false);
          setAddress("Location permission denied");
          return;
        }

        const last = await Location.getLastKnownPositionAsync();
        if (last && mounted.current) {
          const ll: Fix = [last.coords.longitude, last.coords.latitude];
          setFix(ll);
          setHasLocation(true);
          reverseGeocodeSmart(ll[1], ll[0]).then(a => {
            if (mounted.current) setAddress(a || "Location found");
          });
        }

        setLocating(true);
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted.current) return;
        const ll: Fix = [pos.coords.longitude, pos.coords.latitude];
        setFix(ll);
        setHasLocation(true);

        try {
          const a = await reverseGeocodeSmart(ll[1], ll[0]);
          if (mounted.current) setAddress(a || "Location found");
        } catch {
          if (mounted.current) setAddress("Location found");
        }
      } catch (e: any) {
        console.warn("[useCurrentAddress] get position", e?.message || e);
        if (mounted.current) {
          setHasLocation(false);
          setAddress("Location unavailable");
        }
      } finally {
        if (mounted.current) setLocating(false);
      }
    })();
  }, [reverseGeocodeSmart]);

  const tapGuard = useRef<number>(0);
  const recenter = useCallback(async () => {
    const now = Date.now();
    if (now - tapGuard.current < 500) return;
    tapGuard.current = now;

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mounted.current) return;
      setFix([pos.coords.longitude, pos.coords.latitude]);
    } catch (e) {
      console.warn("[recenter]", e);
    }
  }, []);

  return { locating, hasLocation, address, fix, recenter };
}
 