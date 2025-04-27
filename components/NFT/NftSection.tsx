import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { useActiveAccount } from "thirdweb/react";
import { ADDRESS_ZERO, getContract, toUnits } from "thirdweb";
import { DirectListing, EnglishAuction, Offer } from "thirdweb/extensions/marketplace";

import Stake from "./stake";
import { NFTdata } from "./nftData";
import Events from "./events";
import EventsTokenId from "./events";
import ListingSection from "./listingButton";
import ProfileData from "../User/Userinformation";

type Props = {
  tokenId?: string;
  chainId: number;
  contractAddress: string;
  ownerAddress: string;
  currentNFT: any;
  ranking: any;
  rarityInfo: any;
  tokenUriImage: string;
  listingId: bigint;
  price: string;
  marketplaceAddress?: string;
  nativeCurrency?: string;
};

export default function NFTSection({
  contractAddress,
  listingId,
  nativeCurrency,
  price,
  chainId,
  tokenId,
  ownerAddress,
  currentNFT,
  marketplaceAddress,
  ranking,
  rarityInfo,
  tokenUriImage,
}: Props) {
  const account = useActiveAccount();
  const [tab, setTab] = useState<"direct" | "auction" | "user" | "events" | "stake" | "nft">("nft");

  return (
    <ThemedView style={styles.container}>
      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
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
        {account?.address.toLowerCase() === ownerAddress.toLowerCase() && (
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
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer}>
        {tab === "nft" && currentNFT  && (
          <NFTdata
            marketplaceAddress={marketplaceAddress}
            chainId={chainId}
            currentNFT={currentNFT}
            contractAddress={contractAddress}
            tokenId={BigInt(currentNFT.id)}
            ranking={ranking}
            rarityInfo={rarityInfo}
          />
        )}
        {tab === "stake" && currentNFT && tokenId && contractAddress.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540" && (
          <Stake tokenId={tokenId} />
        )}
        {tab === "user"  && (
          <ProfileData
            ownerAddresse={ownerAddress}
            contractAddress={contractAddress}
            tokenId={BigInt(currentNFT.id)}
            currentNFT={currentNFT}
            chainId={chainId}
            tokenUriImage={tokenUriImage}
          />
        )}
        {tab === "events"  && (
          <View>
            {chainId === 4689 && (
              <Events
                contractAddress={contractAddress || ""}
                chainId={chainId}
                tokenId={BigInt(currentNFT.id)}
              />
            )}
            {chainId != 4689 && (
              <EventsTokenId
                contractAddress={contractAddress || ""}
                chainId={chainId}
                tokenId={BigInt(currentNFT.id)}
              />
            )}
          </View>
        )}
        {tab === "direct" && tokenId && marketplaceAddress && (
          <ListingSection
            currentNFT={currentNFT}
            nativeCurrency={nativeCurrency || ""}
            contractAddress={contractAddress || ""}
            tokenId={tokenId}
            listingId={listingId}
            price={price}
            chainId={chainId}
            marketplaceAddress={marketplaceAddress}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Match your dark theme
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