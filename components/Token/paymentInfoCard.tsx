import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Clipboard,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { chainData, Token } from "@/constants/types";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { Ionicons } from "@expo/vector-icons";

interface BalanceCardProps {
  id: string;
  amount: string;
  date: string;
  status: boolean;
  transactionHash: string | null;
  chainId: number;
  token: string;
}

export function PaymentInfo({
  id,
  amount,
  date,
  status,
  transactionHash,
  chainId,
  token,
}: BalanceCardProps) {
  const [readableAmount, setAmount] = useState<string | null>(null);
  const [tokenInfo, setToken] = useState<Token | null>(null);

  const truncateString = (str: string, startLen: number = 6, endLen: number = 4) => {
    if (str.length <= startLen + endLen) return str;
    return `${str.slice(0, startLen)}...${str.slice(-endLen)}`;
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

  return (
    <ThemedView style={styles.card}>
      <View style={styles.contentContainer}>
        {/* Token Image */}
        {tokenInfo?.image ? (
            <Image source={
                            typeof tokenInfo?.image === 'string'
                              ? { uri: tokenInfo.image }
                              : Array.isArray(tokenInfo.image) || typeof tokenInfo.image === 'number'
                              ? tokenInfo.image
                              : tokenInfo.image 
                          } style={styles.tokenImage} />
          
        ) : (
          <View style={[styles.tokenImage, styles.placeholderImage]}>
            <ThemedText style={styles.placeholderText}>?</ThemedText>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Amount:</ThemedText>
            <ThemedText style={styles.value}>
              {readableAmount || "Loading..."} {tokenInfo?.symbol || ""}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Date:</ThemedText>
            <ThemedText style={styles.value}>
              {new Date(date).toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Status:</ThemedText>
            <View style={styles.statusContainer}>
              <Ionicons
                name={status ? "checkmark-circle" : "close-circle"}
                size={20}
                color={status ? "#00C853" : "#D32F2F"} // Green for paid, red for pending
                style={styles.statusIcon}
              />
              <ThemedText style={[styles.value, status ? styles.statusPaid : styles.statusPending]}>
                {status ? "Paid" : "Pending"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>ID:</ThemedText>
            <View style={styles.copyContainer}>
              <ThemedText style={styles.value}>{truncateString(id)}</ThemedText>
              <TouchableOpacity onPress={() => copyToClipboard(id)}>
                <Ionicons name="copy-outline" size={16} color="#007AFF" style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>
          {transactionHash && (
            <View style={styles.row}>
              <ThemedText style={styles.label}>Tx Hash:</ThemedText>
              <View style={styles.copyContainer}>
                <ThemedText style={styles.value}>{truncateString(transactionHash)}</ThemedText>
                <TouchableOpacity onPress={() => copyToClipboard(transactionHash)}>
                  <Ionicons name="copy-outline" size={16} color="#007AFF" style={styles.copyIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', // Dark background to match the dApp theme
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333', // Subtle border for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenImage: {
    width: 48, // Match the size of other components
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#555', // Subtle border to match other components
    backgroundColor: '#000', // Black background for the image
  },
  placeholderImage: {
    backgroundColor: '#333', // Darker placeholder for dark theme
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    color: "#A0A0A0", // Light gray for placeholder text
  },
  detailsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12, // Increased spacing for better readability
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: '#A0A0A0', // Light gray for labels
  },
  value: {
    fontSize: 14,
    color: '#fff', // White for values
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 6,
  },
  statusPaid: {
    color: '#00C853', // Green for "Paid"
  },
  statusPending: {
    color: '#D32F2F', // Red for "Pending"
  },
  copyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyIcon: {
    marginLeft: 8,
  },
});