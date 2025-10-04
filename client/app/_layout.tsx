// app/_layout.tsx
import React, { useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import "react-native-gesture-handler"; 
// app/_layout.tsx (or App.tsx)



import { GestureHandlerRootView } from "react-native-gesture-handler"; // ← keep
import { AuthProvider } from "@/contexts/authContext";
import { colors } from "@/constants/theme";

// 🔔 NEW: foreground/bgd notification glue (no UI)
import NotificationBridge from "@/components/NotificationBridge";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Candal: require("../assets/fonts/Candal-Regular.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;



  return (
    // ⬇️ Wrap the whole app
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <AuthProvider>
            {/* 🔔 Registers push token, handles taps, foreground local toasts */}
            <NotificationBridge />

            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade_from_bottom",
                contentStyle: { backgroundColor: colors.black },
              }}
            >
              <Stack.Screen
                name="patching"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                  animation: "none",
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
