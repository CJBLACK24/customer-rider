import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/constants/theme";

type Props = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmLogoutModal = ({ visible, loading, onCancel, onConfirm }: Props) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icons.SignOutIcon size={42} color={colors.black} weight="bold" />
          </View>

          <View style={{ marginTop: spacingY._10 }}>
            <Typo size={18} fontWeight="800" style={{ textAlign: "center" }}>
              You’re about to Logout…{"\n"}Are you sure?
            </Typo>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnSecondary]}
            onPress={onCancel}
            disabled={loading}
          >
            <Typo fontWeight="800">No, Don’t Log Me Out</Typo>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnPrimary]}
            onPress={onConfirm}
            disabled={loading}
          >
            <Typo fontWeight="800" color={colors.black}>
              {loading ? "Logging out…" : "Yes, Log Me Out"}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmLogoutModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#C0FFCB",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  iconCircle: {
    height: 64,
    width: 64,
    borderRadius: 64,
    backgroundColor: "#A5F4B4",
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    width: "88%",
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnPrimary: {
    backgroundColor: "#6EFF87",
  },
  btnSecondary: {
    backgroundColor: "#EAFBEF",
    borderWidth: 1,
    borderColor: "#6EFF87",
  },
});
