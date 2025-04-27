import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ImageSourcePropType,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ADDRESS_ZERO, defineChain, getContract, ThirdwebClient } from "thirdweb";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import { chainData } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";

// Utility to convert balance from raw decimals to readable format
const formatBalance = (balance: string | number, decimals: number): string => {
  try {
    const balanceBigInt = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = balanceBigInt / divisor;
    const fractionalPart = (balanceBigInt % divisor)
      .toString()
      .padStart(decimals, "0")
      .slice(0, 2); // Get first 2 decimal places
    return `${integerPart}.${fractionalPart}`;
  } catch (err) {
    console.error("Error formatting balance:", err);
    return "0.00";
  }
};

// Utility to truncate address
const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface BalanceCardProps {
  address: string; // Token contract address
  client: ThirdwebClient;
  chainId: number;
  balance: number | string; // Raw balance in decimals
}

export function BalanceCardErc20({ balance, address, client, chainId }: BalanceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [chainImage, setChainImage] = useState<string | ImageSourcePropType | undefined>(undefined); // Type as string since it’s always a URI
  const [tokenName, setName] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number>(18); // Default to 18 if not fetched
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);

  const contract = getContract({
    client,
    chain: defineChain(Number(chainId)),
    address: address.toString() || ADDRESS_ZERO,
  });

  // Fetch token metadata and chain image
  useEffect(() => {
    const fetchTokenData = async () => {
      setIsLoading(true);
      try {
        // Find the chain data
        const chain = Object.values(chainData).find(
          (data) => data.chainId === chainId
        );
        if (chain?.nativeToken.image) {
          setChainImage(chain.nativeToken.image as ImageSourcePropType); // Always a string URI
        } else {
          console.warn("No image found for chain:", chainId);
        }

        // Fetch token metadata
        const currencyMetadata = await getCurrencyMetadata({ contract });
        setSymbol(currencyMetadata.symbol || null);
        setName(currencyMetadata.name || null);
        setDecimals(currencyMetadata.decimals || 18);

        // Format the balance
        const readableBalance = formatBalance(balance || "0", currencyMetadata.decimals || 18);
        setFormattedBalance(readableBalance);
      } catch (err) {
        console.error("Failed to fetch token data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (address && client && chainId && balance) {
      fetchTokenData();
    }
  }, [address, client, chainId, balance]);


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      alert(`Copied: ${address}`);
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };
  // Function to copy the contract address to clipboard
 

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  const displayName = tokenName || truncateAddress(address);

  return (
    <ThemedView style={styles.card}>
      <View style={styles.contentContainer}>
        {/* Chain Image */}
        {chainImage ? (
          
                                    <ThemedText style={styles.placeholderText}>?</ThemedText>

        ) : (
          <View style={[styles.tokenImage, styles.placeholderImage]}>
            <ThemedText style={styles.placeholderText}>?</ThemedText>
          </View>
        )}

        {/* Token Info */}
        <View style={styles.tableContainer}>
          <View style={styles.tokenNameContainer}>
            <ThemedText type="defaultSemiBold" style={styles.tokenName}>
              {displayName}
            </ThemedText>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
          {tokenName && (
            <ThemedText type="default" style={styles.contractAddress}>
              {truncateAddress(address)}
            </ThemedText>
          )}
          <ThemedText type="default" style={styles.balanceText}>
            {formattedBalance || "0.00"} {symbol || ""}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
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
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#555",
    backgroundColor: "#000",
  },
  placeholderImage: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    color: "#A0A0A0",
  },
  tableContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  tokenNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 18,
    color: "#fff",
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  contractAddress: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 16,
    color: "#A0A0A0",
  },
});