import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import Typo from "@/components/Typo";
import { colors, spacingX } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

type Step = 0 | 1 | 2 | 3;

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
  steps?: { instruction: string; distance: number; duration: number }[];
};

const SHEET_BG = "#C0FFCB";

const RequestStepper: React.FC<Props> = ({
  step, setStep,
  vehicleModel, setVehicleModel,
  plateNumber, setPlateNumber,
  otherInfo, setOtherInfo,
  onRecenter,
  bottomInset = 110,
  steps = [],
}) => {
  const title =
    step === 0 ? "Vehicle model"
    : step === 1 ? "Vehicle plate number"
    : step === 2 ? "Other vehicle information"
    : "Review";

  const canPrev = step > 0;
  const canNext =
    (step === 0 && !!vehicleModel.trim()) ||
    (step === 1 && !!plateNumber.trim()) ||
    (step === 2 && !!otherInfo.trim());

  return (
    <View style={[styles.sheet, { marginBottom: bottomInset }]}>
      <View style={styles.handleBar} />
      <Typo size={22} color={colors.black} fontFamily="InterLight" style={{ marginBottom: 10 }}>
        {title}
      </Typo>

      {step < 3 ? (
        <>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder={
                step === 0 ? "e.g., Suzuki Raider" :
                step === 1 ? "e.g., ABC 1234" :
                "Add color or other details"
              }
              placeholderTextColor="#8F9BA6"
              style={styles.textInput}
              value={step === 0 ? vehicleModel : step === 1 ? plateNumber : otherInfo}
              onChangeText={(v) =>
                step === 0 ? setVehicleModel(v) : step === 1 ? setPlateNumber(v) : setOtherInfo(v)
              }
            />
            <Icons.CaretDown size={20} color={colors.white} />
          </View>

          <TouchableOpacity onPress={onRecenter} activeOpacity={0.9} style={styles.sheetTargetBtn}>
            <Icons.CrosshairSimple size={22} weight="bold" color={colors.black} />
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => canPrev && setStep((step - 1) as Step)}
              disabled={!canPrev}
              style={[styles.pillBtn, !canPrev && styles.pillDisabled]}
            >
              <Icons.CaretLeft size={20} color={colors.black} />
              <Typo size={18} color={colors.black} fontFamily="InterLight" style={{ marginLeft: 6 }}>
                Prev
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => canNext && setStep((step + 1) as Step)}
              disabled={!canNext}
              style={[styles.pillBtn, !canNext && styles.pillDisabled]}
            >
              <Typo size={18} color={colors.black} fontFamily="InterLight" style={{ marginRight: 6 }}>
                Next
              </Typo>
              <Icons.CaretRight size={20} color={colors.black} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Typo size={18} color={colors.black} fontWeight="800" fontFamily="InterLight" style={{ marginBottom: 8 }}>
            Review
          </Typo>

          <View style={styles.reviewItem}>
            <Typo size={16} color={colors.black} fontFamily="InterLight">
              <Typo size={16} color={colors.black} fontWeight="800">Vehicle Type: </Typo>
              {vehicleModel || "-"}
            </Typo>
          </View>

          <View style={styles.reviewItem}>
            <Typo size={16} color={colors.black} fontFamily="InterLight">
              <Typo size={16} color={colors.black} fontWeight="800">Plate Number: </Typo>
              {plateNumber || "-"}
            </Typo>
          </View>

          <View style={styles.reviewItem}>
            <Typo size={16} color={colors.black} fontFamily="InterLight">
              <Typo size={16} color={colors.black} fontWeight="800">Other infos: </Typo>
              {otherInfo || "-"}
            </Typo>
          </View>

          {steps.length > 0 && (
            <View style={[styles.reviewItem, { maxHeight: 160 }]}>
              <Typo size={16} color={colors.black} fontWeight="800" style={{ marginBottom: 6 }}>
                Route Steps:
              </Typo>
              <ScrollView>
                {steps.map((s, i) => (
                  <Typo key={i} size={14} color={colors.black}>
                    {i + 1}. {s.instruction}
                  </Typo>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.requestBtn} activeOpacity={0.9}>
            <Typo size={18} color={colors.black} fontWeight="800">
              Request assistance
            </Typo>
          </TouchableOpacity>
        </>
      )}
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
    backgroundColor: SHEET_BG,
    borderRadius: 26,
    padding: 16,
    paddingBottom: 18,
    zIndex: 18,
  },
  handleBar: {
    alignSelf: "center",
    width: 88, height: 6, borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1, color: "#FFFFFF", fontSize: 16, paddingVertical: 8, marginRight: 8, fontFamily: "InterLight",
  },
  sheetTargetBtn: {
    position: "absolute", right: 16, top: 78,
    height: 46, width: 46, borderRadius: 23,
    backgroundColor: "#C0FFCB",
    alignItems: "center", justifyContent: "center",
    elevation: 6,
  },
  row: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", gap: 14 },
  pillBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#C2F5CF", borderRadius: 18, paddingVertical: 12 },
  pillDisabled: { opacity: 0.45 },
  reviewItem: { backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginTop: 10 },
  requestBtn: { alignSelf: "center", marginTop: 16, backgroundColor: "#C0FFCB", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
});
