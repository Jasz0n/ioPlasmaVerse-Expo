import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, TextInput, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { chainData } from "@/constants/types";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useUser } from "@/constants/UserProvider";
import { useActiveAccount } from "thirdweb/react";
import PaymentsScreen from "@/components/Token/renterPayments";

export default function WriteScreen() {

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#1A1A1A", dark: "#1A1A1A" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
    >
      <PaymentsScreen />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  
});