import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PayInfoScreen() {
  const account = useActiveAccount();
  const router = useRouter();

  // Animation for button
  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(buttonScale.value, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        }),
      },
    ],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = 0.95;
  };

  const handleButtonPressOut = () => {
    buttonScale.value = 1;
  };

  const navigateToPaymentTab = () => {
    router.push("/(app)/(authenticated)/(modal)/(pay)/recieve");

  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#1A1A1A", dark: "#1A1A1A" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
    >
      {/* Main Content */}
      <ThemedView style={styles.container}>
        {/* Title */}
        <ThemedText style={styles.title}>ioPlasmaVerse Pay</ThemedText>
        <ThemedText style={styles.subtitle}>
          Send and receive crypto globally with ease.
        </ThemedText>

        {/* Introduction */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Welcome to ioPlasmaVerse Pay</ThemedText>
          <ThemedText style={styles.sectionText}>
            ioPlasmaVerse Pay offers a seamless way to send and receive cryptocurrency payments worldwide. Whether you're a shop owner or an individual, our platform supports multiple payment methods, ensuring flexibility and convenience for all users.
          </ThemedText>
        </ThemedView>

        {/* Payment Receipt Options */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.sectionTitle}>How to Receive Payments</ThemedText>
          <ThemedText style={styles.sectionText}>
            You have two easy options to receive payments with ioPlasmaVerse Pay:
          </ThemedText>
          <View style={styles.optionContainer}>
            <View style={styles.optionIcon}>
              <Ionicons name="phone-portrait-outline" size={24} color="#00DDEB" />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={styles.optionTitle}>In-App Payment</ThemedText>
              <ThemedText style={styles.optionText}>
                Receive payments directly within the app. Share your payment details with the payer, and they can send crypto or pay with a credit card seamlessly.
              </ThemedText>
            </View>
          </View>
          <View style={styles.optionContainer}>
            <View style={styles.optionIcon}>
              <Ionicons name="qr-code-outline" size={24} color="#00DDEB" />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={styles.optionTitle}>Unique QR Code</ThemedText>
              <ThemedText style={styles.optionText}>
                Generate a unique QR code for your payment. The payer can scan the QR code and pay using crypto or a credit card, making transactions quick and secure.
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Payment Process */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.sectionTitle}>How Payments Work</ThemedText>
          <ThemedText style={styles.sectionText}>
            ioPlasmaVerse Pay ensures flexibility in how payments are processed, supporting a wide range of tokens and chains:
          </ThemedText>
          <View style={styles.optionContainer}>
            <View style={styles.optionIcon}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#00DDEB" />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={styles.optionTitle}>Same-Chain Payments</ThemedText>
              <ThemedText style={styles.optionText}>
                If the shop owner requests USDC on Base, the payer can pay with USDC or any other token with sufficient liquidity on Base. The payment is completed in a maximum of 2 transactions via a swap.
              </ThemedText>
            </View>
          </View>
          <View style={styles.optionContainer}>
            <View style={styles.optionIcon}>
              <Ionicons name="git-network-outline" size={24} color="#00DDEB" />
            </View>
            <View style={styles.optionTextContainer}>
              <ThemedText style={styles.optionTitle}>Cross-Chain Payments</ThemedText>
              <ThemedText style={styles.optionText}>
                ioPlasmaVerse Universal payment system pay with token you own we are fetching all options based on your token Balances on the supported chains.
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Navigate to Payment Tab Button */}
        <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={navigateToPaymentTab}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
          >
            <ThemedText style={styles.buttonText}>Go to Payment Section</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#000" style={styles.buttonIcon} />
          </TouchableOpacity>
        </Animated.View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    padding: 20,
    backgroundColor: "#1A1A1A",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    paddingTop: 10,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00DDEB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: "#a8dadc",
    lineHeight: 20,
    marginBottom: 10,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 5,
  },
  optionText: {
    fontSize: 14,
    color: "#a8dadc",
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#00DDEB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
});