// client/app/components/Input.tsx
import { StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";
import { InputProps } from "@/types";
import { colors, spacingX } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";

const Input = (props: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        props.containerStyle && props.containerStyle,
        isFocused && styles.primaryBorder,
      ]}
    >
      {props.icon && props.icon}
      <TextInput
        style={[styles.input, { fontFamily: "InterLight" }, props.inputStyle]}
        placeholderTextColor={colors.neutral400}
        ref={props.inputRef && props.inputRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: verticalScale(50),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E2022",
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
    backgroundColor: "#090A0A",
    gap: spacingX._5,
    borderRadius: 8,
  },
  primaryBorder: {
    borderColor: colors.green,
  },
  input: {
    flex: 1,
    color: "#ffff",
    fontSize: verticalScale(14),
    fontFamily: "InterLight", // 👈 apply InterLight to text & placeholder
  },
});
