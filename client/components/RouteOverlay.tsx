import React from "react";
import { ShapeSource, LineLayer } from "@maplibre/maplibre-react-native";

type Props = {
  geojson: any;
};

const RouteOverlay: React.FC<Props> = ({ geojson }) => {
  if (!geojson) return null;

  return (
    <ShapeSource id="route" shape={geojson}>
      <LineLayer
        id="route-line"
        style={{
          lineColor: "#007AFF",
          lineWidth: 5,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </ShapeSource>
  );
};

export default RouteOverlay;
