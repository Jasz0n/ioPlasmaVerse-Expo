import React, { FC, useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { Ionicons } from "@expo/vector-icons"; // For icons (replacing react-icons)
import QRCode from "react-native-qrcode-svg"; // For QR code (replacing qrcode.react)
import { NftInformation } from "./NftInformation";
import { NftAttributes } from "./NFTAttributes";

// Get screen width for responsive design
const { width } = Dimensions.get("window");
const isSmallScreen = width <= 1024; // Replace useMediaQuery with Dimensions

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
  currentNFT: any;
  ranking: any;
  rarityInfo: any;
  chainId: number;
  marketplaceAddress?: string;
  nativeCurrency?: string;
};

export const NFTdata: FC<INFTCardProps> = ({
  contractAddress,
  tokenId,
  chainId,
  currentNFT,
  ranking,
  rarityInfo,
  marketplaceAddress,
  nativeCurrency,
}) => {
  const QRLink = `https://www.ioplasmaverse.com/NftGalerie/${chainId}/${contractAddress}#${tokenId}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`Copied: ${text}`);
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        {/* QR Code (Hidden on small screens) */}
        {!isSmallScreen && (
          <View style={styles.qrContainer}>
            <QRCode
              value={QRLink}
              size={120}
              backgroundColor="transparent"
              color="#fff"
            />
            <TouchableOpacity
              style={styles.qrIcon}
              onPress={() => copyToClipboard(QRLink)}
            >
              <Ionicons name="clipboard-outline" size={18} color="#a8dadc" />
            </TouchableOpacity>
          </View>
        )}

        {/* NFT Name */}
        <ThemedText style={styles.title}>
          {currentNFT.name || "Unknown NFT"}
        </ThemedText>

        {/* Ranking (if applicable) */}
        {(contractAddress.toLowerCase() === "0xc52121470851d0cba233c963fcbb23f753eb8709" ||
          contractAddress.toLowerCase() === "0xce300b00aa9c066786d609fc96529dbedaa30b76") &&
          ranking && (
            <>
              <ThemedText style={styles.label}>Rank:</ThemedText>
              <ThemedText style={styles.value}>#{ranking}</ThemedText>
            </>
          )}

        {/* Token ID */}
        <ThemedText style={styles.label}>Token ID:</ThemedText>
        <ThemedText style={styles.value}>{tokenId.toString() || "Unknown"}</ThemedText>

        {/* Contract Address */}
        <ThemedText style={styles.label}>Contract Address:</ThemedText>
        <TouchableOpacity onPress={() => copyToClipboard(contractAddress)}>
          <ThemedText style={[styles.value, styles.contractAddress]}>
            {contractAddress || "Unknown"}
          </ThemedText>
        </TouchableOpacity>

        {/* Rarity Info (if applicable) */}
        {contractAddress === "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00" && rarityInfo && (
          <>
            <ThemedText style={styles.label}>Rarity:</ThemedText>
            <ThemedText style={styles.value}>{rarityInfo.name || "Unknown"}</ThemedText>
            <ThemedText style={styles.label}>APY:</ThemedText>
            <ThemedText style={styles.value}>{rarityInfo.APY}</ThemedText>
            <ThemedText style={styles.label}>Mining Rate:</ThemedText>
            <ThemedText style={styles.value}>{rarityInfo.returns}</ThemedText>
          </>
        )}

        {/* NFT Description */}
        <ThemedText style={styles.label}>Description:</ThemedText>
        <ThemedText style={styles.value}>
          {currentNFT.description || "No description available"}
        </ThemedText>

        {/* Check out complete Collection */}
        <View style={styles.collectionLinkContainer}>
          <ThemedText style={styles.label}>Check out complete Collection</ThemedText>
          <TouchableOpacity
            onPress={() => {
              // In React Native, we can't use window.open directly
              // You can use Linking to open the URL
              const url = `/NftGalerie/${chainId}/${contractAddress}#${tokenId}`;
              console.log("Opening URL:", url); // Replace with Linking.openURL(url) if needed
            }}
          >
            <Ionicons name="open-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* NFT Information */}
        {currentNFT && (
          <NftInformation
            marketplaceAddress={marketplaceAddress}
            contractAddress={contractAddress || ""}
            tokenId={tokenId}
            chainId={chainId}
          />
        )}

        {/* Attributes Section */}
        <View style={styles.divider} />
        {currentNFT && Array.isArray(currentNFT.attributes) && (
          <>
            <ThemedText style={styles.label}>Attributes:</ThemedText>
            
              <NftAttributes nft={currentNFT} contractAddress={contractAddress} />
            
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Transparent matching theme
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)", // Subtle cyan border
    borderRadius: 12,
    padding: 24,
    position: "relative",
  },
  qrContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: "#0294fe",
    alignItems: "center",
  },
  qrIcon: {
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    color: "#a8dadc",
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: "#a8dadc",
    marginBottom: 8,
  },
  contractAddress: {
    // React Native doesn't support word-break, but we can use flexWrap
    flexWrap: "wrap",
  },
  collectionLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#2d2d44",
    marginVertical: 12,
  },
});