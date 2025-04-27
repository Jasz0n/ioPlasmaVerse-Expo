import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View, TextInput, Alert, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { chainData } from "@/constants/types";
// Define types

export default function WriteScreen() {
  const account = "0x2247d5d238d0f9d37184d8332aE0289d1aD9991b"; // Replace with useActiveAccount() in production
  const [amount, setAmount] = useState("10");
  const [qrValue, setQrValue] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isPayed, setIsPayed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<keyof typeof chainData>("Ethereum");
  const [selectedTokenKey, setSelectedTokenKey] = useState<"nativeToken" | "USDC" | "wrappedETH" | "wrappedBTC">("nativeToken");
 const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectedNetwork = chainData[selectedNetworkKey];
  const selectedToken = selectedNetwork[selectedTokenKey];
 useEffect(() => {
    if (account) {
      fetchUserData(account);
    }
  }, [account]);

  const fetchUserData = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/user/${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          setUserData(null);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        const data = await response.json();
        setUserData(data);
      }
    } catch (err) {
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR and save payment request
  const generateQR = async () => {
    if (!account || !selectedToken || !selectedNetwork || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountInSmallestUnit = (parseFloat(amount) * Math.pow(10, selectedToken.decimals)).toFixed(0); // Ensures a string

    try {
      const response = await fetch(`https://ioplasmaverse.com/api/pay/saveRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recieverAddress: userData.reciever_address,
          chainId: selectedNetwork.chainId,
          tokenAddress: selectedToken.contractAddress,
          amount: amountInSmallestUnit,
        }),
      });
      if (!response.ok) throw new Error('Failed to save payment request');
      const { paymentId } = await response.json();

      const qrLink = `https://ioplasmaverse.com/pay?token=${selectedToken.contractAddress}&chain=${selectedNetwork.chainId}&address=${userData.reciever_address}&uint256=${amountInSmallestUnit}&paymentId=${paymentId}`;
      setPaymentId(paymentId);
      setQrValue(qrLink);
      setShowQr(true);
    } catch (error) {
      console.error('Error saving payment request:', error);
      Alert.alert('Error', 'Failed to generate payment request');
    }
  };

  // Check payment status
  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/pay/status/${paymentId}`);
      if (!response.ok) throw new Error("Failed to fetch payment status");
      const data = await response.json();
      console.log("Payment Status Response:", data); // Debug log
      return data.isPayed;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false;
    }
  };
  // Poll payment status every 5 seconds
  useEffect(() => {
    if (!paymentId || !showQr) return;

    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(paymentId);
      if (status) {
        setIsPayed(true);
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId, showQr]);

  // Reset QR view and state
  const closeQr = () => {
    setShowQr(false);
    setQrValue("");
    setPaymentId(null);
    setIsPayed(false);
  };

  // Render settings view
  const renderSettings = () => (
    <ThemedView style={[styles.stepContainer, { padding: 16 }]}>
      <View style={{ gap: 8 }}>
        <ThemedText type="subtitle">Receive Payment</ThemedText>
        <ThemedText type="subtext">Select network, token, and amount</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold">Network</ThemedText>
      <Picker
        selectedValue={selectedNetworkKey}
        onValueChange={(value) => {
          setSelectedNetworkKey(value as keyof typeof chainData);
          setSelectedTokenKey("nativeToken");
        }}
        style={styles.picker}
      >
        {Object.keys(chainData).map((key) => (
          <Picker.Item key={key} label={chainData[key].name} value={key} />
        ))}
      </Picker>

      <ThemedText type="defaultSemiBold">Token</ThemedText>
      <Picker
        selectedValue={selectedTokenKey}
        onValueChange={(value) =>
          setSelectedTokenKey(value as "nativeToken" | "USDC" | "wrappedETH" | "wrappedBTC")
        }
        style={styles.picker}
      >
        <Picker.Item label={selectedNetwork.nativeToken.name} value="nativeToken" />
        <Picker.Item label={selectedNetwork.USDC.name} value="USDC" />
        <Picker.Item label={selectedNetwork.wrappedETH.name} value="wrappedETH" />
        <Picker.Item label={selectedNetwork.wrappedBTC.name} value="wrappedBTC" />
      </Picker>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter ${selectedToken.symbol} amount`}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.generateButton} onPress={generateQR}>
        <ThemedText style={styles.buttonText}>Generate QR</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  // Render QR code view
  const renderQrView = () => (
    <View style={styles.qrFullScreen}>
      <TouchableOpacity style={styles.closeButton} onPress={closeQr}>
        <ThemedText style={styles.closeButtonText}>✕</ThemedText>
      </TouchableOpacity>
      <ThemedText type="title" style={styles.qrTitle}>Scan to Pay</ThemedText>
      <ThemedText style={styles.qrSubtitle}>
        {amount} {selectedToken.symbol} on {selectedNetwork.name}
      </ThemedText>
      <View style={styles.qrContainer}>
        <QRCode value={qrValue} size={250} backgroundColor="#fff" color="#000" />
      </View>
      {isPayed ? (
        // Use type assertion for Animatable.View
        <></>
      ) : (
        <ThemedText style={styles.waitingText}>Waiting for payment...</ThemedText>
      )}
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.reactLogo} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">CryptoPay Merchant</ThemedText>
      </ThemedView>
      {showQr ? renderQrView() : renderSettings()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  stepContainer: {
    gap: 12,
    marginBottom: 8,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  qrFullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    padding: 20,
    minHeight: 600,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#333",
  },
  qrTitle: {
    marginBottom: 10,
    color: "#333",
  },
  qrSubtitle: {
    marginBottom: 20,
    color: "#666",
    fontSize: 16,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waitingText: {
    marginTop: 20,
    color: "#666",
    fontSize: 16,
  },
  successContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  successText: {
    color: "#28a745",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeSuccessButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
});