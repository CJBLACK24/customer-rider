// client/app/(auth)/welcome.tsx
import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { useRouter } from "expo-router";
import { colors, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Animated, { FadeOutUp } from "react-native-reanimated";

const Welcome = () => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Lift the brand a bit above center, adapting to device height
  const brandLift =
    verticalScale(40) +
    Math.min(verticalScale(32), Math.max(0, (height - 700) * 0.06));

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 3000); // 3s delay
    return () => clearTimeout(t);
  }, [router]);

  return (
    <ScreenWrapper variant="default">
      <View style={styles.container}>
        {/* Brand – centered then lifted slightly */}
        {/* ✅ Layout animation lives on OUTER Animated.View */}
        <Animated.View exiting={FadeOutUp.duration(800)} style={styles.brandWrap}>
          {/* ✅ Transform lives on INNER plain View (no layout anim here) */}
          <View style={{ transform: [{ translateY: -brandLift }] }}>
            <Typo
              size={scale(43)}
              fontWeight="100"
              style={{ textAlign: "center", fontFamily: "Candal" }}
            >
              <Text style={{ color: colors.green, fontFamily: "Candal" }}>
                patch
              </Text>
              <Text style={{ color: colors.white, fontFamily: "Candal" }}>
                {" "}up
              </Text>
            </Typo>
          </View>
        </Animated.View>

        {/* Tagline – pinned to safe bottom (no transform, safe as-is) */}
        <Animated.View
          exiting={FadeOutUp.duration(800)}
          style={[styles.taglineWrap, { paddingBottom: insets.bottom + spacingY._15 }]}
        >
          <Typo
            fontFamily="InterLight"
            color={colors.neutral100}
            size={scale(18)}
            style={{ textAlign: "center" }}
          >
            Vulcanize Anytime, Anywhere
          </Typo>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
  },
  brandWrap: {
    alignItems: "center",
  },
  taglineWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 50, // extra spacing; safe-area added dynamically
    alignItems: "center",
  },
});
