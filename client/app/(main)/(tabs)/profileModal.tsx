// client/app/(main)/profileModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import ScreenWrapper from "@/components/ScreenWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import { useAuth } from "@/contexts/authContext";
import Button from "@/components/Button";
import { useRouter } from "expo-router";
import { updateProfile } from "@/socket/socketEvents";
import * as ImagePicker from "expo-image-picker";
import { uploadFileToCloudinary } from "@/services/imageService";
import BGProfile from "@/components/BackgroundUIProfile";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";

// ✅ local sign-out cleanup (no navigation)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { disconnectSocket } from "@/socket/socket";

/* ----------------------------- Validation ----------------------------- */
const profileSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(50, { message: "Name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces",
    }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\+?[0-9]{10,15}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  avatar: z.any().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;
/* --------------------------------------------------------------------- */

const ProfileModal = () => {
  const { user, updateToken } = useAuth(); // ⛔ don't call signOut here to avoid nav
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", phone: "", avatar: null },
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);

  // --- Logout modal states ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const formValues = watch();

  useEffect(() => {
    updateProfile(processUpdateProfile);
    return () => {
      updateProfile(processUpdateProfile, true);
    };
  }, []);

  const processUpdateProfile = (res: any) => {
    setLoading(false);
    if (res.success) {
      updateToken(res.data.token);
      reset({
        name: res.data.user?.name || "",
        email: res.data.user?.email || "",
        phone: res.data.user?.phone || "",
        avatar: res.data.user?.avatar || "",
      });
      router.back();
    } else {
      Alert.alert("User", res.msg);
    }
  };

  useEffect(() => {
    reset({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
    });
  }, [user, reset]);

  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setValue("avatar", result.assets[0], { shouldDirty: true });
    }
  };

  // ---- Logout flow per mockups ----
  const startLogout = () => setShowConfirm(true);

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      // local cleanup only (no route change)
      await AsyncStorage.removeItem("token");
      await disconnectSocket();
      // optional: clear any other persisted prefill state if you use it
      // await AsyncStorage.removeItem("someKey");

      setShowConfirm(false);
      setShowSuccess(true); // ✅ immediately show success card
    } finally {
      setLoggingOut(false);
    }
  };

  const goToLogin = () => {
    setShowSuccess(false);
    router.replace("/(auth)/login"); // ✅ navigate only here
  };
  // ---------------------------------

  const onSubmit = async (data: ProfileFormData) => {
    if (!isDirty) {
      Alert.alert("Info", "No changes to update");
      return;
    }
    let { name, avatar, phone } = data;
    const submitData: { name: string; phone?: string; avatar?: any } = { name };
    if (phone?.trim()) submitData.phone = phone.trim();

    if (avatar && (avatar as any)?.uri) {
      setLoading(true);
      const res = await uploadFileToCloudinary(avatar as any, "profiles");
      if (res.success) submitData.avatar = res.data;
      else {
        Alert.alert("User", res.msg);
        setLoading(false);
        return;
      }
    } else if (avatar && typeof avatar === "string") {
      submitData.avatar = avatar;
    }

    setLoading(true);
    updateProfile(submitData);
  };

  const [scrollLocked, setScrollLocked] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const FOCUS_BORDER = "#c0ffcbbb";

  // Show pencil over avatar when editing/pending change
  const hasLocalAvatarChange = useMemo(
    () =>
      !!formValues?.avatar &&
      typeof formValues.avatar === "object" &&
      (formValues.avatar as any)?.uri,
    [formValues?.avatar]
  );
  const showAvatarUpdateBtn = (hasLocalAvatarChange || isDirty) && !loading;

  return (
    <ScreenWrapper isModal={true} style={{ paddingTop: 0 }}>
      <View style={styles.container}>
        <BGProfile
          headerHeight={130}
          pointDepth={25}
          circleDiameter={140}
          circleOffsetY={-100}
          zIndex={0}
        />

        <Header
          title={"Update Profile "}
          isProfileTitle={true}
          leftIcon={
            Platform.OS === "android" && <BackButton color={colors.black} />
          }
          style={{ marginVertical: spacingY._15 }}
        />

        {/* FORM */}
        <ScrollView
          contentContainerStyle={styles.form}
          scrollEnabled={!scrollLocked}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={onPickImage}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Avatar uri={formValues.avatar as any} size={120} />
            </TouchableOpacity>

            {showAvatarUpdateBtn && (
              <TouchableOpacity
                style={styles.editIcon}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                <Icons.PenIcon
                  size={verticalScale(20)}
                  color={colors.neutral800}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View
              style={{ marginTop: spacingY._20, marginBottom: spacingY._20 }}
            >
              <Typo size={20} fontWeight="900" fontFamily="InterLight">
                <Text
                  style={{
                    color: "#6EFF87",
                    letterSpacing: 1,
                    fontFamily: "InterLight",
                  }}
                >
                  Rider Profile
                </Text>
                <Text style={{ color: "#FFFFFF", fontFamily: "InterLight" }}>
                  {" "}
                  Detail
                </Text>
              </Typo>
            </View>

            {/* NAME */}
            <Typo
              style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }}
              fontFamily="InterLight"
            >
              Name
            </Typo>
            <View style={styles.fieldWrap}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    icon={
                      <Icons.UserIcon
                        size={verticalScale(20)}
                        color="#000000"
                        weight="fill"
                      />
                    }
                    containerStyle={{
                      borderColor: errors.name
                        ? colors.rose
                        : nameFocused
                        ? FOCUS_BORDER
                        : "#1E2022",
                      paddingLeft: spacingX._20,
                      backgroundColor: "#C0FFCB",
                      borderRadius: 180,
                      borderCurve: "continuous",
                    }}
                    inputStyle={{
                      color: colors.black,
                      fontFamily: "InterLight",
                    }}
                    onChangeText={onChange}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => {
                      setNameFocused(false);
                      onBlur();
                    }}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.rightEditBtn}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                <Icons.PenIcon
                  size={verticalScale(18)}
                  color={colors.black}
                  weight="fill"
                />
              </TouchableOpacity>
            </View>
            {errors.name && (
              <Typo style={styles.errorText} fontFamily="InterLight">
                {errors.name.message as string}
              </Typo>
            )}
          </View>

          {/* PHONE */}
          <View style={{ gap: spacingY._20 }}>
            <View style={styles.inputContainer}>
              <Typo
                style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }}
                fontFamily="InterLight"
              >
                Phone
              </Typo>
              <View style={styles.fieldWrap}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      icon={
                        <Icons.PhoneIcon
                          size={verticalScale(20)}
                          color="#000000"
                          weight="fill"
                        />
                      }
                      containerStyle={{
                        borderColor: errors.phone
                          ? colors.rose
                          : phoneFocused
                          ? FOCUS_BORDER
                          : "#1E2022",
                        paddingLeft: spacingX._20,
                        backgroundColor: "#C0FFCB",
                        borderRadius: 180,
                        borderCurve: "continuous",
                      }}
                      inputStyle={{
                        color: colors.black,
                        fontFamily: "InterLight",
                      }}
                      onFocus={() => {
                        setScrollLocked(true);
                        setPhoneFocused(true);
                      }}
                      onBlur={() => {
                        setScrollLocked(false);
                        setPhoneFocused(false);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.rightEditBtn}
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  <Icons.PenIcon
                    size={verticalScale(18)}
                    color={colors.black}
                    weight="fill"
                  />
                </TouchableOpacity>
              </View>
              {errors.phone && (
                <Typo style={styles.errorText} fontFamily="InterLight">
                  {errors.phone.message as string}
                </Typo>
              )}
            </View>
          </View>

          {/* EMAIL (read-only) */}
          <View style={styles.inputContainer}>
            <Typo
              style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }}
              fontFamily="InterLight"
            >
              Email
            </Typo>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  icon={
                    <Icons.EnvelopeSimpleIcon
                      size={verticalScale(20)}
                      color="#000000"
                      weight="fill"
                    />
                  }
                  containerStyle={{
                    borderColor: errors.email ? colors.rose : "#1E2022",
                    paddingLeft: spacingX._20,
                    backgroundColor: "#C0FFCB",
                    borderRadius: 180,
                    borderCurve: "continuous",
                  }}
                  inputStyle={{ color: colors.black, fontFamily: "InterLight" }}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={false}
                />
              )}
            />
            {errors.email && (
              <Typo style={styles.errorText} fontFamily="InterLight">
                {errors.email.message as string}
              </Typo>
            )}
          </View>

          {/* LOGOUT button (opens confirm modal) */}
          <View style={styles.logoutWrap}>
            <Button onPress={startLogout} style={styles.logoutBtn}>
              <View style={styles.logoutRow}>
                <Icons.PowerIcon
                  size={verticalScale(20)}
                  color={colors.white}
                  weight="fill"
                />
                <Typo
                  color={colors.white}
                  fontWeight={"700"}
                  size={16}
                  style={{ marginLeft: 8 }}
                  fontFamily="InterLight"
                >
                  Logout
                </Typo>
              </View>
            </Button>
          </View>
        </ScrollView>
      </View>

      {/* ===== Confirm Modal ===== */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Icons.SignOutIcon size={72} color={colors.black} weight="bold" />
            </View>

            <Typo
              size={18}
              fontWeight="800"
              style={{ textAlign: "center", marginTop: spacingY._10 }}
            >
              You’re about to Logout…
              {"\n"}Are you sure?
            </Typo>

            <View style={{ height: spacingY._20 }} />

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.modalBtn, styles.modalBtnSecondary]}
              onPress={() => setShowConfirm(false)}
              disabled={loggingOut}
            >
              <Typo fontWeight="800">No, Don’t Log Me Out</Typo>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={doLogout}
              disabled={loggingOut}
            >
              <Typo fontWeight="800" color={colors.black}>
                {loggingOut ? "Logging out…" : "Yes, Log Me Out"}
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== Success Modal (navigate only on button press) ===== */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Icons.CheckIcon size={72} color={colors.black} weight="bold" />
            </View>

            <Typo
              size={18}
              fontWeight="800"
              style={{ textAlign: "center", marginTop: spacingY._10 }}
            >
              You have successfully
              {"\n"}Logged out
            </Typo>

            <View style={{ height: spacingY._20 }} />

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={goToLogin}
            >
              <Typo fontWeight="800" color={colors.black}>
                Return to Login
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Footer spacer (unchanged) */}
      <View style={styles.footer} />
    </ScreenWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
    backgroundColor: "#0D0D0D",
  },
  form: {
    gap: spacingY._20,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._17,
    right: spacingY._10,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    padding: 6,
  },
  inputContainer: {
    gap: spacingY._7,
  },
  fieldWrap: {
    position: "relative",
    justifyContent: "center",
  },
  rightEditBtn: {
    position: "absolute",
    right: spacingX._10,
    height: verticalScale(36),
    width: verticalScale(36),
    borderRadius: 999,
    backgroundColor: "#C0FFCB",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.rose,
    fontSize: 12,
    paddingLeft: spacingX._10,
    marginTop: 4,
    fontFamily: "InterLight",
  },
  footer: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._10,
    borderTopWidth: 0,
  },
  logoutWrap: {
    alignItems: "center",
    marginTop: spacingY._10,
  },
  logoutBtn: {
    backgroundColor: colors.rose,
    paddingHorizontal: spacingX._20,
    height: verticalScale(44),
    borderRadius: 999,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ===== Modal styles to match mockups ===== */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#C0FFCB",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  modalIconCircle: {
    height: 84,
    width: 84,
    borderRadius: 84,
    backgroundColor: "#A5F4B4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtn: {
    width: "88%",
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  modalBtnPrimary: {
    backgroundColor: "#6EFF87",
  },
  modalBtnSecondary: {
    backgroundColor: "#EAFBEF",
    borderWidth: 1,
    borderColor: "#6EFF87",
  },
});
