// client/app/(main)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function MainStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tabs live under this group */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="newConversationModal"
        options={{ presentation: "modal", headerShown: false }}
      />

      {/* Conversation stays outside tabs -> no bottom bar */}
      <Stack.Screen name="conversation" options={{ headerShown: false }} />
    </Stack>
  );
}
