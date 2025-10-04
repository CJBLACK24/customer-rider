import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Animated, Easing, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Icons from "phosphor-react-native";

// ===== Design tokens =====
const BAR_BG = "#1E1E1E";
const INACTIVE_TEXT = "#B9B9B9";
const ACTIVE_GREEN = "#6EFF87";
const BAR_HEIGHT = 78;               // Figma 73 + a little padding
const ICON_LIFT = -3;                // icon rise amount
const LABEL_DROP = 3;                // label settles slightly lower
const NAV_RADIUS = 24;               // navbar rounded corners
const ANIM_MS = 260;                 // duration
const ANIM_EASE = Easing.bezier(0.2, 0.8, 0.2, 1); // speed up then slow-mo

const ALLOWED_TABS = ["home", "message", "profileModal"] as const;
type AllowedTab = (typeof ALLOWED_TABS)[number];

const CustomNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const focusedRouteName = state.routes[state.index]?.name as string;

  // Build visible routes first (no hooks)
  const visibleRoutes = state.routes.filter(r => ALLOWED_TABS.includes(r.name as AllowedTab));

  // Now we can conditionally render
  if (!ALLOWED_TABS.includes(focusedRouteName as AllowedTab)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {visibleRoutes.map((route) => {
          const actualIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === actualIndex;
          const routeName = route.name as AllowedTab;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          const label =
            routeName === "message" ? "Chats" : routeName === "home" ? "Home" : "Profile";

          return (
            <View key={route.key} style={styles.slot}>
              <TabButton
                routeName={routeName}
                label={label}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                testID={`tab-${routeName}`}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Animated per-tab button (no bg between icon & text)
function TabButton({
  routeName,
  label,
  isFocused,
  onPress,
  onLongPress,
  testID,
}: {
  routeName: AllowedTab;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  testID?: string;
}) {
  // 0 → 1 (unfocused → focused)
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isFocused ? 1 : 0,
      duration: ANIM_MS,
      easing: ANIM_EASE,
      useNativeDriver: true,
    }).start();
  }, [isFocused, progress]);

  // Icon: translateY 0 → ICON_LIFT, slight fade 0.85 → 1
  const iconTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ICON_LIFT],
  });
  const iconOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  // Label: opacity 0 → 1, translateY -2 → LABEL_DROP
  const labelOpacity = progress;
  const labelTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, LABEL_DROP],
  });

  const color = isFocused ? ACTIVE_GREEN : INACTIVE_TEXT;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.9}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${label} tab`}
      testID={testID}
      style={styles.tabItem}
    >
      {/* ICON */}
      <Animated.View
        style={[styles.iconWrap, { transform: [{ translateY: iconTranslateY }], opacity: iconOpacity }]}
      >
        {getIcon(routeName, color)}
      </Animated.View>

      {/* LABEL */}
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          { color, opacity: labelOpacity, transform: [{ translateY: labelTranslateY }] },
        ]}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

function getIcon(routeName: AllowedTab, color: string) {
  switch (routeName) {
    case "home":
      return <Icons.House size={20} weight="bold" color={color} />;
    case "message":
      return <Icons.ChatCircleDots size={20} weight="bold" color={color} />;
    case "profileModal":
      // Prefer 'User' (some builds don't export 'UserIcon')
      return <Icons.User size={20} weight="bold" color={color} />;
    default:
      return <Icons.House size={20} weight="bold" color={color} />;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BAR_BG,
    zIndex: 100,
    height: BAR_HEIGHT,
    paddingHorizontal: 12,
    paddingTop: 10,
    // Rounded navbar shell (no chip between icon & text)
    borderTopLeftRadius: NAV_RADIUS,
    borderTopRightRadius: NAV_RADIUS,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slot: {
    flex: 1,
    alignItems: "center",
  },
  tabItem: {
    height: "100%",
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CustomNavBar;
