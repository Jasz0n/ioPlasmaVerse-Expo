import React, { FC } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ConnectButton, ConnectEmbed } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { client } from "@/constants/thirdweb";
import { defineChain, ethereum } from "thirdweb/chains";
import { darkTheme } from "thirdweb/react"; // Import darkTheme for customization

const { width, height } = Dimensions.get("window");

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectWalletModal: FC<WalletDetailsModalProps> = ({ isOpen, onClose }) => {
  const wallets = [
    inAppWallet({
      auth: {
        options: [
          "google",
          "facebook",
          "discord",
          "telegram",
          "email",
          "phone",
          "passkey",
        ],
        passkeyDomain: "thirdweb.com",
      },
    }),
  ];

  // Define a custom dark theme to match your app's color scheme
  const customDarkTheme = darkTheme({
    colors: {
      modalBg: "#1A1A1A", // Match your app's background
      primaryText: "#a8dadc", // Match ThemedText color
      secondaryText: "#f5f5f5", // Match secondary text color
      borderColor: "#333", // Subtle border for inputs
      accentButtonBg: "#00C4B4", // Match your close button color
      accentButtonText: "#FFF", // Text color for buttons
      selectedTextColor: "#FFF", // Selected text color
      selectedTextBg: "#00C4B4", // Selected text background
    },
  });

  

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <ThemedView>
              <ThemedText style={styles.text} type="title">Connecting Wallets</ThemedText>
            </ThemedView>
            <View style={{ gap: 2 }}>
              <ConnectEmbed
                showThirdwebBranding={false}
                client={client}
                theme={customDarkTheme} // Use the custom dark theme
                chain={defineChain(4689)}
                wallets={wallets}
                style={{
                  borderRadius: 8, // Match your app's border radius
                  padding: 10, // Add some padding for better spacing

                }}
              />
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    width: width,
    height: height,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  text: {
    color: "#fffff",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: "#00C4B4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00C4B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
});