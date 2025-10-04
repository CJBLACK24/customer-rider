// client/components/GlassBackdrop.tsx
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

// iOS Liquid Glass (SDK 54+)
let GlassView: any, isLiquidGlassAvailable: (() => boolean) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require("expo-glass-effect");
  GlassView = m.GlassView;
  isLiquidGlassAvailable = m.isLiquidGlassAvailable;
} catch {}

type Props = {
  opacity?: number;           // overlay alpha
  effect?: "regular" | "clear" | "prominent"; // pick your liquid style
  blurIntensity?: number;     // android/older iOS fallback strength
  blurTint?: "light" | "dark" | "default";
};

const GlassBackdrop: React.FC<Props> = ({
  opacity = 0.5,
  effect = "regular",
  blurIntensity = 20,
  blurTint = "dark",
}) => {
  const canLiquid =
    Platform.OS === "ios" && GlassView && (isLiquidGlassAvailable?.() ?? true);

  if (canLiquid) {
    return (
      <GlassView
        pointerEvents="none"
        glassEffectStyle={effect}
        style={[styles.fill, { opacity }]}
      />
    );
  }

  // Fallback (Android / older iOS)
  return (
    <BlurView
      pointerEvents="none"
      tint={blurTint}
      intensity={blurIntensity}
      style={[styles.fill, { opacity }]}
    />
  );
};

export default GlassBackdrop;

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});
