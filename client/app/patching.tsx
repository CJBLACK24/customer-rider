// app/patching.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
} from "react-native-reanimated";

const Dot = ({ delay = 0 }: { delay?: number }) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [delay, y]);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return <Animated.Text style={[styles.dot, aStyle]}>.</Animated.Text>;
};

export default function Patching() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(main)/(tabs)/home");
    }, 3000); // show for 3 seconds
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={false}
        backgroundColor={colors.black}
        barStyle="light-content"
      />
      <Typo size={28} fontWeight="900" style={styles.line}>
        <Typo size={28} fontWeight="900" color={colors.green}>
          patching
        </Typo>{" "}
        <Typo size={28} fontWeight="900" color={colors.white}>
          up
        </Typo>
        <Dot delay={0} />
        <Dot delay={120} />
        <Dot delay={240} />
      </Typo>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  line: { 
    textAlign: "center",
    letterSpacing: 0.5 
    },
  dot: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32 
    },
});
