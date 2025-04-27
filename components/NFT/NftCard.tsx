import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this
import { useActiveAccount } from "thirdweb/react";
import { Address, ADDRESS_ZERO, defineChain, getContract, isAddress, NFT as NFTType } from "thirdweb";
import { getNFT, ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import axios from "axios";
import { DirectListing, EnglishAuction, ScListing, useMarketplaceData } from "@/constants/marketProvider";
import { ContractMetadata, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { client, contract } from "@/constants/thirdweb";
import { resolveScheme } from "thirdweb/storage";

interface Attribute {
  trait_type: string;
  value: string | number;
  frequency?: string;
  count?: number;
  image?: string;
}

interface RarityData {
  APY: string;
  MiningRate: string;
}

interface Rarities {
  Giga: RarityData;
  Emperor: RarityData;
  King: RarityData;
  Knight: RarityData;
  Soldier: RarityData;
  Minion: RarityData;
}



const rarities: Rarities = {
  Giga: { APY: "25%", MiningRate: "80 SMTX daily" },
  Emperor: { APY: "25%", MiningRate: "50 SMTX daily" },
  King: { APY: "15%", MiningRate: "6 SMTX daily" },
  Knight: { APY: "12%", MiningRate: "4 SMTX daily" },
  Soldier: { APY: "7%", MiningRate: "2 SMTX daily" },
  Minion: { APY: "1%", MiningRate: "1 SMTX daily" },
};

type INFTCardProps = {
  tokenId: bigint;
  contractAddresse: string;
  chainId: number;
  marketplaceAddress?: string;
  onPress?: () => void; // Add onPress prop
  autoShowInfo?: boolean;
  currentNFT?: ContractMetadata;
};

export const NFTCard: FC<INFTCardProps> = ({
  tokenId,
  contractAddresse,
  chainId,
  currentNFT,
  onPress,
}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const account = useActiveAccount();
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const [chainName, setChainName] = useState<string>("");
  const [nativeCurrency, setNativeCurrency] = useState<string>("");
  
  const [nft, setNFT] = useState<ContractMetadata | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const { validListings, validAuctions, ScMarketListing } = useMarketplaceData();
  const [loading, setLoading] = useState(true); // Added for skeleton-like loading

  /* ---------------------------------------------------------------
     Memoized Data
  --------------------------------------------------------------- */
  const directListing = useMemo(
    () =>
      validListings?.find(
        (l: any): l is DirectListing =>
          l.assetContractAddress === contractAddresse &&
          BigInt(l.tokenId) === tokenId &&
          chainId === chainId
      ),
    [validListings, contractAddresse, tokenId, chainId]
  );
  const auctionListing = useMemo(
    () =>
      validAuctions?.find(
        (l: any): l is EnglishAuction =>
          l.assetContractAddress.toLowerCase() === contractAddresse.toLowerCase() &&
          BigInt(l.tokenId) === tokenId &&
          chainId === chainId
      ),
    [validAuctions, contractAddresse, tokenId, chainId]
  );
  const SCListing = useMemo(
    () =>
      ScMarketListing?.find(
        (l: any): l is ScListing =>
          l.contractAddress.toLowerCase() === contractAddresse.toLowerCase() &&
          BigInt(l.tokenId) === tokenId
      ),
    [ScMarketListing, contractAddresse, tokenId]
  );

  const NETWORK = defineChain(chainId);


  const nftData = currentNFT === undefined ? nft : currentNFT

  /* ---------------------------------------------------------------
     Fetch NFT Data & Metadata
  --------------------------------------------------------------- */
  const handleReadNft = useCallback(async () => {
    
    try {
      setLoading(true);
      const chainData = Object.values(UNISWAP_CONTRACTS2).find(
        (data) => data.chainId === chainId
      );
      console.log("currentNft", currentNFT)

      if (!currentNFT)  {
      const url = `https://www.ioplasmaverse.com/api/nft/getNFT/${chainId}/${contractAddresse}/${directListing?.tokenId || auctionListing?.tokenId || tokenId.toString()}`;
      const response = await fetch(url);
      console.log("url", url);

      if (!response.ok) {
        console.error(`❌ Failed to fetch token list. HTTP Status: ${response.status}`);
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data) {
        console.error("❌ Invalid API response structure.");
        throw new Error("Invalid API response structure");
      }

      // Map the API response to ContractMetadata
      // The API response already matches the ContractMetadata interface, including contractAddress and chainId
      

      setNFT(data.nft);
    }
      if (chainData) {
        setChainName(chainData.chainName);
        setNativeCurrency(chainData.nativeToken.symbol);
      }

      
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setLoading(false);
    }
  }, [contractAddresse, tokenId, chainId]);

  useEffect(() => {
    handleReadNft();
  }, [handleReadNft]);

  /* ---------------------------------------------------------------
     Handle Click (for future modal or navigation)
  --------------------------------------------------------------- */

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
      onPress={onPress} // Use the onPress prop instead of handleButtonClickOpen
      accessibilityLabel="Show more info"
    >
    

      {/* Badge */}
      <ThemedView style={styles.badge}>
        <ThemedText style={styles.badgeText}>
          {chainName}
        </ThemedText>
      </ThemedView>

      {/* NFT Image */}
      {nftData && nftData.image &&  (
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `${resolveScheme({
                client,
                uri: nftData.image,
              })}`,
            }}
            style={styles.nftImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Title */}
      <ThemedText style={styles.title}>
        {currentNFT?.name || nft?.name || "Unknown Name"}
      </ThemedText>

      {/* Token ID */}
      <ThemedText style={styles.tokenId}>
        Token ID #{tokenId.toString()}
      </ThemedText>

      {/* Price Container */}
      {contractAddresse ? (
        <View style={styles.priceContainer}>
          {directListing || auctionListing || SCListing ? (
            <View style={styles.priceBox}>
              <ThemedText style={styles.priceLabel}>Price</ThemedText>
              <ThemedText style={styles.priceValue}>
                {directListing && (
                  <>
                    {directListing.currencyContractAddress ===
                    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                      ? `${directListing.pricePerToken} ${nativeCurrency}`
                      : directListing.currencyContractAddress !==
                        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                      ? `${directListing.pricePerToken} ${directListing.symbol}`
                      : "Currency not supported"}
                  </>
                )}
                {SCListing && `${SCListing.price} GFT`}
                {auctionListing &&
                  `${auctionListing.minimumBidCurrencyValue} ${auctionListing.symbol}`}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.priceBoxNotForSale}>
              <ThemedText style={styles.priceLabel}>Price</ThemedText>
              <ThemedText style={styles.priceValue}>Not for sale</ThemedText>
            </View>
          )}
        </View>
      ) : (
        <ActivityIndicator size="small" color="#007AFF" />
      )}

      {/* Description */}
      <ThemedText style={styles.description}>
        {currentNFT?.description || nft?.description || "No description available."}
      </ThemedText>
    </TouchableOpacity>
  );
};

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
    width: "100%",
  },
  collectionInfo: {
    fontSize: 14,
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "teal",
    borderRadius: 4,
    padding: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  nftImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  tokenId: {
    fontSize: 14,
    color: "#a8dadc",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  priceBox: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceBoxNotForSale: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  priceValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  description: {
    fontSize: 12,
    color: "#a8dadc",
    textAlign: "center",
    maxHeight: 40,
    overflow: "hidden",
  },
});