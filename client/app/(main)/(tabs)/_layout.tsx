import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import CustomNavBar from "@/components/CustomNavBar";

export default function MainTabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Tabs
        initialRouteName="home"
        tabBar={(props) => <CustomNavBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="activity" options={{ title: "Activity" }} />
        <Tabs.Screen name="message" options={{ title: "Messages" }} />
        <Tabs.Screen name="profileModal" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}
