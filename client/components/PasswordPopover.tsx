// components/PasswordPopover.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { colors } from "@/constants/theme";
import { evalPassword } from "@/utils/password";

type FontFamily = "Candal" | "InterLight";

type Props = {
  visible: boolean; // parent controls: show on focus or when value not empty
  value: string;
  fontFamily?: FontFamily;
};

const RuleRow = ({
  ok,
  text,
  fontFamily,
}: {
  ok: boolean;
  text: string;
  fontFamily: FontFamily;
}) => (
  <View style={styles.ruleRow}>
    {ok ? (
      <Icons.CheckCircleIcon size={18} color={colors.green} weight="fill" />
    ) : (
      <Icons.XCircleIcon size={18} color={"#ef4444"} weight="fill" />
    )}
    <Typo
      style={{ marginLeft: 8 }}
      color={ok ? colors.neutral100 : "#ef4444"}
      fontFamily={fontFamily}
    >
      {text}
    </Typo>
  </View>
);

const StrengthBar = ({ label }: { label: "Weak" | "Medium" | "Strong" }) => {
  const activeCount = label === "Strong" ? 3 : label === "Medium" ? 2 : 1;
  return (
    <View style={styles.barWrap}>
      {[0, 1, 2].map((i) => {
        const active = i < activeCount;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: active
                  ? label === "Strong"
                    ? colors.green
                    : label === "Medium"
                    ? "#c69912ff"
                    : "#cd3131ff"
                  : "#2b2b2b",
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function PasswordPopover({
  visible,
  value,
  fontFamily = "InterLight",
}: Props) {
  // internal "should render" gate so we can animate out before unmounting
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  // animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current; // small slide up

  // compute rules/label every render
  const { lenOK, numOK, label, strengthColor } = useMemo(() => {
    const s = evalPassword?.(value) ?? {};
    const _lenOK =
      typeof s.lenOK === "boolean"
        ? s.lenOK
        : value.length >= 8 && value.length <= 20;
    const _numOK = typeof s.numOK === "boolean" ? s.numOK : /\d/.test(value);

    const _label: "Weak" | "Medium" | "Strong" =
      typeof s.label === "string" &&
      (["Weak", "Medium", "Strong"] as const).includes(s.label as any)
        ? (s.label as any)
        : _lenOK && _numOK
        ? "Strong"
        : _lenOK || _numOK
        ? "Medium"
        : "Weak";

    const _strengthColor =
      _label === "Strong"
        ? colors.green
        : _label === "Medium"
        ? "#c69912ff"
        : "#cd3131ff";

    return {
      lenOK: _lenOK,
      numOK: _numOK,
      label: _label,
      strengthColor: _strengthColor,
    };
  }, [value]);

  // parent visibility + auto-hide when all rules satisfied
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (visible) {
      // mount + animate in
      setMounted(true);
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // auto hide after 2s if both rules are met
      if (lenOK && numOK) {
        timer = setTimeout(() => setShow(false), 2000);
      }
    } else {
      // request hide immediately
      setShow(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, lenOK, numOK, opacity, translateY]);

  // animate out when show flips to false; then unmount
  useEffect(() => {
    if (!mounted) return;

    if (show) return; // already visible
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 6,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [show, mounted, opacity, translateY]);

  // If not mounted, render nothing — avoids “hovering” before focus
  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        styles.pwPopover,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Typo
        fontWeight="bold"
        color={colors.neutral100}
        style={{ marginBottom: 6 }}
        fontFamily={fontFamily}
      >
        Password must include:
      </Typo>

      <RuleRow ok={lenOK} text="8–20 characters" fontFamily={fontFamily} />
      <RuleRow ok={numOK} text="At least one number" fontFamily={fontFamily} />

      <View style={styles.strengthRow}>
        <Typo color={colors.neutral200} fontFamily={fontFamily}>
          Strength:{" "}
        </Typo>
        <Typo fontWeight="bold" color={strengthColor} fontFamily={fontFamily}>
          {label}
        </Typo>
      </View>
      <StrengthBar label={label} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pwPopover: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#141414",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#242424",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  strengthRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  barWrap: { flexDirection: "row", gap: 6, marginTop: 8 },
  bar: { flex: 1, height: 6, borderRadius: 4 },
});
