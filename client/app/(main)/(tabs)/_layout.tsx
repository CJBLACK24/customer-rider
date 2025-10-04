import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import CustomNavBar from "@/components/CustomNavBar";

export default function MainTabsLayout() {
  return (
    // Backdrop to prevent white flashes
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Tabs
        initialRouteName="home"
        tabBar={(props) => <CustomNavBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          // (Optional) ensure the tab bar itself is dark
          
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="message" options={{ title: "Message" }} />
        <Tabs.Screen name="profileModal" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}
