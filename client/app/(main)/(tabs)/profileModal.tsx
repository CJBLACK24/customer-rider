// client/app/(main)/profileModal.tsx
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
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

const profileSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(50, { message: "Name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces" }),
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

const ProfileModal = () => {
  const { user, signOut, updateToken } = useAuth();
  const [loading, setLoading] = useState(false);
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
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setValue("avatar", result.assets[0], { shouldDirty: true });
    }
  };

  const handleLogout = async () => {
    router.back();
    await signOut();
  };

  const showLogoutAlert = () => {
    Alert.alert("Confirm", "Are you sure you want to Logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => handleLogout(), style: "destructive" },
    ]);
  };

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

  // ====== NEW: Only show the avatar overlay button when "uploading state" ======
  // Treat "uploading state" as: user has selected a new local image (pending change) OR any form change.
  const hasLocalAvatarChange = useMemo(
    () => !!formValues?.avatar && typeof formValues.avatar === "object" && (formValues.avatar as any)?.uri,
    [formValues?.avatar]
  );
  const showAvatarUpdateBtn = (hasLocalAvatarChange || isDirty) && !loading;
  // ============================================================================

  return (
    <ScreenWrapper isModal={true} style={{ paddingTop: 0 }}>
      <View style={styles.container}>
        <BGProfile headerHeight={130} pointDepth={25} circleDiameter={140} circleOffsetY={-100} zIndex={0} />

        <Header
          title={"Update Profile "}
          isProfileTitle={true}
          leftIcon={Platform.OS === "android" && <BackButton color={colors.black} />}
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
            {/* Avatar: press to open image picker */}
            <TouchableOpacity
              onPress={onPickImage}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Avatar uri={formValues.avatar as any} size={120} />
            </TouchableOpacity>

            {/* Pencil overlay becomes the UPDATE button — only when in "uploading/editing" state */}
            {showAvatarUpdateBtn && (
              <TouchableOpacity
                style={styles.editIcon}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                <Icons.PenIcon size={verticalScale(20)} color={colors.neutral800} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={{ marginTop: spacingY._20, marginBottom: spacingY._20 }}>
              <Typo size={20} fontWeight="900" fontFamily="InterLight">
                <Text style={{ color: "#6EFF87", letterSpacing: 1, fontFamily: "InterLight" }}>
                  Rider Profile
                </Text>
                <Text style={{ color: "#FFFFFF", fontFamily: "InterLight" }}> Detail</Text>
              </Typo>
            </View>

            {/* NAME with right pencil (unchanged) */}
            <Typo style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }} fontFamily="InterLight">
              Name
            </Typo>
            <View style={styles.fieldWrap}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    icon={<Icons.UserIcon size={verticalScale(20)} color="#000000" weight="fill" />}
                    containerStyle={{
                      borderColor: errors.name ? colors.rose : nameFocused ? FOCUS_BORDER : "#1E2022",
                      paddingLeft: spacingX._20,
                      backgroundColor: "#C0FFCB",
                      borderRadius: 180,
                      borderCurve: "continuous",
                    }}
                    inputStyle={{ color: colors.black, fontFamily: "InterLight" }}
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
                <Icons.PenIcon size={verticalScale(18)} color={colors.black} weight="fill" />
              </TouchableOpacity>
            </View>
            {errors.name && (
              <Typo style={styles.errorText} fontFamily="InterLight">
                {errors.name.message as string}
              </Typo>
            )}
          </View>

          {/* PHONE with right pencil (unchanged) */}
          <View style={{ gap: spacingY._20 }}>
            <View style={styles.inputContainer}>
              <Typo style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }} fontFamily="InterLight">
                Phone
              </Typo>
              <View style={styles.fieldWrap}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      icon={<Icons.PhoneIcon size={verticalScale(20)} color="#000000" weight="fill" />}
                      containerStyle={{
                        borderColor: errors.phone ? colors.rose : phoneFocused ? FOCUS_BORDER : "#1E2022",
                        paddingLeft: spacingX._20,
                        backgroundColor: "#C0FFCB",
                        borderRadius: 180,
                        borderCurve: "continuous",
                      }}
                      inputStyle={{ color: colors.black, fontFamily: "InterLight" }}
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
                  <Icons.PenIcon size={verticalScale(18)} color={colors.black} weight="fill" />
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
            <Typo style={{ paddingLeft: spacingX._10, color: "#FFFFFF" }} fontFamily="InterLight">
              Email
            </Typo>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  icon={<Icons.EnvelopeSimpleIcon size={verticalScale(20)} color="#000000" weight="fill" />}
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

          {/* LOGOUT centered under email */}
          <View style={styles.logoutWrap}>
            <Button onPress={showLogoutAlert} style={styles.logoutBtn}>
              <View style={styles.logoutRow}>
                <Icons.PowerIcon size={verticalScale(20)} color={colors.white} weight="fill" />
                <Typo color={colors.white} fontWeight={"700"} size={16} style={{ marginLeft: 8 }} fontFamily="InterLight">
                  Logout
                </Typo>
              </View>
            </Button>
          </View>
        </ScrollView>
      </View>

      {/* Footer placeholder (kept) */}
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
});
