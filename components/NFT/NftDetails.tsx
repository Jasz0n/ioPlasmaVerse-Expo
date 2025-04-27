import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DirectListing, EnglishAuction, useMarketplaceData } from "@/constants/marketProvider";
import { client } from "@/constants/thirdweb";
import { ADDRESS_ZERO, defineChain, getContract } from "thirdweb";
import { getNFT, ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import { Attribute, UNISWAP_CONTRACTS2 } from "@/constants/types";
import axios from "axios";
import { resolveScheme } from "thirdweb/storage";
import NFTSection from "./NftSection";

const { width, height } = Dimensions.get("window");

type ContractMetadata = {
  id: bigint;
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  vrm_file?: string;
  attributes: Attribute[];
};

type NFTData = {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
  listing?: DirectListing;
  auction?: EnglishAuction;
};

interface ProductCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFTData;
}

const ProductCardModal: React.FC<ProductCardModalProps> = ({ isOpen, onClose, nft }) => {
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const [chainName, setChainName] = useState<string>("");
  const [nativeCurrency, setNativeCurrency] = useState<string>("");
  const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
    id: 1n,
    name: "",
    description: "",
    image: "",
    attributes: [],
  });
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const { validListings, validAuctions, ScMarketListing } = useMarketplaceData();
  const [loading, setLoading] = useState(true);

  const directListing = useMemo(
    () =>
      validListings?.find(
        (l: any): l is DirectListing =>
          l.assetContractAddress === nft.contractAddress &&
          BigInt(l.tokenId) === nft.tokenId
      ),
    [validListings, nft.contractAddress, nft]
  );

  const auctionListing = useMemo(
    () =>
      validAuctions?.find(
        (l: any): l is EnglishAuction =>
          l.assetContractAddress.toLowerCase() === nft.contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === nft.tokenId
      ),
    [validAuctions, nft]
  );

  const handleReadNft = useCallback(async () => {
    try {
      setLoading(true);
      const chainData = Object.values(UNISWAP_CONTRACTS2).find(
        (data) => data.chainId === nft.chainId
      );

      const url = `https://www.ioplasmaverse.com/api/nft/getNFT/${nft.chainId}/${nft.contractAddress}/${directListing?.tokenId || auctionListing?.tokenId || nft.tokenId.toString()}`;
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

      setCurrentNFT(data.nft);

      if (chainData) {
        setChainName(chainData.chainName);
        setNativeCurrency(chainData.nativeToken.symbol);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setLoading(false);
    }
  }, [nft]);

  useEffect(() => {
    handleReadNft();
  }, [handleReadNft]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <ThemedView style={styles.container}>
              {/* NFT Image */}
              {currentNFT.image ? (
                <Image
                  source={{
                    uri: `${resolveScheme({
                      client,
                      uri: currentNFT.image,
                    })}`,
                  }}
                  style={styles.nftImage}
                  resizeMode="contain"
                />
              ) : (
                <ThemedView style={styles.placeholderImage}>
                  <ThemedText>No Image</ThemedText>
                </ThemedView>
              )}

              {/* NFT Section */}
              {currentNFT ? (
                <NFTSection
                  chainId={nft.chainId}
                  contractAddress={nft.contractAddress}
                  ownerAddress={ownerAddress || ""}
                  currentNFT={currentNFT}
                  ranking={null}
                  rarityInfo={""}
                  tokenUriImage={tokenUriImage}
                  listingId={
                    BigInt(directListing?.id || "0") ||
                    BigInt(auctionListing?.id || "0") ||
                    0n
                  }
                  price={directListing?.pricePerToken || auctionListing?.minimumBidAmount || "0"}
                />
              ) : (
                <ThemedView style={styles.placeholderImage}>
                  <ThemedText>loading</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Fully opaque dark background
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    width: width,
    height: height,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  nftImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 16,
  },
  placeholderImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: "#00C4B4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00C4B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProductCardModal;