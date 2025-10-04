// client/app/components/Typo.tsx
import { Text, TextStyle } from "react-native";
import React from "react";
import { colors } from "@/constants/theme";
import { TypoProps } from "@/types";
import { verticalScale } from "@/utils/styling";

const Typo = ({
  size = 16,
  color = colors.text,
  fontWeight = "400",
  children,
  style,
  textProps = {},
  fontFamily = "Candal", // 👈 default global font
}: TypoProps & { fontFamily?: "Candal" | "InterLight" }) => {
  const texStyle: TextStyle = {
    fontSize: verticalScale(size),
    color,
    fontWeight,
    fontFamily, // 👈 applied here
  };

  return (
    <Text style={[texStyle, style]} {...textProps}>
      {children}
    </Text>
  );
};

export default Typo;
