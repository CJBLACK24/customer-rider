import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { resetPassword } from "@/services/authService";
import { colors, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setMessage("✅ Your Password reset successfully!");
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Typo
        size={28}
        fontWeight="600"
        style={styles.title}
        color={colors.green}
      >
        Reset Password
      </Typo>

      <View style={styles.form}>
        <Input
          placeholder="New Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          icon={
            <Icons.LockIcon
              size={24}
              color={colors.neutral600}
              weight="regular"
            />
          }
        />
        <Input
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirm}
          icon={
            <Icons.LockKeyIcon
              size={24}
              color={colors.neutral600}
              weight="regular"
            />
          }
        />

        <Button loading={isLoading} onPress={handleSubmit} style={styles.button}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isLoading ? (
              <Icons.HourglassSimpleIcon size={18} color={colors.black} />
            ) : (
              <Icons.CheckCircleIcon size={18} color={colors.black} />
            )}
            <Typo size={16} fontWeight="bold" color={colors.black}>
              Set New Password
            </Typo>
          </View>
        </Button>

        {message ? <Typo style={styles.message}>{message}</Typo> : null}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    marginBottom: spacingY._20,
  },
  form: {
    paddingHorizontal: spacingX._20,
    gap: spacingY._15,
  },
  button: {
    marginTop: spacingY._15,
    alignItems: "center",
  },
  message: {
    marginTop: spacingY._15,
    textAlign: "center",
    color: colors.white,
  },
});
