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
import { Explorer } from "@/components/Explorer/explorer";
import { useLocalSearchParams } from "expo-router";

export default function WriteScreen() {
    const {chainId , contractAddress} = useLocalSearchParams();

  

  
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#1A1A1A", dark: "#1A1A1A" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
    >
      <Explorer type={"DefaultNFT"} contractAddress={contractAddress.toString()} chainId={Number(chainId)} />
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
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  label: {
    fontSize: 16,
    color: '#fff',
  },
  pickerContainer: {
    backgroundColor: '#333', // Dark background for the picker container
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden', // Ensure the container clips the picker
  },
  picker: {
    height: 50,
    width: "100%",
    backgroundColor: '#333', // Dark background for the picker
    color: '#fff', // White text for the selected value
  },
  pickerItem: {
    color: '#fff', // White text for picker items
    fontSize: 16,
    backgroundColor: '#333', // Attempt to set item background (works on Android)
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#28a745',
  },
  generateButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: "600",
    fontSize: 16,
  },
  qrFullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#1A1A1A',
    minHeight: 600,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  qrTitle: {
    marginBottom: 10,
    color: '#fff',
    fontSize: 24,
  },
  qrSubtitle: {
    marginBottom: 20,
    color: '#A0A0A0',
    fontSize: 16,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waitingText: {
    marginTop: 20,
    color: '#A0A0A0',
    fontSize: 16,
  },
  successContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  successText: {
    color: '#28a745',
    fontSize: 20,
    fontWeight: "bold",
  },
  closeSuccessButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});