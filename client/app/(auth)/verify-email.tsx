/// frontend/app/auth/verify-email.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Keyboard,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Button from "@/components/Button";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";

export default function VerifyEmail() {
  const { code: initialCode } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const DIGIT_COUNT = 6;

  // Create refs for each input box
  const inputsRef = useRef<Array<TextInput | null>>(
    Array(DIGIT_COUNT).fill(null)
  );

  // State for each digit
  const [digits, setDigits] = useState<string[]>(
    initialCode && initialCode.length === DIGIT_COUNT
      ? initialCode.split("")
      : Array(DIGIT_COUNT).fill("")
  );

  // Modal visibility for PIN popup
  const [showModal, setShowModal] = useState<boolean>(false);

  // On mount: if we have a valid PIN, show modal, prefill, focus, auto-hide
  useEffect(() => {
    if (initialCode && initialCode.length === DIGIT_COUNT) {
      setShowModal(true);
      // auto-dismiss after 10 seconds
      const timer = setTimeout(() => setShowModal(false), 10_000);
      // focus first input
      inputsRef.current[0]?.focus();
      return () => clearTimeout(timer);
    }
  }, [initialCode]);

  // Handle digit change
  const handleChange = (text: string, idx: number) => {
    if (/^\d$/.test(text)) {
      const newD = [...digits];
      newD[idx] = text;
      setDigits(newD);
      if (idx < DIGIT_COUNT - 1) {
        inputsRef.current[idx + 1]?.focus();
      } else {
        Keyboard.dismiss();
      }
    } else if (text === "") {
      const newD = [...digits];
      newD[idx] = "";
      setDigits(newD);
    }
  };

  const code = digits.join("");

  // On verify: navigate to reset-password screen with code as token
  const handleVerify = () => {
    if (digits.some((d) => d === "")) {
      Alert.alert("Error", `Please enter all ${DIGIT_COUNT} digits`);
      return;
    }
    router.push({
      pathname: "/(auth)/reset-password/[token]",
      params: { token: code },
    });
  };

  return (
    <ScreenWrapper>
      <Typo
        size={28}
        fontWeight="600"
        style={styles.title}
        color={colors.green}
      >
        Enter Verification Code
      </Typo>

      <View style={styles.otpContainer}>
        {digits.map((digit: string, idx: number) => (
          <TextInput
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(t) => handleChange(t, idx)}
            value={digit}
            returnKeyType={idx < DIGIT_COUNT - 1 ? "next" : "done"}
            onSubmitEditing={() => {
              if (idx < DIGIT_COUNT - 1) {
                inputsRef.current[idx + 1]?.focus();
              } else {
                Keyboard.dismiss();
              }
            }}
          />
        ))}
      </View>

      <Typo style={styles.entered}>Here is your PIN: {code} </Typo>

      <Button style={styles.button} onPress={handleVerify}>
        <Typo size={16} fontWeight="bold" color={colors.black}>
          Verify Email Now
        </Typo>
      </Button>
    </ScreenWrapper>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    marginBottom: spacingY._20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._10,
    marginVertical: spacingY._20,
  },
  otpInput: {
    width: spacingY._50,
    height: spacingY._50,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: radius._6,
    textAlign: "center",
    fontSize: spacingY._20,
    backgroundColor: colors.white,
  },
  entered: {
    textAlign: "center",
    marginBottom: spacingY._20,
    color: colors.white,
  },
  button: {
    alignSelf: "center",
    width: width * 0.8,
    borderRadius: radius._12,
    paddingVertical: spacingY._12,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: colors.white,
    padding: spacingY._20,
    borderRadius: radius._12,
    alignItems: "center",
    width: "80%",
  },
  pinContainer: {
    flexDirection: "row",
    gap: spacingX._10,
    marginBottom: spacingY._20,
  },
  pinDigitBox: {
    width: spacingY._20,
    height: spacingY._20,
    backgroundColor: colors.green,
    borderRadius: radius._6,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    marginTop: spacingY._10,
  },
  pinBox: {
    width: spacingY._50,
    height: spacingY._50,
    borderRadius: radius._6,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
});
