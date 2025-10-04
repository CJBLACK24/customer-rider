import React, { useMemo, useRef } from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onVideoCall: () => void;
};

export default function ConversationActionsSheet({ visible, onClose, onDelete, onVideoCall }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.row} onPress={onVideoCall}>
            <Icons.Phone size={22} color={colors.white} weight="fill" />
            <Typo size={16} color={colors.white} style={{ marginLeft: spacingX._10 }}>
              Video call
            </Typo>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={onDelete}>
            <Icons.Trash size={22} color="#ff4d4f" weight="fill" />
            <Typo size={16} color="#ff4d4f" style={{ marginLeft: spacingX._10 }}>
              Delete conversation
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.black,
    padding: spacingX._15,
    paddingBottom: spacingY._20 + 16, // cover nav bar area
    borderTopLeftRadius: radius._25,
    borderTopRightRadius: radius._25,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
  },
  divider: {
    height: 1,
    backgroundColor: "#2B2D31",
    marginVertical: spacingY._6,
  },
});
