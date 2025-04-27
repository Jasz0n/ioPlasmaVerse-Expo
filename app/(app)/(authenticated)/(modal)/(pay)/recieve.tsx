import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { chainData } from "@/constants/types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useUser } from "@/constants/UserProvider";
import { useActiveAccount } from "thirdweb/react";

export default function WriteScreen() {
  const account = useActiveAccount();
  const { userData } = useUser();
  const [amount, setAmount] = useState("10");
  const [message, setMessage] = useState(""); // New message field
  const [qrValue, setQrValue] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isPayed, setIsPayed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [paymentType, setPaymentType] = useState<"qr" | "inApp">("qr"); // Toggle between QR and in-app
  const [payerId, setPayerId] = useState(""); // Optional payer_id for in-app payments
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<keyof typeof chainData>("Ethereum");
  const [selectedTokenKey, setSelectedTokenKey] = useState<"nativeToken" | "USDC" | "wrappedETH" | "wrappedBTC">("nativeToken");
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const selectedNetwork = chainData[selectedNetworkKey];
  const selectedToken = selectedNetwork[selectedTokenKey];
  const borderOpacity = useSharedValue(0);

  const generatePaymentRequest = async () => {
    if (!account || !selectedToken || !selectedNetwork || !amount) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (paymentType === "inApp" && !payerId) {
      Alert.alert("Error", "Please provide a payer ID for in-app payments");
      return;
    }

    const amountInSmallestUnit = (parseFloat(amount) * Math.pow(10, selectedToken.decimals)).toFixed(0);
    try {
      setIsLoading(true);
      const data = {
        userId: account.address,
        recieverAddress: userData?.receiverAddress,
        chainId: selectedNetwork.chainId,
        tokenAddress: selectedToken.contractAddress,
        amount: amountInSmallestUnit,
        message, // Include message in the request
        in_app_payment: paymentType === "inApp",
        ...(paymentType === "inApp" && { payer_id: payerId }), // Include payer_id only for in-app
      };

      const response = await fetch(`https://ioplasmaverse.com/api/pay/saveRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save payment request");
      const { paymentId } = await response.json();
      setPaymentId(paymentId);

      if (paymentType === "qr") {
        const qrLink = `https://ioplasmaverse.com/pay?token=${selectedToken.contractAddress}&chain=${selectedNetwork.chainId}&address=${userData?.receiverAddress}&uint256=${amountInSmallestUnit}&paymentId=${paymentId}`;
        setQrValue(qrLink);
        setShowQr(true);
      } else {
        // For in-app, we could navigate to a confirmation screen or show a success message
        Alert.alert("Success", "In-app payment request sent!");
      }
    } catch (error) {
      console.error("Error saving payment request:", error);
      Alert.alert("Error", "Failed to generate payment request");
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/pay/status/${paymentId}`);
      if (!response.ok) throw new Error("Failed to fetch payment status");
      const data = await response.json();
      return data.isPayed;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!paymentId || !showQr || paymentType !== "qr") return;
    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(paymentId);
      if (status) {
        setIsPayed(true);
        clearInterval(interval);
        borderOpacity.value = withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) });
        borderOpacity.value = withTiming(0, { duration: 400 });
        borderOpacity.value = withTiming(1, { duration: 400 });
        borderOpacity.value = withTiming(0, { duration: 400 });
        setTimeout(() => setShowQr(false), 1600);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [paymentId, showQr, borderOpacity, paymentType]);

  const closeQr = () => {
    setShowQr(false);
    setQrValue("");
    setPaymentId(null);
    setIsPayed(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(40, 167, 69, ${borderOpacity.value})`,
    borderWidth: 2,
  }));

  const renderSettings = () => (
    <ThemedView style={styles.stepContainer}>
      {isPayed && paymentType === "qr" && (
        <View style={styles.successContainer}>
          <ThemedText style={styles.successText}>Payment Succeeded!</ThemedText>
          <ThemedText style={styles.qrSubtitle}>
            {amount} {selectedToken.symbol} on {selectedNetwork.name} has been received.
          </ThemedText>
          <TouchableOpacity style={styles.closeSuccessButton} onPress={closeQr}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ gap: 8 }}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Receive Payment</ThemedText>
        <ThemedText type="subtext" style={styles.sectionSubtitle}>
          Select network, token, amount, and payment type
        </ThemedText>
      </View>

      {/* Payment Type Picker */}
      <ThemedText type="defaultSemiBold" style={styles.label}>Payment Type</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={paymentType}
          onValueChange={(value) => setPaymentType(value as "qr" | "inApp")}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor="#A0A0A0"
        >
          <Picker.Item label="QR Code" value="qr" />
          <Picker.Item label="In-App Request" value="inApp" />
        </Picker>
      </View>

      {/* Network Picker */}
      <ThemedText type="defaultSemiBold" style={styles.label}>Network</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedNetworkKey}
          onValueChange={(value) => {
            setSelectedNetworkKey(value as keyof typeof chainData);
            setSelectedTokenKey("nativeToken");
          }}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor="#A0A0A0"
        >
          {Object.keys(chainData).map((key) => (
            <Picker.Item key={key} label={chainData[key].name} value={key} />
          ))}
        </Picker>
      </View>

      {/* Token Picker */}
      <ThemedText type="defaultSemiBold" style={styles.label}>Token</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTokenKey}
          onValueChange={(value) => setSelectedTokenKey(value as "nativeToken" | "USDC" | "wrappedETH" | "wrappedBTC")}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor="#A0A0A0"
        >
          <Picker.Item label={selectedNetwork.nativeToken.name} value="nativeToken" />
          <Picker.Item label={selectedNetwork.USDC.name} value="USDC" />
          <Picker.Item label={selectedNetwork.wrappedETH.name} value="wrappedETH" />
          <Picker.Item label={selectedNetwork.wrappedBTC.name} value="wrappedBTC" />
        </Picker>
      </View>

      {/* Amount Input */}
      <TextInput
        style={[styles.input, inputFocused && styles.inputFocused]}
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter ${selectedToken.symbol} amount`}
        placeholderTextColor="#A0A0A0"
        keyboardType="numeric"
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
      />

      {/* Message Input */}
      <TextInput
        style={[styles.input, inputFocused && styles.inputFocused]}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter a message (e.g., 'For coffee')"
        placeholderTextColor="#A0A0A0"
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
      />

      {/* Payer ID Input (only for in-app) */}
      {paymentType === "inApp" && (
        <>
          <ThemedText type="defaultSemiBold" style={styles.label}>Payer ID</ThemedText>
          <TextInput
            style={[styles.input, inputFocused && styles.inputFocused]}
            value={payerId}
            onChangeText={setPayerId}
            placeholder="Enter payer's address"
            placeholderTextColor="#A0A0A0"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </>
      )}

      <TouchableOpacity style={styles.generateButton} onPress={generatePaymentRequest} activeOpacity={0.8}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {paymentType === "qr" ? "Generate QR" : "Send In-App Request"}
          </ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );

  const renderQrView = () => (
    <View style={styles.qrFullScreen}>
      <TouchableOpacity style={styles.closeButton} onPress={closeQr}>
        <ThemedText style={styles.closeButtonText}>✕</ThemedText>
      </TouchableOpacity>
      <ThemedText type="title" style={styles.qrTitle}>Scan to Pay</ThemedText>
      <ThemedText style={styles.qrSubtitle}>
        {amount} {selectedToken.symbol} on {selectedNetwork.name}
      </ThemedText>
      <Animated.View style={[styles.qrContainer, animatedStyle]}>
        <QRCode value={qrValue} size={250} backgroundColor="#fff" color="#000" />
      </Animated.View>
      {!isPayed && <ThemedText style={styles.waitingText}>Waiting for payment...</ThemedText>}
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#1A1A1A", dark: "#1A1A1A" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
    >
      {showQr && paymentType === "qr" ? renderQrView() : renderSettings()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
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
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  label: {
    fontSize: 16,
    color: "#fff",
  },
  pickerContainer: {
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "#333",
    color: "#fff",
  },
  pickerItem: {
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#333",
    color: "#fff",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#28a745",
  },
  generateButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: "#1A1A1A",
    minHeight: 600,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#555",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#fff",
  },
  qrTitle: {
    marginBottom: 10,
    color: "#fff",
    fontSize: 24,
  },
  qrSubtitle: {
    marginBottom: 20,
    color: "#A0A0A0",
    fontSize: 16,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#555",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waitingText: {
    marginTop: 20,
    color: "#A0A0A0",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});