// client/app/components/BackgroundUIProfile.tsx
import React, { useState } from "react";
import { Dimensions, View, useWindowDimensions } from "react-native";
import { Svg, Path } from "react-native-svg";
import { colors } from "@/constants/theme";

export type BGProfileProps = {
  /** Height of the green area at the sides (px) */
  headerHeight?: number;
  /** How far the V dips at the center (px) */
  pointDepth?: number;
  /** Fill color */
  color?: string;
  /** Circle size (px or relative) */
  circleDiameter?: number;
  /** Vertical nudge from the V apex (px, can be negative) */
  circleOffsetY?: number;
  /** Optional zIndex for layering */
  zIndex?: number;
  /** Enable responsive scaling */
  responsive?: boolean;
};

const BackgroundUIProfile = ({
  headerHeight = 180,
  pointDepth = 35,
  color = (colors as any).green ?? "#45F37D",
  circleDiameter,
  circleOffsetY = -96,
  zIndex = 0,
  responsive = true, // New prop to enable/disable responsiveness
}: BGProfileProps) => {
  const windowWidth = Dimensions.get("window").width;
  const { height: screenHeight } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Responsive scaling factors
  const getResponsiveValue = (value: number, baseScreenHeight = 800) => {
    if (!responsive) return value;
    return (value / baseScreenHeight) * screenHeight;
  };

  // Apply responsive scaling if enabled
  const responsiveHeaderHeight = getResponsiveValue(headerHeight);
  const responsivePointDepth = getResponsiveValue(pointDepth);
  const responsiveCircleOffsetY = getResponsiveValue(circleOffsetY);

  const w = containerWidth ?? windowWidth; // use measured width when available
  const h = responsiveHeaderHeight;
  const p = Math.max(0, responsivePointDepth);
  const totalHeight = h + p;

  // Size circle responsively from the container, not the window
  // If circleDiameter is provided, apply responsive scaling to it
  const d = circleDiameter
    ? responsive
      ? getResponsiveValue(circleDiameter)
      : circleDiameter
    : w * 0.45;

  // Shallow-V header path
  const dPath = `M0 0 H${w} V${h} L${w / 2} ${h + p} L0 ${h} Z`;

  // Always centered horizontally; vertical position relative to the V apex
  const left = (w - d) / 2;
  const top = h + p + responsiveCircleOffsetY;

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: totalHeight,
        pointerEvents: "none",
        zIndex,
      }}
    >
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${w} ${totalHeight}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Path d={dPath} fill={color} />
      </Svg>

      <View
        style={{
          position: "absolute",
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: color,
          left,
          top,
        }}
      />
    </View>
  );
};

export default BackgroundUIProfile;
