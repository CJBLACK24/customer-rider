import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void; // “Return to Login”
};

const LogoutSuccessModal = ({ visible, onClose }: Props) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icons.CheckCircleIcon size={42} color={colors.black} weight="fill" />
          </View>

          <View style={{ marginTop: 12 }}>
            <Typo size={18} fontWeight="800" style={{ textAlign: "center" }}>
              You have successfully{"\n"}Logged out
            </Typo>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnPrimary]}
            onPress={onClose}
          >
            <Typo fontWeight="800" color={colors.black}>
              Return to Login
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutSuccessModal;

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
    marginTop: 16,
  },
  btnPrimary: {
    backgroundColor: "#6EFF87",
  },
});
