import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import {
  ADDRESS_ZERO,
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
  toUnits,
} from "thirdweb";
import { isApprovedForAll } from "thirdweb/extensions/erc721";
import { allowance } from "thirdweb/extensions/erc20";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";

import ApprovalButton from "./ApproveButton"; // Assuming this is already converted to React Native
import AuctionListingButton from "./AuctionListingButton"; // Assuming this is already converted to React Native
import DirectListingButton from "./DirectListingButton"; // Assuming this is already converted to React Native
import CancelListingButton from "./CancelListing"; // Assuming this is already converted to React Native
import DirectListingERC20 from "./DirectListingErc20"; // Assuming this is already converted to React Native
import { Ionicons } from "@expo/vector-icons"; // For search icon
import { client } from "@/constants/thirdweb";
import { Token, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { useModal } from "@/constants/transactionModalProvider";

type Props = {
  tokenId?: string;
  contractAddress: string;
  currentNFT: any;
  listingId: bigint;
  chainId: number;
  price: string;
  marketplaceAddress: string;
  nativeCurrency: string;
};

type ListingStep = "approval" | "confirm" | "approvalNative";

const ListingSection = ({
  contractAddress,
  nativeCurrency,
  tokenId,
  currentNFT,
  listingId,
  price,
  chainId,
  marketplaceAddress,
}: Props) => {
  const account = useActiveAccount();
  const [tab, setTab] = useState<"direct" | "auction" | "cancel" | "star" | "offer">("direct");
  const [currencyTab, setCurrencyTab] = useState<"native" | "erc20">("native");
  const [isTokenApproved, setIsTokenApproved] = useState(false);
  const [directListingState, setDirectListingState] = useState({ price: "0" });
  const [auctionListingState, setAuctionListingState] = useState({ minimumBidAmount: "0", buyoutPrice: "0" });
  const [directListingShibaState, setDirectListingShibaState] = useState({ price: "0" });
  const [search, setSearch] = useState("");
  const [tokenData, setTokenData] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [buyingStep, setBuyingStep] = useState<ListingStep>("approval");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const StarCrazy = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880";
  const SC = getContract({ address: StarCrazy, client, chain: defineChain(4689) });

  const handlePriceChange = (value: string) => {
    setDirectListingShibaState({ price: value });
  };

  const address = StarCrazy as `0x${string}`;

  const { data: ERC20Approval } = useReadContract(allowance, {
    contract: SC,
    owner: account?.address || ADDRESS_ZERO,
    spender: address,
  });

  useEffect(() => {
    if (ERC20Approval) {
      setIsTokenApproved(BigInt(ERC20Approval) >= toUnits(directListingShibaState.price, 9));
    }
  }, [ERC20Approval, directListingShibaState.price]);

  const fetchTokenData = async () => {
    setLoading(true);
    setTokenData(null);
    try {
      const chainData = Object.values(UNISWAP_CONTRACTS2).find(
        (data) => data.chainId === chainId
      );

      if (!chainData) {
        Alert.alert("Error", "Chain data not found.");
        return;
      }

      const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${chainData.symbol}/tokens/${search}`;
      console.log(apiUrl);

      const response = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch token data.");
      }

      const data = await response.json();
      const attributes = data?.data?.attributes;

      if (!attributes) {
        throw new Error("Invalid token data returned.");
      }

      const token: Token = {
        chainId: chainId,
        contractAddress: search?.toString() || "",
        name: attributes.name,
        symbol: attributes.symbol,
        decimals: attributes.decimals,
        image: attributes.image_url,
      };
      console.log(token);
      setTokenData(token);
    } catch (error) {
      console.error("Error fetching token data:", error);
      Alert.alert("Error", "Failed to fetch token data. Please check the contract address.");
    } finally {
      setLoading(false);
    }
  };

  const Contract = getContract({ address: contractAddress, client, chain: defineChain(chainId) });
  const { data: hasApproval } = useReadContract(isApprovedForAll, {
    contract: Contract,
    owner: account?.address || ADDRESS_ZERO,
    operator: marketplaceAddress,
  });

  const handleSetApproval2 = async () => {
    if (!account) return;
    const tokenContract = getContract({
      address: "0xec0cd5c1d61943a195bca7b381dc60f9f545a540",
      client,
      chain: defineChain(4689),
    });

    try {
      const tx = await prepareContractCall({
        contract: tokenContract,
        method: "function approve(address to, uint256 tokenId) returns (bool)",
        params: ["0xA800cA984790AD1BE4d7D84a06aDA8BB43DDb082", BigInt(tokenId || "0")],
        gas: 500000n,
        gasPrice: 1000000000000n,
      });

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account,
      });

      Alert.alert("Success", "Approval set successfully!");
    } catch (err) {
      console.error("Error during approval:", err);
      Alert.alert("Error", "Failed to set approval.");
    }
    setBuyingStep("confirm");
  };

  const bidOnToken = async () => {
    if (!account) return;
    try {
      const tokenContract = getContract({
        address: "0xA800cA984790AD1BE4d7D84a06aDA8BB43DDb082",
        client: client,
        chain: defineChain(chainId),
      });

      const price = toUnits(directListingShibaState.price, 18);

      const approveAndCallTx = await prepareContractCall({
        contract: tokenContract,
        method: "function createAlianaSale(uint256 tokenId_, uint256 price)",
        params: [BigInt(tokenId || ""), price],
        gas: 500000n,
      });

      const { transactionHash } = await sendTransaction({
        transaction: approveAndCallTx,
        account,
      });

      Alert.alert("Success", "Token listed successfully!");
    } catch (error) {
      console.error(`Failed to bid on Token ID ${tokenId}:`, error);
      Alert.alert("Error", "Failed to list token.");
    } finally {
      setBuyingStep("approval");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        {/* Custom Tab Selector for Direct, Auction, Cancel, StarCrazy, Offers */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "direct" && styles.activeTab]}
            onPress={() => setTab("direct")}
          >
            <ThemedText style={[styles.tabText, tab === "direct" && styles.activeTabText]}>Direct</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "auction" && styles.activeTab]}
            onPress={() => setTab("auction")}
          >
            <ThemedText style={[styles.tabText, tab === "auction" && styles.activeTabText]}>Auction</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "offer" && styles.activeTab]}
            onPress={() => setTab("offer")}
          >
            <ThemedText style={[styles.tabText, tab === "offer" && styles.activeTabText]}>Offers</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "cancel" && styles.activeTab]}
            onPress={() => setTab("cancel")}
          >
            <ThemedText style={[styles.tabText, tab === "cancel" && styles.activeTabText]}>Cancel Listing</ThemedText>
          </TouchableOpacity>
          {contractAddress.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540" && (
            <TouchableOpacity
              style={[styles.tab, tab === "star" && styles.activeTab]}
              onPress={() => setTab("star")}
            >
              <ThemedText style={[styles.tabText, tab === "star" && styles.activeTabText]}>StarCrazy Listing</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* StarCrazy Listing Tab */}
        {tab === "star" && contractAddress.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540" && (
          <View>
            <ThemedText style={styles.label}>You are about to List Token Id: {tokenId?.toString()}</ThemedText>
            <ThemedText style={styles.label}>Price per Token</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={directListingShibaState.price}
              onChangeText={handlePriceChange}
              placeholder="Enter price"
              placeholderTextColor="#666"
            />
            {buyingStep === "approval" && (
              <TouchableOpacity style={styles.button} onPress={handleSetApproval2}>
                <ThemedText style={styles.buttonText}>Approve Now</ThemedText>
              </TouchableOpacity>
            )}
            {buyingStep === "confirm" && (
              <TouchableOpacity style={styles.button} onPress={bidOnToken}>
                <ThemedText style={styles.buttonText}>List Now</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel Listing Tab */}
        {tab === "cancel" && tokenId && account && listingId > BigInt(1) && (
          <View>
            <CancelListingButton
              chainId={chainId}
              contractAddress={contractAddress}
              account={account}
              listingId={listingId}
              currentNFT={currentNFT}
              price={price}
              tokenId={tokenId}
            />
          </View>
        )}

        {/* Custom Tab Selector for Currency */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currencyTab === "native" && styles.activeTab]}
            onPress={() => setCurrencyTab("native")}
          >
            <ThemedText style={[styles.tabText, currencyTab === "native" && styles.activeTabText]}>
              Native {nativeCurrency}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, currencyTab === "erc20" && styles.activeTab]}
            onPress={() => setCurrencyTab("erc20")}
          >
            <ThemedText style={[styles.tabText, currencyTab === "erc20" && styles.activeTabText]}>ERC20</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Direct Listing Tab */}
        {tab === "direct" && (
          <View style={styles.tabContent}>
            {hasApproval && (
              <>
                <ThemedText style={styles.sectionTitle}>When</ThemedText>
                <ThemedText style={styles.label}>Listing Starts on</ThemedText>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor="#666"
                />
                <ThemedText style={styles.label}>Listing Ends on</ThemedText>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor="#666"
                />
                <ThemedText style={styles.label}>Price per Token</ThemedText>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={directListingState.price}
                  onChangeText={(value) => setDirectListingState({ price: value })}
                  placeholder="Enter price"
                  placeholderTextColor="#666"
                />
                {currencyTab === "erc20" && (
                  <>
                    <ThemedText style={styles.label}>ERC20 Address</ThemedText>
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search tokens"
                        placeholderTextColor="#666"
                      />
                      <TouchableOpacity onPress={fetchTokenData} style={styles.searchIcon}>
                        <Ionicons name="search" size={20} color="#61dafb" />
                      </TouchableOpacity>
                    </View>
                    {tokenData ? (
                      <ThemedText style={styles.tokenInfo}>{tokenData.name}</ThemedText>
                    ) : (
                      <ThemedText style={styles.tokenInfo}>You can use any ERC20 contract addresses</ThemedText>
                    )}
                  </>
                )}
              </>
            )}
            {hasApproval && tokenId && currencyTab === "native" && (
              <DirectListingButton
                marketplaceAddress={marketplaceAddress}
                tokenId={BigInt(tokenId)}
                pricePerToken={directListingState.price}
                listingStart={startDate}
                listingEnd={endDate}
                contractAddress={contractAddress}
                chainId={chainId}
                chainCurrency={nativeCurrency}
              />
            )}
            {hasApproval && tokenId && currencyTab === "erc20" && (
              <DirectListingERC20
                marketplaceAddress={marketplaceAddress}
                tokenId={BigInt(tokenId)}
                currencyAddress={tokenData?.contractAddress.toString() || ""}
                pricePerToken={directListingState.price}
                listingStart={startDate}
                listingEnd={endDate}
                contractAddress={contractAddress}
                chainId={chainId}
              />
            )}
            {!hasApproval && (
              <ApprovalButton
                contractAddress={contractAddress}
                marketplaceAddress={marketplaceAddress}
                chainId={chainId}
              />
            )}
          </View>
        )}

        {/* Auction Listing Tab */}
        {tab === "auction" && (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>When</ThemedText>
            <ThemedText style={styles.label}>Auction Starts on</ThemedText>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#666"
            />
            <ThemedText style={styles.label}>Auction Ends on</ThemedText>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#666"
            />
            <ThemedText style={styles.label}>Allow bids starting from</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={auctionListingState.minimumBidAmount}
              onChangeText={(value) =>
                setAuctionListingState({ ...auctionListingState, minimumBidAmount: value })
              }
              placeholder="Enter minimum bid"
              placeholderTextColor="#666"
            />
            <ThemedText style={styles.label}>Buyout Price</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={auctionListingState.buyoutPrice}
              onChangeText={(value) =>
                setAuctionListingState({ ...auctionListingState, buyoutPrice: value })
              }
              placeholder="Enter buyout price"
              placeholderTextColor="#666"
            />
            {!hasApproval && (
              <ApprovalButton
                contractAddress={contractAddress}
                marketplaceAddress={marketplaceAddress}
                chainId={chainId}
              />
            )}
            {hasApproval && tokenId && (
              <AuctionListingButton
                marketplaceAddress={marketplaceAddress}
                tokenId={BigInt(tokenId)}
                minimumBidAmount={auctionListingState.minimumBidAmount}
                buyoutBidAmount={auctionListingState.buyoutPrice}
                auctionStart={startDate}
                auctionEnd={endDate}
                contractAddress={contractAddress}
                chainId={chainId}
              />
            )}
          </View>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0294fe",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  activeTabText: {
    color: "#0294fe",
  },
  tabContent: {
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#a8dadc",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#e5e5e5",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    color: "#fff",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "#61dafb",
    borderRadius: 24,
    color: "#fff",
  },
  searchIcon: {
    padding: 8,
    marginLeft: 8,
  },
  tokenInfo: {
    fontSize: 14,
    color: "#f5f5f5",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#61dafb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#61dafb",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ListingSection;