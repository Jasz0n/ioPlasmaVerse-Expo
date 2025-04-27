import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NftGrid } from "./NftGrid";
import { ContractCard } from "./NftCollectionCard";
import OwnedNftsGrid from "./OwnedNftGrid";
import { NftContract } from "./saveContract";
import { Link, useRouter } from "expo-router";

// NftContractCollection Component
const NftContractCollection: React.FC<{
  contractAddress: string;
  chainId: number;
  onBack: () => void;
}> = ({ contractAddress, chainId, onBack }) => {
  return (
    <ThemedView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          Collection: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </ThemedText>
      </View>

      {/* NFT Grid with Pagination */}
      <NftGrid
        contractAddress={contractAddress}
        chainId={chainId}
      />
    </ThemedView>
  );
};

// Main NftGalery Component
export default function NftGalery() {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const [uniqueContracts, setUniqueContracts] = useState<NftContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<NftContract | null>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const [loading , setLoading] = useState(false);
  const router = useRouter();
  // Fetch valid listings and auctions from context

  // Update screen width on dimension changes (e.g., rotation)
  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Determine layout based on screen width
  const isTablet = screenWidth >= 600;
  const cardWidth = isTablet ? "48%" : "100%";

  /* ---------------------------------------------------------------
     Fetch NFT Listings & Auctions
  --------------------------------------------------------------- */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const url = `https://www.ioplasmaverse.com/api/nft/getContractList?chainId=0`;
        const response = await fetch(url);
        console.log("url", url);
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch NFTs. HTTP Status: ${response.status}`);
          throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data || !data.contracts) {
          console.log("No contracts found in response:", data);
          return;
        }
        
        // Map the API response to NftContract format
        const fetchedContracts: NftContract[] = data.contracts.map((contract: any) => ({
          address: contract.contract_address.toString(),
          chainId: Number(contract.chain_id),
          type: contract.type,
          typeBase: contract.type_base,
          title: contract.title,
          description: contract.description,
          thumbnailUrl: contract.thumbnail_url,
          explorer: contract.explorer,
          social_urls: contract.social_urls ? {
            x: contract.social_urls.x,
            telegram: contract.social_urls.telegram,
            website: contract.social_urls.website,
            discord: contract.social_urls.discord,
            github: contract.social_urls.github
          } : undefined
        }));

        // Set the unique contracts
        setUniqueContracts(fetchedContracts);
        setLoading(false)
      } catch (error) {
        console.error("Error fetching contracts:", error);
      }
    };

    fetchData();
  }, []); // Added dependencies

  

  /* ---------------------------------------------------------------
     Render Contract Cards
  --------------------------------------------------------------- */
  const renderContractCards = () => {
    if (uniqueContracts.length === 0) {
      return <ThemedText style={styles.emptyText}>No contracts found.</ThemedText>;
    }

    return uniqueContracts.map((contract) => (
      <View key={`${contract.address}-${contract.chainId}`} style={[styles.cardContainer, { width: cardWidth }]}>
        <ContractCard
          contractAddresse={contract.address}
          chainId={contract.chainId}
          onPress={() =>
            router.push({
              pathname: "/(app)/(authenticated)/(collection)/galery/[chainId]/[contractAddress]",
              params: {
                chainId: contract.chainId,
                contractAddress: contract.address,
              },
            })
          }
          contract={contract}
        />
      </View>
    ));
  };


  if (loading) {
      return (
        <ThemedView >
          <ActivityIndicator size="large" color="#007AFF" />
        </ThemedView>
      );
    }
    

  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  return (
    <ThemedView style={styles.container}>
      {/* Tab Buttons */}
      

      {/* Conditionally Render Content */}
      {selectedContract ? (
        <NftContractCollection
          contractAddress={selectedContract.address}
          chainId={selectedContract.chainId}
          onBack={() => setSelectedContract(null)}
        />
      ) : (
        <View style={styles.nftGrid}>
          {renderContractCards()}
        </View>
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
});