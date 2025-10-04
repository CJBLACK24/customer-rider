// frontend/app/(auth)/signup-success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/constants/theme";

const CHECK_SIZE = 150;                       // bigger white check
const CHECK_WEIGHT: Icons.IconWeight = "duotone"; // "thin" | "light" | "regular" | "bold" | "fill" | "duotone"

export default function SignUpSuccess() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(main)/home");
    }, 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.screen}>
      {/* brand */}
      <Typo size={28} fontWeight="900" style={{ textAlign: "center", marginBottom: spacingY._20 }}>
        <Text style={{ color: "#6EFF87", letterSpacing: 1 }}>patch</Text>
        <Text style={{ color: "#FFFFFF" }}> up</Text>
      </Typo>

      {/* green circle with larger white check */}
      <View style={styles.circle}>
        <Icons.CheckIcon size={CHECK_SIZE} color="#FFFFFF" weight={CHECK_WEIGHT} />
      </View>

      {/* message */}
      <Typo size={16} fontWeight="300" style={{ marginTop: spacingY._20 }}>
        <Text style={{ color: colors.green }}>Account</Text>
        <Text style={{ color: "#FFFFFF" }}> has been created successfully</Text>
      </Typo>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 180,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._10,
  },
});
