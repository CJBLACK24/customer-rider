import { useState, useCallback } from "react";

type Step = {
  instruction: string;
  distance: number;
  duration: number;
};

export function useRoute() {
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const fetchRoute = useCallback(
    async (origin: [number, number], dest: [number, number]) => {
      try {
        const body = {
          coordinates: [origin, dest],
          instructions: true,
        };

        const res = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.EXPO_PUBLIC_ORS_KEY || "",
            },
            body: JSON.stringify(body),
          }
        );

        const json = await res.json();
        if (json.features?.length) {
          setRouteGeoJSON(json);
          const s: Step[] =
            json.features[0].properties.segments[0].steps.map((st: any) => ({
              instruction: st.instruction,
              distance: st.distance,
              duration: st.duration,
            }));
          setSteps(s);
        }
      } catch (err) {
        console.warn("[useRoute] fetch error", err);
      }
    },
    []
  );

  return { routeGeoJSON, steps, fetchRoute };
}
