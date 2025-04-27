import React, { FC, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Clipboard,
  Alert,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useActiveAccount } from "thirdweb/react";
import { transferFrom } from "thirdweb/extensions/erc20";
import { defineChain, getContract, sendTransaction } from "thirdweb";
import { client } from "@/constants/thirdweb";
import QRCode from "react-native-qrcode-svg"; // For QR code generation
import * as Linking from "expo-linking"; // For opening blockchain explorer links
import { Ionicons } from "@expo/vector-icons"; // For icons (replacing FiSend, FiDownload, FiExternalLink)
import { Token } from "@/constants/currency";

const { width } = Dimensions.get("window");

interface Explorer {
  name: string;
  url: string;
  standard: string;
  icon?: string;
}

interface Chain {
  name: string;
  chainId: number;
  explorers?: Explorer[];
  explorer?: Explorer;
}


interface BalanceCardProps {
  token: Token;
}

export const BalanceCard: FC<BalanceCardProps> = ({ token }) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const account = useActiveAccount();
  const [qrModalOpened, setQrModalOpened] = useState(false);
  const [sendModalOpened, setSendModalOpened] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  /* ---------------------------------------------------------------
     Handle Token Transfer
  --------------------------------------------------------------- */
  const handleTransfer = async () => {
    if (!account) {
      Alert.alert("Error", "Please connect your wallet first.");
      return;
    }

    if (!toAddress || !amount) {
      Alert.alert("Error", "Please enter a recipient address and amount.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const tx = await transferFrom({
        contract: getContract({
          client,
          chain: defineChain(token.chainId),
          address: token.contractAddress,
        }),
        from: account.address,
        to: toAddress,
        amount: amount,
      });

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account,
      });

      setMessage(`Transaction successful! Hash: ${transactionHash}`);
    } catch (err) {
      console.error("Error during token transfer:", err);
      setMessage("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------
     Copy Wallet Address
  --------------------------------------------------------------- */
  const handleCopy = () => {
    if (account?.address) {
      Clipboard.setString(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  /* ---------------------------------------------------------------
     Open Blockchain Explorer
  --------------------------------------------------------------- */
  
  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  return (
    <>
      {/* Main ERC20 Balance Card */}
      <ThemedView style={styles.card}>
        <View style={styles.tokenContainer}>
          {/* Token Logo */}
          <View style={styles.logoContainer}>
            {token.image ? (
              <Image
                source={{ uri: token.image }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <ThemedText style={styles.logoPlaceholderText}>
                  {token.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Token Details */}
          <View style={styles.detailsContainer}>
            <ThemedText style={styles.tokenName}>
              {token.name} ({token.symbol})
            </ThemedText>
            <ThemedText style={styles.netWorth}>
              Net Worth: ${token.value || "0.00"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Token Balance and Price */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <ThemedText style={styles.balanceLabel}>Balance:</ThemedText>
            <ThemedText style={styles.balanceValue}>
              {token.balance || "0.00"}
            </ThemedText>
          </View>
          <View style={styles.balanceItem}>
            <ThemedText style={styles.balanceLabel}>Price:</ThemedText>
            <ThemedText style={styles.balanceValue}>
              ${token.price || "N/A"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSendModalOpened(true)}
          >
            <Ionicons name="send-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setQrModalOpened(true)}
          >
            <Ionicons name="download-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
         
        </View>
      </ThemedView>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalOpened}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setQrModalOpened(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              Wallet Address QR Code
            </ThemedText>
            <View style={styles.qrContainer}>
              <QRCode
                value={account?.address || ""}
                size={256}
                backgroundColor="#1A1A1A"
                color="#FFF"
              />
            </View>
            <ThemedText style={styles.qrText}>
              Scan the QR code or copy the address
            </ThemedText>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
            >
              <ThemedText style={styles.copyButtonText}>
                {copied ? "Copied" : "Copy Address"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrModalOpened(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Tokens Modal */}
      <Modal
        visible={sendModalOpened}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSendModalOpened(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              Send {token.name} Tokens
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter the recipient's wallet address"
              placeholderTextColor="#a8dadc"
              value={toAddress}
              onChangeText={setToAddress}
            />
            <TextInput
              style={styles.input}
              placeholder={`Enter the amount (${token.symbol})`}
              placeholderTextColor="#a8dadc"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <View style={styles.sendButtonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#00C4B4" />
              ) : (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleTransfer}
                >
                  <ThemedText style={styles.sendButtonText}>Send</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            {message && (
              <ThemedText
                style={[
                  styles.messageText,
                  {
                    color: message.includes("successful") ? "#00C4B4" : "#FF6B6B",
                  },
                ]}
              >
                {message}
              </ThemedText>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSendModalOpened(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  tokenContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(97, 218, 251, 0.6)",
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "600",
  },
  detailsContainer: {
    flex: 1,
  },
  tokenName: {
    fontSize: 20,
    color: "#e5e5e5",
    fontWeight: "600",
    marginBottom: 4,
  },
  netWorth: {
    fontSize: 14,
    color: "#00d1b2",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(97, 218, 251, 0.2)",
    marginVertical: 12,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#f5f5f5",
    fontWeight: "600",
  },
  balanceValue: {
    fontSize: 14,
    color: "#f5f5f5",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    width: width,
    height: "100%",
    padding: 20,
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 24,
    color: "#a8dadc",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#4B5563",
    borderRadius: 12,
    padding: 10,
  },
  qrText: {
    fontSize: 16,
    color: "#f5f5f5",
    textAlign: "center",
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: "#61dafb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  copyButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#a8dadc",
    borderRadius: 8,
    padding: 12,
    color: "#f5f5f5",
    marginBottom: 16,
  },
  sendButtonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  sendButton: {
    backgroundColor: "#00d1b2",
    padding: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#00C4B4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
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