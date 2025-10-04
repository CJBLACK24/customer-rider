import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

// Liquid Glass (SDK 54+)
let GlassView: any, isLiquidGlassAvailable: (() => boolean) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require("expo-glass-effect");
  GlassView = m.GlassView;
  isLiquidGlassAvailable = m.isLiquidGlassAvailable;
} catch {}

type Props = {
  username?: string;
  address: string;
  locating: boolean;
  onCopy: () => void;
  titleStyle?: "possessive" | "colon";
};

const LocationHeader: React.FC<Props> = ({
  username,
  address,
  locating,
  onCopy,
  titleStyle = "possessive",
}) => {
  const insets = useSafeAreaInsets();

  const title =
    titleStyle === "colon"
      ? `${username?.trim() || "User"}, current location:`
      : `${(username?.trim() || "User")}'s current location`;

  const canLiquid =
    Platform.OS === "ios" && GlassView && (isLiquidGlassAvailable?.() ?? true);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacingY._10 }]}>
      {/* Glass strip background (fallback to blur) */}
      {canLiquid ? (
        <GlassView
          pointerEvents="none"
          glassEffectStyle="prominent"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView
          pointerEvents="none"
          tint="dark"
          intensity={24}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Content */}
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Typo
          color={colors.white}
          size={18}
          fontFamily="InterLight"
          textProps={{ numberOfLines: 1 }}
          style={{ marginBottom: 4 }}
        >
          {title}
        </Typo>

        <Typo
          color={colors.white}
          size={15}
          fontFamily="InterLight"
          textProps={{ numberOfLines: 2 }}
        >
          {locating ? "Locating…" : address || "Location found"}
        </Typo>
      </View>

      <TouchableOpacity
        onPress={onCopy}
        style={styles.copyBtn}
        hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
        accessibilityLabel="Copy current address"
        accessibilityRole="button"
      >
        <Icons.CopySimple color={colors.white} weight="bold" size={verticalScale(20)} />
      </TouchableOpacity>
    </View>
  );
};

export default LocationHeader;

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
    // transparent so the glass shows through
    backgroundColor: "transparent",
    zIndex: 20,
  },
  copyBtn: {
    padding: spacingY._10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.full,
  },
});
