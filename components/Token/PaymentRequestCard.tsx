import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Clipboard,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { chainData, Token } from "@/constants/types";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface BalanceCardProps {
  id: string;
  amount: string;
  date: string;
  status: boolean;
  transactionHash: string | null;
  chainId: number;
  token: string;
  userId: string; // Sender of the request
  recieverAddress: string;
  message?: string;
  inAppPay: boolean;
}

export function PaymentRequestCard({
  id,
  amount,
  date,
  status,
  transactionHash,
  chainId,
  token,
  userId,
  recieverAddress,
  message,
  inAppPay
}: BalanceCardProps) {
  const [readableAmount, setAmount] = useState<string | null>(null);
  const [tokenInfo, setToken] = useState<Token | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const truncateString = (str: string, startLen: number = 6, endLen: number = 4) => {
    if (str.length <= startLen + endLen) return str;
    return `${str.slice(0, startLen)}...${str.slice(-endLen)}`;
  };

  const truncateMessage = (msg: string, maxLen: number = 20) => {
    if (msg.length <= maxLen) return msg;
    return `${msg.slice(0, maxLen)}...`;
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", `${text} has been copied to clipboard.`);
  };

  useEffect(() => {
    const findToken = async () => {
      try {
        const chain = Object.values(chainData).find(
          (data) => data.chainId === chainId
        );
        if (!chain) {
          console.error("Chain not found for chainId:", chainId);
          return;
        }

        if (token.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
          const formattedAmountOut = (Number(amount) / 10 ** 18).toFixed(4);
          setAmount(formattedAmountOut);
          setToken(chain.nativeToken);
        } else if (token.toLowerCase() === chain.USDC?.contractAddress.toLowerCase()) {
          setToken(chain.USDC);
          const formattedAmountOut = (Number(amount) / 10 ** chain.USDC.decimals).toFixed(4);
          setAmount(formattedAmountOut);
        } else if (token.toLowerCase() === chain.wrappedBTC?.contractAddress.toLowerCase()) {
          setToken(chain.wrappedBTC);
          const formattedAmountOut = (Number(amount) / 10 ** chain.wrappedBTC.decimals).toFixed(4);
          setAmount(formattedAmountOut);
        } else if (token.toLowerCase() === chain.wrappedETH?.contractAddress.toLowerCase()) {
          setToken(chain.wrappedETH);
          const formattedAmountOut = (Number(amount) / 10 ** chain.wrappedETH.decimals).toFixed(4);
          setAmount(formattedAmountOut);
        }
      } catch (err) {
        console.error("Error fetching token data:", err);
      }
    };

    findToken();
  }, [token, chainId, amount]);

  const handlePayNow = () => {
    router.push({
      pathname: "/(pay)/inAppPay/[chainId]/[token]/[amount]/[reciever]/[paymentId]",
      params: {
        chainId: 10,
        token: token,
        amount,
        reciever: recieverAddress,
        paymentId: id,
      },
    });
    setModalVisible(false); // Close modal after navigation
  };

  return (
    <>
      {/* Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.cardContent}>
          {tokenInfo?.image ? (
            <Image
              source={
                typeof tokenInfo?.image === "string"
                  ? { uri: tokenInfo.image }
                  : tokenInfo.image
              }
              style={styles.tokenImage}
            />
          ) : (
            <View style={[styles.tokenImage, styles.placeholderImage]}>
              <ThemedText style={styles.placeholderText}>?</ThemedText>
            </View>
          )}
          <View style={styles.cardDetails}>
            <ThemedText style={styles.senderText}>
              From: {truncateString(userId)}
            </ThemedText>
            <ThemedText style={styles.amountText}>
              {readableAmount || "Loading..."} {tokenInfo?.symbol || ""}
            </ThemedText>
            <ThemedText style={styles.messageText}>
              {truncateMessage(message ||'this is a payment request')}
            </ThemedText>
          </View>
          <Ionicons
            name={status ? "checkmark-circle" : "alert-circle"}
            size={24}
            color={status ? "#00C853" : "#FFA500"} // Green for paid, orange for pending
          />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Payment Request Details</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.row}>
                <ThemedText style={styles.label}>From:</ThemedText>
                <View style={styles.copyContainer}>
                  <ThemedText style={styles.value}>{truncateString(userId)}</ThemedText>
                  <TouchableOpacity onPress={() => copyToClipboard(userId)}>
                    <Ionicons name="copy-outline" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Amount:</ThemedText>
                <ThemedText style={styles.value}>
                  {readableAmount || "Loading..."} {tokenInfo?.symbol || ""}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Message:</ThemedText>
                <ThemedText style={styles.value}>{message}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Date:</ThemedText>
                <ThemedText style={styles.value}>{date}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Status:</ThemedText>
                <View style={styles.statusContainer}>
                  <Ionicons
                    name={status ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={status ? "#00C853" : "#D32F2F"}
                  />
                  <ThemedText
                    style={[styles.value, status ? styles.statusPaid : styles.statusPending]}
                  >
                    {status ? "Paid" : "Pending"}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>ID:</ThemedText>
                <View style={styles.copyContainer}>
                  <ThemedText style={styles.value}>{truncateString(id)}</ThemedText>
                  <TouchableOpacity onPress={() => copyToClipboard(id)}>
                    <Ionicons name="copy-outline" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
              {transactionHash && (
                <View style={styles.row}>
                  <ThemedText style={styles.label}>Tx Hash:</ThemedText>
                  <View style={styles.copyContainer}>
                    <ThemedText style={styles.value}>{truncateString(transactionHash)}</ThemedText>
                    <TouchableOpacity onPress={() => copyToClipboard(transactionHash)}>
                      <Ionicons name="copy-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {!status && inAppPay === true && (
              <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                <ThemedText style={styles.payButtonText}>Pay Now</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#000",
  },
  placeholderImage: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "#A0A0A0",
  },
  cardDetails: {
    flex: 1,
  },
  senderText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginVertical: 2,
  },
  messageText: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalBody: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0A0A0",
  },
  value: {
    fontSize: 14,
    color: "#fff",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusPaid: {
    color: "#00C853",
  },
  statusPending: {
    color: "#D32F2F",
  },
  copyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  payButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});