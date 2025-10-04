// client/app/(auth)/login.tsx
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Input from "@/components/Input";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/authContext";

// secure-store helpers (existing)
import {
  savePasswordFor,
  getPasswordFor,
  removePasswordFor,
} from "@/utils/secureStore";

// Zod validation
import { z } from "zod";

// Accept either email OR phone number
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Please enter your email or phone.")
    .refine((v) => emailRegex.test(v) || phoneRegex.test(v), {
      message: "Enter a valid email or phone.",
    }),
  password: z.string().min(1, "Please enter your password."),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");

  const [isSigningIn, setIsSigningIn] = useState(false);

  // Controlled inputs
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Focus state for icon color
  const [focused, setFocused] = useState<"id" | "pwd" | null>(null);

  // Inline errors
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [loginError, setLoginError] = useState<string>("");

  const router = useRouter();
  const { signIn } = useAuth();

  /** Try to auto-fill password only AFTER user finishes entering the identifier */
  const tryAutoFillFor = async (id: string) => {
    const cleaned = id.trim();
    if (!cleaned) return;

    try {
      const saved = await getPasswordFor(cleaned);
      if (saved) {
        setPasswordInput(saved);
        passwordRef.current = saved;
        setRememberMe(true);
      } else {
        setRememberMe(false);
      }
    } catch {
      // ignore secure-store errors silently
    }
  };

  const handleIdentifierChange = (v: string) => {
    setEmailInput(v);
    emailRef.current = v;
    setFieldErrors((e) => ({ ...e, identifier: undefined }));
    setLoginError("");
  };

  const handleIdentifierEndEditing = () => {
    tryAutoFillFor(emailRef.current);
  };

  const handlePasswordChange = (v: string) => {
    setPasswordInput(v);
    passwordRef.current = v;
    setFieldErrors((e) => ({ ...e, password: undefined }));
    setLoginError("");
  };

  const handleSubmit = async () => {
    const payload: LoginForm = {
      identifier: emailRef.current.trim(),
      password: passwordRef.current.trim(),
    };

    const result = loginSchema.safeParse(payload);
    if (!result.success) {
      const errors: Partial<Record<keyof LoginForm, string>> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof LoginForm;
        errors[k] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSigningIn(true);
      setLoginError("");

      // Perform regular sign in
      await signIn(payload.identifier, payload.password);

      // Persist remembered password (existing behavior)
      if (rememberMe) {
        await savePasswordFor(payload.identifier, payload.password);
      } else {
        await removePasswordFor(payload.identifier);
      }

      router.replace("/patching");
    } catch (error: any) {
      setLoginError(error?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // icon colors (light grey when idle, green when focused)
  const idleColor = colors.neutral200;
  const activeColor = colors.green;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left", "bottom"]}>
      <StatusBar translucent={false} backgroundColor={colors.black} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.form}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: spacingY._5, marginBottom: spacingY._15 }}>
              <Typo size={35} style={{ textAlign: "center" }} fontFamily="Candal">
                <Text style={{ color: colors.green }}>patch</Text>
                <Text style={{ color: colors.white }}> up</Text>
              </Typo>
              <Typo
                color={colors.neutral100}
                style={{ textAlign: "center", marginTop: -spacingY._12 }}
                fontFamily="InterLight"
              >
                Welcome Back!
              </Typo>
            </View>

            <Text
              style={{
                fontWeight: "600",
                color: colors.neutral100,
                marginTop: 5,
              }}
            >
              Email or Phone
            </Text>
            <Input
              placeholder="Email or phone"
              value={emailInput}
              onChangeText={handleIdentifierChange}
              onEndEditing={handleIdentifierEndEditing}
              onFocus={() => setFocused("id")}
              onBlur={() => setFocused((prev) => (prev === "id" ? null : prev))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              icon={
                <Icons.EnvelopeIcon
                  size={verticalScale(26)}
                  color={focused === "id" ? activeColor : idleColor}
                />
              }
            />
            {!!fieldErrors.identifier && (
              <Typo color={colors.rose} size={16} style={{ marginTop: 4 }} fontFamily="InterLight">
                {fieldErrors.identifier}
              </Typo>
            )}

            <Text style={{ fontWeight: "600", color: colors.neutral100 }}>
              Password
            </Text>
            <Input
              placeholder="Password"
              secureTextEntry
              selectTextOnFocus
              contextMenuHidden={false}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              value={passwordInput}
              onChangeText={handlePasswordChange}
              onFocus={() => setFocused("pwd")}
              onBlur={() => setFocused((prev) => (prev === "pwd" ? null : prev))}
              icon={
                <Icons.LockIcon
                  size={verticalScale(26)}
                  color={focused === "pwd" ? activeColor : idleColor}
                />
              }
            />
            {!!fieldErrors.password && (
              <Typo color={colors.rose} size={16} style={{ marginTop: 4 }} fontFamily="InterLight">
                {fieldErrors.password}
              </Typo>
            )}

            {/* Remember + Forgot row */}
            <View style={styles.rowBetween}>
              <Pressable
                onPress={() => setRememberMe((r) => !r)}
                style={styles.rememberWrap}
                hitSlop={8}
              >
                <View
                  style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
                >
                  {rememberMe && (
                    <Icons.CheckIcon size={12} color={colors.black} weight="bold" />
                  )}
                </View>
                <Typo
                  style={{ marginLeft: 8 }}
                  color={colors.neutral200}
                  size={14}
                  fontFamily="InterLight"
                >
                  Remember Password
                </Typo>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(auth)/forgot-password")}
                hitSlop={8}
              >
                <Typo color={colors.neutral200} size={14} fontFamily="InterLight">
                  Forgot Password?
                </Typo>
              </Pressable>
            </View>

            {!!loginError && (
              <Typo color={colors.rose} size={13} style={{ marginTop: spacingY._10 }}>
                {loginError}
              </Typo>
            )}

            <View style={{ marginTop: spacingY._25, gap: spacingY._15 }}>
              <Button loading={isSigningIn} onPress={handleSubmit}>
                <Typo fontWeight="bold" color={colors.black} size={20}>
                  Sign in
                </Typo>
              </Button>

              <View style={styles.footer}>
                <Typo color={colors.neutral200} fontFamily="InterLight">
                  Don&apos;t have an account?
                </Typo>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Typo fontWeight="bold" color={colors.green}>
                    Sign up
                  </Typo>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.black,
  },
  kav: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._60,
  },
  form: {
    gap: spacingY._15,
    marginTop: spacingY._20,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacingY._10,
  },
  rememberWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderColor: colors.neutral200,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 5,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacingY._15,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral100,
  },
  orText: {
    marginHorizontal: spacingX._10,
    color: colors.neutral100,
  },
});
