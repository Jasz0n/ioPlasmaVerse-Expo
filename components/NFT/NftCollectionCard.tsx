import React, { FC, useEffect, useState, useCallback } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useActiveAccount } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { resolveScheme } from "thirdweb/storage";
import { NftContract } from "./saveContract";
import { UNISWAP_CONTRACTS2 } from "@/constants/types";

type INFTCardProps = {
  contractAddresse: string;
  chainId: number;
  onPress?: () => void;
  contract: NftContract;
};

export const ContractCard: FC<INFTCardProps> = ({
  contractAddresse,
  chainId,
  onPress,
  contract,
}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const account = useActiveAccount();
  const [chainName, setChainName] = useState<string>("");
  const [nativeCurrency, setNativeCurrency] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------------
     Memoized Data
  --------------------------------------------------------------- */
  const NETWORK = defineChain(chainId);

  /* ---------------------------------------------------------------
     Fetch Chain Data
  --------------------------------------------------------------- */
  const handleReadData = useCallback(async () => {
    try {
      setLoading(true);
      const chainData = Object.values(UNISWAP_CONTRACTS2).find(
        (data) => data.chainId === chainId
      );

      if (chainData) {
        setChainName(chainData.chainName);
        setNativeCurrency(chainData.nativeToken.symbol);
      }
    } catch (error) {
      console.error("Error fetching chain data:", error);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    handleReadData();
  }, [handleReadData]);

  /* ---------------------------------------------------------------
     Handle Explorer Link
  --------------------------------------------------------------- */
  const handleExplorerPress = () => {
    if (contract.explorer) {
      Linking.openURL(contract.explorer).catch((err) =>
        console.error("Failed to open explorer URL:", err)
      );
    }
  };

  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  if (loading) {
    return (
      <ThemedView style={styles.card}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel="Show contract details"
    >
      {/* Badge with Chain Name and Type */}
      <ThemedView style={styles.badge}>
        <ThemedText style={styles.badgeText}>
          {chainName || "Unknown Chain"} - {contract.type}
        </ThemedText>
      </ThemedView>

      {/* Contract Image */}
      {contract.thumbnailUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `${resolveScheme({
                client,
                uri: contract.thumbnailUrl,
              })}`,
            }}
            style={styles.nftImage}
            resizeMode="cover"
            onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
          />
        </View>
      ) : (
        <View style={[styles.imageContainer, styles.placeholderImage]}>
          <ThemedText style={styles.placeholderText}>No Image</ThemedText>
        </View>
      )}

      {/* Contract Details */}
      <View style={styles.detailsContainer}>
        {/* Contract Title */}
        <ThemedText style={styles.contractName}>
          {contract.title || "Unnamed Contract"}
        </ThemedText>

        {/* Chain and Currency Info */}
        <View style={styles.chainInfo}>
          <ThemedText style={styles.chainText}>
            Chain: {chainName || "N/A"}
          </ThemedText>
          <ThemedText style={styles.currencyText}>
            Currency: {nativeCurrency || "N/A"}
          </ThemedText>
        </View>

        {/* Description */}
        {contract.description && (
          <ThemedText style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {contract.description}
          </ThemedText>
        )}       
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
    overflow: "hidden",
  },
  badge: {
    backgroundColor: "teal",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    margin: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#2A2A2A",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  nftImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#A0A0A0",
    fontSize: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  contractName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  chainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chainText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  currencyText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  description: {
    fontSize: 12,
    color: "#A8DADc",
    textAlign: "center",
    marginBottom: 8,
  },
  explorerButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "center",
    marginBottom: 8,
  },
  explorerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  socialLink: {
    color: "#1E90FF",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});