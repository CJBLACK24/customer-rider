import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { forgotPassword } from "@/services/authService";
import { colors, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setMessage("");
    if (!email.trim()) {
      setMessage("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { pin, msg } = await forgotPassword(email.trim());
      Alert.alert("Don't share your PIN ", msg);
      router.push({
        pathname: "/(auth)/verify-email",
        params: { code: pin },
      });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Typo
        size={28}
        fontWeight="600"
        style={styles.title}
        color={colors.green}
      >
        Forgot Password
      </Typo>

      <View style={styles.form}>
        <Input
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          icon={
            <Icons.EnvelopeSimpleIcon
              size={22}
              color={colors.neutral600}
              weight="regular"
            />
          }
        />

        <Button loading={loading} onPress={handleSend}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icons.TelegramLogoIcon size={20} color={colors.black} weight="fill" />
            <Typo size={16} fontWeight="bold" color={colors.black}>
              Send reset PIN
            </Typo>
          </View>
        </Button>

        {message ? <Typo style={styles.message}>{message}</Typo> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.black,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._20,
  },
  title: {
    textAlign: "center",
    marginBottom: spacingY._20,
  },
  form: {
    paddingHorizontal: spacingX._20,
    gap: spacingY._15,
  },
  message: {
    marginTop: spacingY._15,
    textAlign: "center",
    color: colors.white,
  },
});
