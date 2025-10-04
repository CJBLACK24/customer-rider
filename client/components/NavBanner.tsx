// client/components/NavBanner.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

type Props = {
  active: boolean;
  text: string;
  onStart: () => void;
  onStop: () => void;
};

const NavBanner: React.FC<Props> = ({ active, text, onStart, onStop }) => {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Typo size={16} color={colors.white} fontFamily="InterLight">
          {text || (active ? "Navigating…" : "Ready to navigate")}
        </Typo>
      </View>

      {active ? (
        <TouchableOpacity onPress={onStop} style={[styles.btn, { backgroundColor: "#FFCDD2" }]}>
          <Icons.HandPalm size={18} weight="bold" color="#111" />
          <Typo size={14} color="#111" fontFamily="InterLight" style={{ marginLeft: 6 }}>
            Stop
          </Typo>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onStart} style={[styles.btn, { backgroundColor: "#C0FFCB" }]}>
          <Icons.NavigationArrow size={18} weight="bold" color="#111" />
          <Typo size={14} color="#111" fontFamily="InterLight" style={{ marginLeft: 6 }}>
            Start
          </Typo>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NavBanner;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16, right: 16, bottom: 16 + 110, // above your RequestStepper (SHEET_MARGIN_BOTTOM)
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
