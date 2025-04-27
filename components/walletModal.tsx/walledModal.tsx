import React, { FC, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useNfts } from "@/constants/NftOwnedProvider";
import { useActiveAccount } from "thirdweb/react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { useCurrency } from "@/constants/currency";
import { BalanceCard } from "./ballanceCard";
import { BalanceCardNative } from "./ballanceCardNative";
import { NFTCard } from "../NFT/NftCard";
import { chainData, ContractMetadata } from "@/constants/types";

const { width, height } = Dimensions.get("window");

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletDetailsModal: FC<WalletDetailsModalProps> = ({ isOpen, onClose }) => {
  const { WETH9, chainId, symbol, router: routerPlasma, tokenBalances: tokens, setChainId, setTokenList, updateBalances } = useCurrency();
  const [activeTab, setActiveTab] = useState<"erc20" | "nft">("erc20");
  const account = useActiveAccount();
  const { nft } = useNfts();
  const nftsPerPage = 20;
  const [page, setPage] = useState(1);
  const [selectedChainKey, setSelectedChainKey] = useState<string>('Iotex');

  const paginatedNfts = useMemo(() => {
    const filteredNfts: ContractMetadata[] = nft.filter(
      (nft) => nft.owner.toLowerCase() === account?.address.toLowerCase()
    );

    const start = (page - 1) * nftsPerPage;
    const end = start + nftsPerPage;
    return filteredNfts.slice(start, end);
  }, [nft, page, nftsPerPage, account]);

  const filteredTokenList2 = tokens.filter(
    (token) => token.contractAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
  );

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
              <ThemedText style={styles.title}>Wallet Details</ThemedText>
                <ThemedView style={styles.networkSelectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.networkSelector}>
                        {Object.keys(chainData).map((key) => (
                          <TouchableOpacity
                            key={key}
                            style={[styles.networkButton, selectedChainKey === key && styles.networkButtonActive]}
                            onPress={() => setSelectedChainKey(key)}
                            accessibilityLabel={`Select ${chainData[key].name} network`}
                          >
                            {chainData[key].image ? (
                              <Image
                                source={chainData[key].image}
                                style={[styles.networkImage, selectedChainKey === key && styles.networkImageActive]}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={[styles.networkImage, styles.placeholderImage]}>
                                <ThemedText style={styles.placeholderText}>?</ThemedText>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </ThemedView>

              <View style={styles.balanceCardContainer}>
                {tokens ? (
                  <BalanceCardNative token={tokens[0]} />
                ) : (
                  <ActivityIndicator size="small" color="#00C4B4" />
                )}
              </View>

              <View style={styles.tabContainer}>
                {["erc20", "nft"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabButton,
                      activeTab === tab && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab(tab as "erc20" | "nft")}
                  >
                    <ThemedText
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive,
                      ]}
                    >
                      {tab.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {activeTab === "erc20" && (
                <View style={styles.tabContent}>
                  <ThemedText style={styles.sectionTitle}>ERC20 Balances</ThemedText>
                  {filteredTokenList2.length > 0 ? (
                    filteredTokenList2.map((token) => (
                      <BalanceCard key={token.contractAddress} token={token} />
                    ))
                  ) : (
                    <ThemedText style={styles.noDataText}>
                      No ERC20 tokens found.
                    </ThemedText>
                  )}
                </View>
              )}

              {activeTab === "nft" && (
                <View style={styles.tabContent}>
                  <ThemedText style={styles.sectionTitle}>NFTs</ThemedText>
                  {paginatedNfts.length > 0 ? (
                    paginatedNfts.map((nft, index) => (
                      <View key={index} style={styles.nftItem}>
                        <NFTCard
                          tokenId={BigInt(nft.id)}
                          chainId={nft.chainId || 1}
                          contractAddresse={nft.contractAddress?.toString() || ""}
                        />
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.noDataText}>
                      No NFTs found for this wallet.
                    </ThemedText>
                  )}
                </View>
              )}
            </ThemedView>
          </ScrollView>

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
    backgroundColor: "#1A1A1A",
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
  networkSelectorContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  networkSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkImage: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderRadius: 18,
    borderColor: '#555', // Subtle border for inactive state
    backgroundColor: '#000', // Black background for the image
  },
  networkImageActive: {
    borderColor: '#fff', // White border for active state
  },
  placeholderImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#A0A0A0',
  },
  networkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#2A2A2A',
  },
  networkButtonActive: {
    backgroundColor: '#007AFF',
  },
  networkLabel: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  networkLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 20,
  },
  balanceCardContainer: {
    marginBottom: 24,
    width: "100%", // Ensure the container stretches to full width
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#61dafb",
    marginHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: "#61dafb",
    borderColor: "#61dafb",
  },
  tabText: {
    fontSize: 16,
    color: "#61dafb",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000",
  },
  tabContent: {
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
    marginTop: 16,
  },
  nftItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#61dafb",
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
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
});