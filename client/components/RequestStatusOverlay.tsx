import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

type Props = {
  visible: boolean;
  kind: "requesting" | "accepted";
  caption?: string;
  onClose?: () => void;
};

export default function RequestStatusOverlay({ visible, kind, caption, onClose }: Props) {
  const isAccepted = kind === "accepted";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.centerWrap} pointerEvents="none">
          <Typo size={28} fontWeight="900">
            <Typo size={28} fontWeight="900" color={colors.green}>patch</Typo>{" "}
            <Typo size={28} fontWeight="900" color={colors.white}>up</Typo>
          </Typo>

          <View style={{ height: spacingY._20 }} />

          {isAccepted ? (
            <>
              <View style={styles.bigBadge}>
                <Icons.Check size={38} color={colors.black} weight="bold" />
              </View>
              <Typo size={20} color={colors.white} fontWeight="800" style={{ marginTop: spacingY._10 }}>
                Assistance accepted
              </Typo>
              {!!caption && (
                <Typo
                  size={12}
                  color={colors.white}
                  fontFamily="InterLight"
                  style={{ marginTop: spacingY._10, opacity: 0.8, textAlign: "center" }}
                >
                  {caption}
                </Typo>
              )}
            </>
          ) : (
            <Typo size={20} color={colors.white} fontWeight="800">
              <Typo size={20} color={colors.green} fontWeight="800">Requesting</Typo>{" "}
              assistance…
            </Typo>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  centerWrap: { alignItems: "center", justifyContent: "center" },
  bigBadge: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.green, alignItems: "center", justifyContent: "center",
  },
});
