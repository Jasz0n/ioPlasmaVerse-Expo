import React, { FC, useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Image,
  Linking,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { defineChain, getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { DirectListing, EnglishAuction } from "@/constants/marketProvider";
import { ContractMetadata } from "@/constants/types";
import { resolveScheme } from "thirdweb/storage";
import { Ionicons } from "@expo/vector-icons";
import { useModal } from "@/constants/transactionModalProvider";
import { useLocalSearchParams } from "expo-router";
import { NFTCard } from "@/components/NFT/NftCard";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import NFTSection from "@/components/NFT/Nft";



/* ------------------------------------------------------------------
   Type Definitions
------------------------------------------------------------------ */
type NftContract = {
  address: string;
  chainId: number;
  type: "ERC1155" | "ERC721" | "Marketplace" | "ERC20";
  typeBase: "DefaultNFT";
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  explorer?: string;
  social_urls?: SocialUrls;
  supplyData?: Supply;
};

type Supply = {
  totalSupply?: string;
  validTotalSupply?: string;
  uniqueOwners?: string;
};

type SocialUrls = {
  x?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  github?: string;
};

interface NFTData {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
  listing?: DirectListing;
  auction?: EnglishAuction;
}

type NftGridProps = {
  contractAddress: string;
  chainId: number;
};
type SocialKey = "x" | "telegram" | "website" | "discord" | "github";

export default function NftGalery() {


  const [contractData, setContractData] = useState<NftContract | null>(null);
    const {chainId , contractAddress, tokenId} = useLocalSearchParams();
  
  
 
    
  return (
    <ParallaxScrollView
          headerBackgroundColor={{ light: "#1A1A1A", dark: "#1A1A1A" }}
          headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
        >
    <ThemedView style={styles.container}>
      <NFTSection chainId={Number(chainId)} contractAddress={contractAddress.toString()} tokenId={BigInt(tokenId.toString())} />
    </ThemedView>
    </ParallaxScrollView>
  );
};

/* ------------------------------------------------------------------
   Styles
------------------------------------------------------------------ */
const styles = StyleSheet.create({
  headerImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    flex: 1,
  },
  contractImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  /* Header / Collection Info */
  headerContainer: {
    padding: 16,
    backgroundColor: "#2A2A2A",
    borderBottomWidth: 1,
    borderBottomColor: "#007AFF",
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  /* Social Icons */
  socialIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  socialIcon: {
    color: "#007AFF",
  },

  /* Stats */
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    width: "30%",
    height: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
  },

  /* NFT Grid */
  nftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  cardContainer: {
    marginBottom: 10,
  },

  /* Loading / Error */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF4444",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 20,
  },

  /* Pagination */
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1A1A1A",
  },
  paginationButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  paginationText: {
    fontSize: 16,
    color: "#fff",
  },
  pageInfo: {
    fontSize: 16,
    color: "#A0A0A0",
  },

  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});
