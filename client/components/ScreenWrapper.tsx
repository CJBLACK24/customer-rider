// client/components/ScreenWrapper.tsx
import React from "react";
import { Dimensions, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenWrapperProps } from "@/types";
import { colors } from "@/constants/theme";

/**
 * Backward-compatible ScreenWrapper
 * - Keeps your original paddingTop/paddingBottom logic EXACTLY the same
 * - Replaces ScreenWrapperForms (green) via either:
 *     a) showPattern={true}  (back-compat with your register.tsx), or
 *     b) variant="forms"
 * - Default variant is the dark app background
 */

type Variant = "default" | "forms";

type Props = ScreenWrapperProps & {
  variant?: Variant;
  /** kept for back-compat with previous ScreenWrapperForms usage */
  showPattern?: boolean;
};

const { height } = Dimensions.get("window");

const ScreenWrapper = ({
  style,
  children,
  isModal = false,
  variant,
  showPattern, // back-compat flag from your register.tsx
}: Props) => {
  // ---- KEEP YOUR ORIGINAL LOGIC (unchanged) ----
  let paddingTop = Platform.OS === "ios" ? height * 0.06 : 40;
  let paddingBottom = 0;

  if (isModal) {
    paddingTop = Platform.OS === "ios" ? height * 0.02 : 45;
    paddingBottom = height * 0.02;
  }
  // ----------------------------------------------

  // Choose background:
  // - If variant is passed, use it;
  // - Else, if showPattern is true (your old prop), treat as "forms" (green);
  // - Otherwise, default dark.
  const effectiveVariant: Variant = variant ?? (showPattern ? "forms" : "default");
  const bg = effectiveVariant === "forms" ? colors.green : "#0D0D0D";

  // Pick status bar icon color that contrasts with bg
  const barStyle: "light" | "dark" = effectiveVariant === "forms" ? "dark" : "light";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Edge-to-edge safe: only control icon color, not backgroundColor */}
      <StatusBar style={barStyle} translucent />

      {/* Paint the status bar/top inset with the wrapper bg to avoid black gaps */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: bg }} />

      {/* Your content area with the EXACT same paddings as before */}
      <View style={[{ flex: 1, paddingTop, paddingBottom }, style]}>
        {children}
      </View>
    </View>
  );
};

export default ScreenWrapper;
