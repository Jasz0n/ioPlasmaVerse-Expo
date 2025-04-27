// app/(app)/(authenticated)/_layout.tsx
import FloatingActionButton from "@/components/walletModal.tsx/floatingButton";
import { AppointmentProvider } from "@/providers/AppointmentProvider";
import { useAuth } from "@/providers/AuthProvider";
import ChatProvider from "@/providers/ChatProvider";
import VideoProvider from "@/providers/VideoProvider";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { useActiveAccount } from "thirdweb/react";

export default function AuthenticatedLayout() {
const { authState } = useAuth();
console.log(authState)
  if (!authState?.authenticated) {
    return <Redirect href="/(app)/(public)" />;
  }
  return (
    <ChatProvider>
      <VideoProvider>
        <AppointmentProvider>
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modal)/(pay)"
        options={{
          headerShown: true,
          headerTitle: "Payment",
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="(modal)/(collection)"
        options={{
          headerShown: true,
          headerTitle: "Collection",
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
    <Stack.Screen
        name="(modal)/(chat)"
        options={{
          headerShown: true,
          headerTitle: "PlasmaChat",
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="chat/[id]/index"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="chat/[id]/manage"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="chat/[id]/thread"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
    <Stack.Screen
        name="(modal)/create-chat"
        options={{
          headerShown: true,
          headerTitle: "PlasmaChat",
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#fff",
        }}
      />
    </Stack>
   <FloatingActionButton />
    
  </AppointmentProvider>
  </VideoProvider>

  </ChatProvider>

  );
}