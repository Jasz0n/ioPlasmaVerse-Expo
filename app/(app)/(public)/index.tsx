import {
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  StyleSheet,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { Colors } from "@/constants/Colors"; // Assuming you have a Colors file
import { getUserEmail, inAppWallet, Wallet, WalletAutoConnectionOption } from "thirdweb/wallets";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ConnectEmbed, darkTheme, useActiveAccount } from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { defineChain } from "thirdweb";
import { WalletConnectWrapper } from "@/components/walletModal.tsx/wrapper";
import { useRouter } from "expo-router";

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/title.png")}
          style={styles.headerImage}
        />
      }
    >
     <WalletConnectWrapper
         
        />
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
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fffff", // e.g., "#FFFFFF"
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "SpaceMono",
  },
  subtitle: {
    fontSize: 16,
    color: "#fffff", // e.g., "#FFFFFF"
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "SpaceMono",
  },
  inputContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputWrapper: {
    width: "100%",
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#fffff", // e.g., "#FFFFFF"
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    fontFamily: "SpaceMono",
  },
  errorText: {
    color: "#fffff", // e.g., "#FFFFFF"
    fontSize: 12,
    marginTop: 4,
    fontFamily: "SpaceMono",
  },
  button: {
    color: "#fffff", // e.g., "#FFFFFF"
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#888888",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "SpaceMono",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: "#fffff", // e.g., "#FFFFFF"
    fontSize: 14,
    fontFamily: "SpaceMono",
  },
  signInLink: {
    color: "#fffff", // e.g., "#FFFFFF"
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "SpaceMono",
  },
});