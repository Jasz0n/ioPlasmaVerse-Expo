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
import { NFTCard } from "./NftCard";
import ProductCard from "./NftDetails";
import { DirectListing, EnglishAuction } from "@/constants/marketProvider";
import { ContractMetadata } from "@/constants/types";
import { resolveScheme } from "thirdweb/storage";
import { Ionicons } from "@expo/vector-icons";
import { useModal } from "@/constants/transactionModalProvider";
import { useRouter } from "expo-router";

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

/* ------------------------------------------------------------------
   NftGrid Component
------------------------------------------------------------------ */
export const NftGrid: FC<NftGridProps> = ({ contractAddress, chainId }) => {
  const router = useRouter();
  const [contractData, setContractData] = useState<NftContract | null>(null);
  const [nfts, setNfts] = useState<ContractMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nftLoading, setNftLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const PAGE_SIZE = 20;

  const { openModal } = useModal();

  // Responsive layout
  const { width: screenWidth } = Dimensions.get("window");
  const isTablet = screenWidth >= 600;
  const cardWidth = isTablet ? "48%" : "100%";

  // Thirdweb contract
  const NETWORK = defineChain(chainId);
  const contract = useMemo(
    () =>
      getContract({
        address: contractAddress,
        client,
        chain: NETWORK,
      }),
    [contractAddress, chainId]
  );

  /* ------------------------------------------------------------------
     Fetch NFTs (paginated)
  ------------------------------------------------------------------ */
  const fetchNFTs = useCallback(
    async (page: number) => {
      try {
        setNftLoading(true);
        const url = `https://www.ioplasmaverse.com/api/nft/getNFTs/${chainId}/${contractAddress}?page=${page}&limit=${PAGE_SIZE}&sortOrder=asc&ranking=false`;
        console.log("🔍 Fetching NFTs from:", url);

        const response = await fetch(url);
        if (!response.ok) {
          console.error(`❌ Failed to fetch NFTs. HTTP Status: ${response.status}`);
          throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data) {
          console.log("No data returned from NFT API");
          return;
        }

        const fetchedNfts: ContractMetadata[] = data.nfts;
        setNfts(fetchedNfts);
        console.log("NFTs fetched:", fetchedNfts);

        // If the API returns supply info, use it
        if (data.supply) {
          setTotalSupply(data.supply);
        }
        setNftLoading(false);
      } catch (error: any) {
        console.error("❌ Error in fetchNFTs:", error.message || error);
        throw error;
      }
    },
    [chainId, contractAddress]
  );

  /* ------------------------------------------------------------------
     Fetch Contract Data (metadata + supply)
  ------------------------------------------------------------------ */
  const fetchContractData = useCallback(async () => {
    try {
      setLoading(true);
      const url = `https://www.ioplasmaverse.com/api/nft/getContract/${chainId}/${contractAddress}`;
      console.log("🔍 Fetching contract data from:", url);

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ Failed to fetch contract data. HTTP Status: ${response.status}`);
        throw new Error(`Failed to fetch contract data: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data) {
        console.log("No data returned from contract API");
        return;
      }

      setContractData(data.contract);

      if (data.supply) {
        setTotalSupply(data.supply);
      }
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Error in fetchContractData:", error.message || error);
      setError(error.message);
    }
  }, [chainId, contractAddress]);

  /* ------------------------------------------------------------------
     Lifecycle Effects
  ------------------------------------------------------------------ */
  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  useEffect(() => {
    fetchNFTs(currentPage);
  }, [currentPage, fetchNFTs]);

  /* ------------------------------------------------------------------
     Derived State & Helpers
  ------------------------------------------------------------------ */
  const memoizedValidTotalSupply = useMemo(
    () => contractData?.supplyData?.validTotalSupply ?? 0,
    [contractData]
  );
  const memoizedUniqueOwners = useMemo(
    () => contractData?.supplyData?.uniqueOwners ?? 0,
    [contractData]
  );

  const totalPages = totalSupply > 0 ? Math.ceil(totalSupply / PAGE_SIZE) : 0;

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

  /* ------------------------------------------------------------------
     Social Icons
  ------------------------------------------------------------------ */

  function isSocialKey(key: string): key is SocialKey {
     return ["x", "telegram", "website", "discord", "github"].includes(key);
   }
   const renderSocialIcons = (social_urls: Partial<Record<SocialKey, string>>) => {
     if (!social_urls) return null;
   
     const iconMap: { [key in SocialKey]: any } = {
       x: "logo-twitter",
       telegram: "paper-plane", // Changed from "logo-telegram"
       website: "globe-outline",
       discord: "logo-discord",
       github: "logo-github",
     };
   
     return (
      <View style={styles.socialIconsRow}>
         {Object.entries(social_urls).map(([key, url]) => {
           if (isSocialKey(key)) {
             const iconName = iconMap[key];
             if (url && iconName) {
               return (
                 <TouchableOpacity key={key} onPress={() => Linking.openURL(url)}>
                   <Ionicons name={iconName} size={24} color="#007AFF" />
                 </TouchableOpacity>
               );
             }
           }
           return null;
         })}
       </View>
     );
   };


  /* ------------------------------------------------------------------
     Render NFT Cards
  ------------------------------------------------------------------ */
  const renderNFTCards = () => {
    if (nfts.length === 0) {
      return (
        <ThemedText style={styles.emptyText}>
          No NFTs found in this collection.
        </ThemedText>
      );
    }

    return (
      <View style={styles.nftGrid}>
        {nfts.map((nft) => (
          <View key={nft.id} style={[styles.cardContainer, { width: cardWidth }]}>
            <NFTCard
              tokenId={BigInt(nft.id)}
              contractAddresse={contractAddress}
              chainId={chainId}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(authenticated)/(modal)/(collection)/nft/[chainId]/[contractAddress]/[tokenId]",
                  params: {
                    chainId: chainId ,
                    contractAddress: contractAddress,
                    tokenId: nft.id
                  },
                })
              }              currentNFT={nft}
            />
          </View>
        ))}
      </View>
    );
  };

  /* ------------------------------------------------------------------
     Conditional Rendering
  ------------------------------------------------------------------ */
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* -------------------- Header / Collection Info -------------------- */}
      {contractData && (
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            {contractData.thumbnailUrl && (
              <Image
                source={{
                  uri: resolveScheme({
                    client,
                    uri: contractData.thumbnailUrl || "",
                  }),
                }}
                style={styles.headerImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>
                {contractData.title || "Unnamed Collection"}
              </ThemedText>
              <ThemedText style={styles.headerDescription} numberOfLines={3}>
                {contractData.description || "No description available."}
              </ThemedText>
              {contractData.social_urls && renderSocialIcons(contractData.social_urls)}
            </View>
          </View>
        </View>
      )}

      {/* -------------------- Stats Row -------------------- */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {memoizedValidTotalSupply !== 0 ? memoizedValidTotalSupply : "N/A"}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Valid Total Supply</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {memoizedUniqueOwners !== 0 ? memoizedUniqueOwners : "N/A"}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Unique Owners</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {totalSupply !== 0 ? totalSupply : "N/A"}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Total Supply</ThemedText>
        </View>
      </View>

      {/* -------------------- NFT Cards -------------------- */}
      {nftLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </ThemedView>
      ) : (
        renderNFTCards()
      )}

      {/* -------------------- Pagination -------------------- */}
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

/* ------------------------------------------------------------------
   Styles
------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
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
