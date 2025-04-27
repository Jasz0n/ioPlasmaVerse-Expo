import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useActiveAccount } from "thirdweb/react";
import { ADDRESS_ZERO, defineChain } from "thirdweb";
import { DirectListing, EnglishAuction } from "thirdweb/extensions/marketplace";
import Stake from "./stake";
import { NFTdata } from "./nftData";
import Events from "./events";
import EventsTokenId from "./events";
import ListingSection from "./listingButton";
import ProfileData from "../User/Userinformation";
import { ContractMetadata, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { ScListing, useMarketplaceData } from "@/constants/marketProvider";
import { resolveScheme } from "thirdweb/storage";
import { client } from "@/constants/thirdweb";

type Props = {
  tokenId: bigint;
  chainId: number;
  contractAddress: string;
};

export default function NFTSection({ contractAddress, chainId, tokenId }: Props) {
  const account = useActiveAccount();
  const [tab, setTab] = useState<"direct" | "auction" | "user" | "events" | "stake" | "nft">("nft");
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const [chainName, setChainName] = useState<string>("");
  const [nativeCurrency, setNativeCurrency] = useState<string>("");
  const [nft, setNFT] = useState<ContractMetadata | null>(null);
  const [marketplaceAddress, setMarketplaceAddress] = useState<string>("");
  const { validListings, validAuctions, ScMarketListing } = useMarketplaceData();
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------------
     Memoized Data
  --------------------------------------------------------------- */
  const directListing = useMemo(
    () =>
      validListings?.find(
        (l: any): l is DirectListing =>
          l.assetContractAddress === contractAddress &&
          BigInt(l.tokenId) === tokenId &&
          l.chainId === chainId
      ),
    [validListings, contractAddress, tokenId, chainId]
  );
  const auctionListing = useMemo(
    () =>
      validAuctions?.find(
        (l: any): l is EnglishAuction =>
          l.assetContractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === tokenId &&
          l.chainId === chainId
      ),
    [validAuctions, contractAddress, tokenId, chainId]
  );
  const SCListing = useMemo(
    () =>
      ScMarketListing?.find(
        (l: any): l is ScListing =>
          l.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === tokenId
      ),
    [ScMarketListing, contractAddress, tokenId]
  );

  const NETWORK = defineChain(chainId);
  const currentNFT = nft;

  /* ---------------------------------------------------------------
     Fetch NFT Data & Metadata
  --------------------------------------------------------------- */
  const handleReadNft = useCallback(async () => {
    try {
      setLoading(true);
      const chainData = Object.values(UNISWAP_CONTRACTS2).find(
        (data) => data.chainId === chainId
      );

        const url = `https://www.ioplasmaverse.com/api/nft/getNFT/${chainId}/${contractAddress}/${directListing?.tokenId || auctionListing?.tokenId || tokenId.toString()}`;
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

        setNFT(data.nft);
      
      if (chainData) {
        setChainName(chainData.chainName);
        setNativeCurrency(chainData.nativeToken.symbol);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenId, chainId, currentNFT, directListing, auctionListing]);

  useEffect(() => {
    handleReadNft();
  }, [chainId, contractAddress,tokenId]);

  /* ---------------------------------------------------------------
     Compute listingId
  --------------------------------------------------------------- */
  const listingId = directListing?.id
    ? BigInt(directListing.id)
    : auctionListing?.id
    ? BigInt(auctionListing.id)
    : BigInt(0);

  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Tab Navigation */}
      {nft && nft.image &&  (
              <View style={styles.imageContainer}>

                  <Image
                    source={{
                      uri: `${resolveScheme({
                        client,
                        uri: nft.image,
                      })}`,
                    }}
                    style={styles.nftImage}
                    resizeMode="contain"
                  />
                </View>

              )}
      <View
        style={styles.tabContainer}
      >

        

        <TouchableOpacity
          style={[styles.tab, tab === "nft" && styles.tabActive]}
          onPress={() => setTab("nft")}
        >
          <ThemedText
            style={[styles.tabText, tab === "nft" && styles.tabTextActive]}
          >
            NFT Data
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "user" && styles.tabActive]}
          onPress={() => setTab("user")}
        >
          <ThemedText
            style={[styles.tabText, tab === "user" && styles.tabTextActive]}
          >
            NFT Owner
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "events" && styles.tabActive]}
          onPress={() => setTab("events")}
        >
          <ThemedText
            style={[styles.tabText, tab === "events" && styles.tabTextActive]}
          >
            NFT Events
          </ThemedText>
        </TouchableOpacity>
        {account?.address.toLowerCase() === nft?.owner.toLowerCase() && (
          <>
            <TouchableOpacity
              style={[styles.tab, tab === "direct" && styles.tabActive]}
              onPress={() => setTab("direct")}
            >
              <ThemedText
                style={[styles.tabText, tab === "direct" && styles.tabTextActive]}
              >
                Listing
              </ThemedText>
            </TouchableOpacity>
            {currentNFT && tokenId && contractAddress.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540" && (
              <TouchableOpacity
                style={[styles.tab, tab === "stake" && styles.tabActive]}
                onPress={() => setTab("stake")}
              >
                <ThemedText
                  style={[styles.tabText, tab === "stake" && styles.tabTextActive]}
                >
                  Stake
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {tab === "nft" && currentNFT ? (
          <NFTdata
            marketplaceAddress={marketplaceAddress}
            chainId={chainId}
            currentNFT={currentNFT}
            contractAddress={contractAddress}
            tokenId={BigInt(currentNFT.id)}
            ranking={nft.ranking || "0"}
            rarityInfo={nft.ranking || "0"}
          />
        ) : tab === "nft" ? (
          <ThemedText>No NFT data available</ThemedText>
        ) : null}

        {tab === "stake" && currentNFT && tokenId && contractAddress.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540" ? (
          <Stake tokenId={tokenId.toString()} />
        ) : tab === "stake" ? (
          <ThemedText>Staking not available</ThemedText>
        ) : null}

        {tab === "user" && (
          <ProfileData
            ownerAddresse={nft?.owner || ""}
            contractAddress={contractAddress}
            tokenId={tokenId}
            currentNFT={currentNFT}
            chainId={chainId}
            tokenUriImage={tokenUriImage}
          />
        )}

        {tab === "events" && (
          <View>
            {chainId === 4689 ? (
              <Events
                contractAddress={contractAddress || ""}
                chainId={chainId}
                tokenId={tokenId}
              />
            ) : (
              <EventsTokenId
                contractAddress={contractAddress || ""}
                chainId={chainId}
                tokenId={tokenId}
              />
            )}
          </View>
        )}

        {tab === "direct" && tokenId && marketplaceAddress ? (
          <ListingSection
            currentNFT={currentNFT}
            nativeCurrency={nativeCurrency || ""}
            contractAddress={contractAddress || ""}
            tokenId={tokenId.toString()}
            listingId={listingId}
            price={directListing?.pricePerToken || auctionListing?.minimumBidAmount || "0"}
            chainId={chainId}
            marketplaceAddress={marketplaceAddress}
          />
        ) : tab === "direct" ? (
          <ThemedText>No listing data available</ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#0294fe",
  },
  tabText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#0294fe",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});