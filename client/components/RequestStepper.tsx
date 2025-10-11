// components/RequestStepper.tsx
import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { spacingX } from "@/constants/theme";

export type Step = 0 | 1 | 2 | 3;

type Props = {
  step: Step;
  setStep: (s: Step) => void;
  vehicleModel: string;
  setVehicleModel: (v: string) => void;
  plateNumber: string;
  setPlateNumber: (v: string) => void;
  otherInfo: string;
  setOtherInfo: (v: string) => void;
  onRecenter: () => void;
  bottomInset?: number;
  onRequest?: () => void;
};

const GREEN = "#C0FFCB";
const GREEN_BTN = "#C2F5CF";

const RequestStepper: React.FC<Props> = ({
  step,
  setStep,
  vehicleModel,
  setVehicleModel,
  plateNumber,
  setPlateNumber,
  otherInfo,
  setOtherInfo,
  onRecenter,
  bottomInset = 110,
  onRequest,
}) => {
  const title =
    step === 0
      ? "Vehicle model"
      : step === 1
      ? "Vehicle plate number"
      : step === 2
      ? "Other vehicle information"
      : "Review";

  const canPrev = step > 0;
  const canNext =
    (step === 0 && !!vehicleModel.trim()) ||
    (step === 1 && !!plateNumber.trim()) ||
    (step === 2 && !!otherInfo.trim());

  return (
    <View style={[styles.sheet, { marginBottom: bottomInset }]}>
      {/* Green card matches Figma box */}
      <View style={styles.card}>
        <Typo size={22} color="#0D0D0D" fontFamily="InterLight" style={{ marginBottom: 10 }}>
          {title}
        </Typo>

        {step < 3 ? (
          <>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder={
                  step === 0
                    ? "e.g., Honda XRM125"
                    : step === 1
                    ? "e.g., ABC 1234"
                    : "Add color or other details"
                }
                placeholderTextColor="#8F9BA6"
                style={styles.textInput}
                value={step === 0 ? vehicleModel : step === 1 ? plateNumber : otherInfo}
                onChangeText={(v) =>
                  step === 0 ? setVehicleModel(v) : step === 1 ? setPlateNumber(v) : setOtherInfo(v)
                }
              />
              <Icons.CaretDown size={20} color={"#222"} />
            </View>

            <TouchableOpacity onPress={onRecenter} activeOpacity={0.9} style={styles.sheetTargetBtn}>
              <Icons.CrosshairSimple size={22} weight="bold" color={"#000"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (canNext ? setStep((step + 1) as Step) : undefined)}
              disabled={!canNext}
              style={[styles.nextBtn, !canNext && { opacity: 0.45 }]}
              activeOpacity={0.9}
            >
              <Typo size={16} color={"#000"} fontFamily="InterLight">
                Next
              </Typo>
            </TouchableOpacity>

            <View style={styles.prevWrap}>
              <TouchableOpacity
                onPress={() => canPrev && setStep((step - 1) as Step)}
                disabled={!canPrev}
                style={[styles.prevBtn, !canPrev && { opacity: 0.45 }]}
                activeOpacity={0.9}
              >
                <Icons.CaretLeft size={18} color={"#000"} />
                <Typo size={16} color={"#000"} fontFamily="InterLight" style={{ marginLeft: 6 }}>
                  Prev
                </Typo>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.reviewItem}>
              <Typo size={16} color={"#0D0D0D"} fontFamily="InterLight">
                <Typo size={16} color={"#0D0D0D"} fontWeight="800">
                  Vehicle Type:{" "}
                </Typo>
                {vehicleModel || "-"}
              </Typo>
            </View>
            <View style={styles.reviewItem}>
              <Typo size={16} color={"#0D0D0D"} fontFamily="InterLight">
                <Typo size={16} color={"#0D0D0D"} fontWeight="800">
                  Plate Number:{" "}
                </Typo>
                {plateNumber || "-"}
              </Typo>
            </View>
            <View style={styles.reviewItem}>
              <Typo size={16} color={"#0D0D0D"} fontFamily="InterLight">
                <Typo size={16} color={"#0D0D0D"} fontWeight="800">
                  Other infos:{" "}
                </Typo>
                {otherInfo || "-"}
              </Typo>
            </View>

            <TouchableOpacity style={styles.requestBtn} activeOpacity={0.9} onPress={onRequest}>
              <Typo size={18} color={"#000"} fontWeight="800">
                Request assistance
              </Typo>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default RequestStepper;

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: spacingX._20,
    right: spacingX._20,
    bottom: 0,
    backgroundColor: "transparent", // transparent sheet per Figma ask
    zIndex: 18,
  },
  card: {
    backgroundColor: GREEN,
    borderRadius: 26,
    padding: 16,
    paddingBottom: 18,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FFF6",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    color: "#0D0D0D",
    fontSize: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: "InterLight",
  },
  sheetTargetBtn: {
    position: "absolute",
    right: 22,
    top: 78,
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  nextBtn: {
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: GREEN_BTN,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 18,
  },
  prevWrap: { marginTop: 10, flexDirection: "row", justifyContent: "flex-start" },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN_BTN,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reviewItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  requestBtn: {
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: GREEN,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
