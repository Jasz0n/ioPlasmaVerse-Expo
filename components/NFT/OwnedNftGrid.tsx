import React, { FC, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NFTCard } from "./NftCard";
import ProductCard from "./NftDetails";
import { DirectListing, EnglishAuction } from "@/constants/marketProvider";
import { ContractMetadata } from "@/constants/types";
import { useNfts } from "@/constants/NftOwnedProvider";
import { useModal } from "@/constants/transactionModalProvider";

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

const OwnedNftsGrid: FC = () => {
  const { nft: ownedNfts } = useNfts(); // Fetch owned NFTs from the context
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 20; // Number of NFTs per page
  const { openModal } = useModal();

  // Responsive layout
  const { width: screenWidth } = Dimensions.get("window");
  const isTablet = screenWidth >= 600;
  const cardWidth = isTablet ? "48%" : "100%";

  // Pagination logic
  const totalPages = ownedNfts.length > 0 ? Math.ceil(ownedNfts.length / PAGE_SIZE) : 0;
  const paginatedNfts = ownedNfts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const fetchNFTMetadata = (nft: ContractMetadata): NFTData => {
    // Map the ContractMetadata to NFTData for the ProductCard
    return {
      tokenId: BigInt(nft.id),
      contractAddress: nft.contractAddress || "",
      chainId: nft.chainId || 1,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      attributes: nft.attributes,
    };
  };

  

  const renderNFTCards = () => {
    if (ownedNfts.length === 0) {
      return <ThemedText style={styles.emptyText}>No owned NFTs found.</ThemedText>;
    }

    if (paginatedNfts.length === 0) {
      return <ThemedText style={styles.emptyText}>No NFTs on this page.</ThemedText>;
    }

    return paginatedNfts.map((nft) => (
      <View key={`${nft.contractAddress}-${nft.id}`} style={[styles.cardContainer, { width: cardWidth }]}>
        <NFTCard
            tokenId={BigInt(nft.id)} // Convert to bigint
            contractAddresse={nft.contractAddress?.toString() || ""}
            chainId={Number(nft.chainId)}
            onPress={() =>
              openModal({
                type: "productCard",
                nft: {
                  tokenId: BigInt(nft.id), // Convert to bigint
                  contractAddress: nft.contractAddress?.toString() || "",
                  chainId: Number(nft.chainId),
                },
              })
            }
          />
      </View>
    ));
  };

  return (
    <ThemedView style={styles.container}>
      {/* NFT Grid with Pagination */}
      <View style={styles.nftGrid}>
        {renderNFTCards()}
      </View>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ThemedText style={styles.paginationText}>Previous</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </ThemedText>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ThemedText style={styles.paginationText}>Next</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});

export default OwnedNftsGrid;