import React, { useState, useEffect, FC } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DirectListing, EnglishAuction, useMarketplaceData } from "@/constants/marketProvider";
import { NFTCard } from "./NftCard";
import ProductCard from "./NftDetails";
import { useModal } from "@/constants/transactionModalProvider";

type NFTData = {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
  listing?: DirectListing;
  auction?: EnglishAuction;
};

type ListingProps = {
 
  contractAddresse: string;
  chainId: number;
};

export const ListingGridContract: FC<ListingProps> = ({
  contractAddresse,
  chainId,
 
}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "auctions">("listings");
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const { openModal } = useModal();

  // Fetch valid listings and auctions from context
  const { validListings, validAuctions } = useMarketplaceData();

  // Get screen width to determine layout
  const { width: screenWidth } = Dimensions.get("window");
  const isTablet = screenWidth >= 600; // Tablets typically have a width of 600px or more
  const cardWidth = isTablet ? "48%" : "100%"; // 2 columns on tablets, 1 column on phones

  /* ---------------------------------------------------------------
     Fetch NFT Listings & Auctions
  --------------------------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      // Filter listings by contractAddress and chainId
      const listingsData = validListings
        .filter(
          (listing) =>
            listing.assetContractAddress.toLowerCase() === contractAddresse.toLowerCase() &&
            listing.chainId === chainId
        )
        .map((listing) => ({
          tokenId: BigInt(listing.tokenId),
          contractAddress: listing.assetContractAddress,
          chainId: listing.chainId,
          listing,
        }));

      // Filter auctions by contractAddress and chainId
      const auctionsData = validAuctions
        .filter(
          (auction) =>
            auction.assetContractAddress.toLowerCase() === contractAddresse.toLowerCase() &&
            auction.chainId === chainId
        )
        .map((auction) => ({
          tokenId: BigInt(auction.tokenId),
          contractAddress: auction.assetContractAddress,
          chainId: auction.chainId,
          auction,
        }));

      // Combine filtered listings and auctions
      const filteredListing = [...listingsData, ...auctionsData];
      setNftData(filteredListing);
    };

    fetchData();
  }, [validListings, validAuctions, contractAddresse, chainId]);

  /* ---------------------------------------------------------------
     Handle NFT Click
  --------------------------------------------------------------- */
  

  /* ---------------------------------------------------------------
     Render NFT Cards
  --------------------------------------------------------------- */
  const filteredData = nftData.filter((data) =>
    activeTab === "listings" ? data.listing : data.auction
  );

  const renderNFTCards = () => {
    if (filteredData.length === 0) {
      return (
        <ThemedText style={styles.emptyText}>
          No {activeTab === "listings" ? "listings" : "auctions"} found.
        </ThemedText>
      );
    }

    return filteredData.map((item) => (
      <View key={item.tokenId.toString()} style={[styles.cardContainer, { width: cardWidth }]}>
       <NFTCard
            tokenId={BigInt(item.tokenId)} // Convert to bigint
            contractAddresse={item.contractAddress?.toString() || ""}
            chainId={item.chainId}
            onPress={() =>
              openModal({
                type: "productCard",
                nft: {
                  tokenId: BigInt(item.tokenId), // Convert to bigint
                  contractAddress: item.contractAddress?.toString() || "",
                  chainId: item.chainId,
                },
              })
            }
          />
      </View>
    ));
  };

  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  return (
    <ThemedView style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, activeTab === "listings" && styles.buttonActive]}
          onPress={() => setActiveTab("listings")}
        >
          <ThemedText
            style={[styles.buttonText, activeTab === "listings" && styles.buttonTextActive]}
          >
            Direct Listings
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, activeTab === "auctions" && styles.buttonActive]}
          onPress={() => setActiveTab("auctions")}
        >
          <ThemedText
            style={[styles.buttonText, activeTab === "auctions" && styles.buttonTextActive]}
          >
            Auctions
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* NFT Grid */}
      <View style={styles.nftGrid}>
        {renderNFTCards()}
      </View>      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#333",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#555",
  },
  buttonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
  },
  buttonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  nftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  cardContainer: {
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});