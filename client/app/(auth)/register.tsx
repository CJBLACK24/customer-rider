import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Input from "@/components/Input";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/authContext";
import * as SecureStore from "expo-secure-store";

// validation
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// utils
import { toFlagEmoji, formatPhDisplay, toE164FromDisplay } from "@/utils/phone";
import PasswordPopover from "@/components/PasswordPopover";

/* ----------------------------- Form validation ---------------------------- */
const schema = z
  .object({
    name: z.string().trim().min(1, "Username is required"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .refine((v) => v.toLowerCase().endsWith("@gmail.com"), "Gmail address only"),
    phone: z
      .string()
      .trim()
      .refine((v) => {
        const digits = v.replace(/\D/g, "");
        return /^(09\d{9}|639\d{9})$/.test(digits);
      }, "Enter a valid PH mobile number"),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;
type Field = "name" | "phone" | "email" | "password" | "confirmPassword";
/* -------------------------------------------------------------------------- */

const Register = () => {
  const nameRef = useRef("");
  const phoneRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  // show only the active field's error while typing
  const [activeField, setActiveField] = useState<Field | null>(null);

  const [countryCode] = useState<CountryCode>("PH");
  const [callingCode] = useState<string>("63");

  const router = useRouter();
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const getError = (k: Field) =>
    (errors as any)?.[k]?.message as string | undefined;

  const generateStrongPassword = () => {
    const len = Math.floor(Math.random() * 5) + 12;
    const upp = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const low = "abcdefghijkmnopqrstuvwxyz";
    const num = "23456789";
    const all = upp + low + num;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let out = pick(upp) + pick(low) + pick(num);
    for (let i = out.length; i < len; i++) out += pick(all);
    out = out
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setValue("password", out, { shouldValidate: true });
    setPassword(out);
    passwordRef.current = out;
  };

  const onSubmit = async (data: FormValues) => {
    setApiError(null);

    nameRef.current = data.name.trim();
    emailRef.current = data.email.trim();
    passwordRef.current = data.password;
    confirmPasswordRef.current = data.confirmPassword;

    const e164 = toE164FromDisplay(data.phone);
    if (!e164) return;
    phoneRef.current = e164;

    try {
      setIsSigningUp(true);

      await signUp(
        emailRef.current,
        passwordRef.current,
        nameRef.current,
        phoneRef.current,
        ""
      );

      // ⬇️ Save credentials securely so Login can prefill
      await SecureStore.setItemAsync("prefillEmail", emailRef.current);
      await SecureStore.setItemAsync("prefillPassword", passwordRef.current);

      // ⬇️ Go straight to Login
      router.replace("/(auth)/login");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "We couldn't complete your registration. Please try again.";
      setApiError(msg);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullBlack}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenWrapper variant="default" style={styles.fullBlack}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.form, { paddingBottom: spacingY._20 }]}>
              <View style={{ marginBottom: spacingY._25 }}>
                <Typo size={35} style={{ textAlign: "center" }} fontFamily="Candal">
                  <Text style={{ color: colors.green }}>patch</Text>
                  <Text style={{ color: colors.white }}> up</Text>
                </Typo>
                <Typo
                  color={colors.neutral100}
                  style={{ textAlign: "center", marginTop: -spacingY._12 }}
                  fontFamily="InterLight"
                >
                  Create an Account
                </Typo>
              </View>

              {/* Name */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Username"
                      value={value}
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => {
                        setNameFocused(true);
                        setActiveField("name");
                      }}
                      onBlur={() => {
                        setNameFocused(false);
                        onBlur();
                        setActiveField(null);
                      }}
                      icon={
                        <Icons.UserIcon
                          size={verticalScale(26)}
                          color={nameFocused ? colors.green : colors.neutral600}
                        />
                      }
                    />
                    {activeField === "name" && getError("name") && (
                      <Typo color={colors.rose} fontFamily="InterLight">
                        {getError("name")}
                      </Typo>
                    )}
                  </>
                )}
              />

              {/* Phone */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={(v) => onChange(formatPhDisplay(v))}
                      onFocus={() => {
                        setPhoneFocused(true);
                        setActiveField("phone");
                      }}
                      onBlur={() => {
                        setPhoneFocused(false);
                        onBlur();
                        setActiveField(null);
                      }}
                      icon={
                        phoneFocused ? (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 18 }}>{toFlagEmoji(countryCode)}</Text>
                            <Text style={{ color: colors.neutral600, marginLeft: 6 }}>
                              +{callingCode}
                            </Text>
                          </View>
                        ) : (
                          <Icons.PhoneCallIcon size={verticalScale(26)} color={colors.neutral600} />
                        )
                      }
                    />
                    {activeField === "phone" && getError("phone") && (
                      <Typo color={colors.rose} fontFamily="InterLight">
                        {getError("phone")}
                      </Typo>
                    )}
                  </>
                )}
              />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Email"
                      value={value}
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => {
                        setEmailFocused(true);
                        setActiveField("email");
                      }}
                      onBlur={() => {
                        setEmailFocused(false);
                        onBlur();
                        setActiveField(null);
                      }}
                      icon={
                        <Icons.EnvelopeIcon
                          size={verticalScale(26)}
                          color={emailFocused ? colors.green : colors.neutral600}
                        />
                      }
                    />
                    {activeField === "email" && getError("email") && (
                      <Typo color={colors.rose} fontFamily="InterLight">
                        {getError("email")}
                      </Typo>
                    )}
                  </>
                )}
              />

              {/* Password + eye + generator */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View style={styles.inputWrap}>
                      <Input
                        placeholder="New Password"
                        value={value}
                        secureTextEntry={!showPw}
                        onChangeText={(v) => {
                          onChange(v);
                          setPassword(v);
                        }}
                        onFocus={() => {
                          setPasswordFocused(true);
                          setActiveField("password");
                        }}
                        onBlur={() => {
                          setPasswordFocused(false);
                          onBlur();
                          setActiveField(null);
                        }}
                        icon={
                          <Icons.LockIcon
                            size={verticalScale(26)}
                            color={passwordFocused ? colors.green : colors.neutral600}
                          />
                        }
                        containerStyle={styles.inputWithRight}
                        autoCorrect={false}
                        autoCapitalize="none"
                        autoComplete="off"
                        importantForAutofill="no"
                        textContentType="none"
                        keyboardType="default"
                        returnKeyType="done"
                      />

                      <View pointerEvents="box-none" style={styles.overlayRight}>
                        <Pressable style={styles.iconBtn} onPress={generateStrongPassword}>
                          <Icons.DiceFiveIcon size={20} color={colors.neutral200} />
                        </Pressable>
                        <Pressable style={styles.iconBtn} onPress={() => setShowPw((p) => !p)}>
                          {showPw ? (
                            <Icons.EyeSlashIcon size={22} color={colors.neutral200} />
                          ) : (
                            <Icons.EyeIcon size={22} color={colors.neutral200} />
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <PasswordPopover
                      visible={passwordFocused || password.length > 0}
                      value={password}
                      fontFamily="InterLight"
                    />

                    {activeField === "password" && getError("password") && (
                      <Typo color={colors.rose} fontFamily="InterLight">
                        {getError("password")}
                      </Typo>
                    )}
                  </>
                )}
              />

              {/* Confirm Password */}
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ position: "relative", marginTop: spacingY._10 }}>
                    <Input
                      placeholder="Confirm Password"
                      value={value}
                      secureTextEntry
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => setActiveField("confirmPassword")}
                      onBlur={() => {
                        onBlur();
                        setActiveField(null);
                      }}
                      icon={
                        <Icons.LockKeyIcon size={verticalScale(26)} color={colors.neutral600} />
                      }
                    />

                    {activeField === "confirmPassword" && getError("confirmPassword") && (
                      <Typo color={colors.rose} style={{ marginTop: 6 }} fontFamily="InterLight">
                        {getError("confirmPassword")}
                      </Typo>
                    )}
                  </View>
                )}
              />

              {apiError && (
                <Typo color={colors.rose} style={{ marginTop: 8 }} fontFamily="InterLight">
                  {apiError}
                </Typo>
              )}

              <View style={{ marginTop: spacingY._25, gap: spacingY._15 }}>
                <Button
                  loading={isSigningUp}
                  disabled={!isValid || isSigningUp}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Typo fontWeight={"bold"} color={colors.black} size={20}>
                    Create
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo color={colors.neutral200} fontFamily="InterLight">
                    Already have an account?
                  </Typo>
                  <Pressable onPress={() => router.push("/(auth)/login")}>
                    <Typo fontWeight={"bold"} color={colors.green}>
                      Sign in
                    </Typo>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  fullBlack: {
    flex: 1,
    backgroundColor: colors.black,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: spacingX._20,
  },
  form: {
    gap: spacingY._15,
    marginTop: spacingY._20,
    minHeight: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 5,
  },
  // input + overlay
  inputWithRight: { paddingRight: 88 },
  inputWrap: { position: "relative" },
  overlayRight: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 5,
    elevation: 5,
    pointerEvents: "box-none",
  },
  iconBtn: { padding: 6, marginLeft: 8 },
});
