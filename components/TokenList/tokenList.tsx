import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Token } from "@/constants/types";
import { balanceOf, decimals, totalSupply } from "thirdweb/extensions/erc20";
import { ADDRESS_ZERO, defineChain, getContract, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import CoinGeckoChart from "../dex/chart";

interface TokenListProps {
  chainId: number;
  symbol: string;
  tokenList: (Token & {
    priceChange24h?: string;
    factory_address?: string;
    WETH9?: string;
    pairAddress?: string;
  })[];
}

const fetchTotalSupply = async (contractAddress: string, chainId: number) => {
  const NETWORK = defineChain(chainId);
  const contract = getContract({
    address: contractAddress.toString() || "",
    client,
    chain: NETWORK,
  });

  let supply: bigint = 0n;
  console.log("Contract object:", contract);

  try {
    const supplyData = await totalSupply({ contract });
    const tokenDecimals = await decimals({ contract });

    if (supplyData === undefined || supplyData === null) {
      throw new Error("Failed to fetch total supply from the contract.");
    }
    supply = supplyData;

    console.log("Supply from totalSupply helper function:", supply);

    const balanceBurn = await balanceOf({
      contract,
      address: "0x000000000000000000000000000000000000dead",
    });
    if (balanceBurn !== undefined && balanceBurn !== null) {
      supply -= balanceBurn;
    }

    if (
      chainId === 4689 &&
      contractAddress === "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880"
    ) {
      const balanceBurn2 = await balanceOf({
        contract,
        address: "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880",
      });
      if (balanceBurn2 !== undefined && balanceBurn2 !== null) {
        supply -= balanceBurn2;
      }

      const balanceBurn3 = await balanceOf({
        contract,
        address: "0xfe9d3f83e4796c70cc7f64e7e2bf90ac23a58370",
      });
      if (balanceBurn3 !== undefined && balanceBurn3 !== null) {
        supply -= balanceBurn3;
      }
    }

    const formattedAmountOut = (
      (Number(supply) * 1.02) /
      10 ** (tokenDecimals || 18)
    ).toFixed(6);
    return {
      totalSupply: formattedAmountOut,
    };
  } catch (error) {
    console.error("Error in fetchTotalSupplysAlina:", error);
    throw error;
  }
};

const TokenList: React.FC<TokenListProps> = ({ chainId, tokenList, symbol }) => {
  const [updatedTokens, setUpdatedTokens] = useState<
    (Token & { priceChange24h?: string; factory_address?: string; WETH9?: string; pairAddress?: string })[]
  >(tokenList);
  const [sortedTokens, setSortedTokens] = useState<
    (Token & { priceChange24h?: string; factory_address?: string; WETH9?: string; pairAddress?: string })[]
  >(tokenList);
  const [sortKey, setSortKey] = useState<string>("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);

  useEffect(() => {
    const updateTokenListWithTotalSupply = async () => {
      setLoading(true);
      setError(null);

      try {
        const updatedTokensWithSupply = await Promise.all(
          tokenList.map(async (token) => {
            try {
              let formattedAmountOut = 0;
              if (token.contractAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS) {
                const { totalSupply } = await fetchTotalSupply(token.contractAddress.toString(), chainId);
                formattedAmountOut = parseFloat(totalSupply);
              }
              const priceUsd = parseFloat(token.price || "0");
              const marketCapUsd = (formattedAmountOut * priceUsd).toFixed(2);

              return {
                ...token,
                totalSupply: formattedAmountOut.toString(),
                marketCup: marketCapUsd,
              };
            } catch (error) {
              console.log(
                `Failed to fetch total supply for ${token.symbol}: ${(error as Error).message}`
              );
              return token;
            }
          })
        );

        setUpdatedTokens(updatedTokensWithSupply);
      } catch (error) {
        console.error("Failed to update tokens:", error);
        setError("Failed to fetch token data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    updateTokenListWithTotalSupply();
  }, [tokenList, chainId]);

  useEffect(() => {
    const sorted = [...updatedTokens].sort((a, b) => {
      const getValue = (token: Token) => {
        switch (sortKey) {
          case "price":
            return parseFloat(token.price || "0");
          case "volume":
            return parseFloat(token.volume || "0");
          case "marketCup":
            return parseFloat(token.marketCup || "0");
          case "totalReverse":
            return parseFloat(token.totalReverse || "0");
          default:
            return 0;
        }
      };

      const valueA = getValue(a);
      const valueB = getValue(b);

      return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
    });

    setSortedTokens(sorted);
  }, [updatedTokens, sortKey, sortOrder]);

  const handleSortChange = (value: string) => {
    setSortKey(value);
    setSortOrder("desc");
    setShowSortPicker(false);
  };

  const renderTokenItem = ({ item }: { item: Token }) => {
    const isHotToken =
      (item.volume && parseFloat(item.volume) > 10000000) ||
      (item.marketCup && parseFloat(item.marketCup) > 1000000000);
    const imageSource = typeof item.image === "string" ? { uri: item.image } : item.image;

    return (
      <TouchableOpacity
        style={styles.tokenRow}
        onPress={() => {
          setSelectedToken(item);
          setShowModal(true);
        }}
      >
        <View style={styles.tokenRowContent}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image source={imageSource} style={styles.tokenImage} resizeMode="contain" />
            ) : (
              <View style={[styles.tokenImage, styles.placeholderImage]} />
            )}
          </View>
          <View style={styles.tokenInfo}>
            <ThemedText style={styles.tokenName}>
              {item.name} ({item.symbol})
            </ThemedText>
            {item.price && (
              <ThemedText style={styles.tokenPrice}>
                ${parseFloat(item.price).toFixed(6)}
              </ThemedText>
            )}
          </View>
          {isHotToken && (
            <View style={styles.hotBadge}>
              <ThemedText style={styles.hotBadgeText}>🔥 Hot</ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Token List</ThemedText>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortPicker(true)}
        >
          <ThemedText style={styles.sortButtonText}>Sort by ...</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C4B4" />
          <ThemedText style={styles.loadingText}>Loading token data...</ThemedText>
        </View>
      ) : error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : sortedTokens.length === 0 ? (
        <ThemedText style={styles.noDataText}>No tokens found.</ThemedText>
      ) : (
        <FlatList
          data={sortedTokens}
          renderItem={renderTokenItem}
          keyExtractor={(item, index) => `${item.contractAddress}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Sort Picker Modal */}
      <Modal
        visible={showSortPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortPicker(false)}
        >
          <View style={styles.sortPickerContainer}>
            <Picker
              selectedValue={sortKey}
              style={styles.picker}
              onValueChange={(itemValue: string) => handleSortChange(itemValue)}
            >
              <Picker.Item label="Sort by Price" value="price" />
              <Picker.Item label="Sort by 24h Volume" value="volume" />
              <Picker.Item label="Sort by Market Cap" value="marketCup" />
              <Picker.Item label="Sort by Liquidity" value="totalReverse" />
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Token Details Modal */}
      {selectedToken && (
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {selectedToken.name} ({selectedToken.symbol})
                </ThemedText>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[
                  { label: "Price", value: selectedToken.price ? `$${parseFloat(selectedToken.price).toFixed(6)}` : "N/A" },
                  { label: "Balance", value: selectedToken.balance ? `${parseFloat(selectedToken.balance).toFixed(4)} ${selectedToken.symbol}` : "N/A" },
                  { label: "Value", value: selectedToken.value ? `$${parseFloat(selectedToken.value).toFixed(2)}` : "N/A" },
                  { label: "Total Supply", value: selectedToken.totalSupply ? parseFloat(selectedToken.totalSupply).toLocaleString() : "N/A" },
                  { label: "24h Volume", value: selectedToken.volume ? `$${parseFloat(selectedToken.volume).toLocaleString()}` : "N/A" },
                  { label: "Market Cap", value: selectedToken.marketCup ? `$${parseFloat(selectedToken.marketCup).toLocaleString()}` : "N/A" },
                  { label: "Liquidity", value: selectedToken.totalReverse ? `$${parseFloat(selectedToken.totalReverse).toLocaleString()}` : "N/A" },
                  { label: "CoinGecko ID", value: selectedToken.coinGeckoId || "N/A" },
                  { label: "Top Pools", value: selectedToken.topPools?.join(", ") || "N/A" },
                ]}
                renderItem={({ item }) => (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>{item.label}:</ThemedText>
                    <ThemedText style={styles.detailValue}>{item.value}</ThemedText>
                  </View>
                )}
                keyExtractor={(item) => item.label}
                ListFooterComponent={
                  <View style={styles.chartContainer}>
                    <CoinGeckoChart
                      Token={selectedToken || ""}
                      symbol={symbol}
                      poolAddress={selectedToken.topPools}
                    />
                  </View>
                }
              />
            </View>
                    
          </View>
        </Modal>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  sortButton: {
    backgroundColor: "#3A3A3A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#FFF",
  },
  listContent: {
    paddingBottom: 16,
  },
  tokenRow: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  tokenRowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    marginRight: 12,
  },
  tokenImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  placeholderImage: {
    backgroundColor: "#555",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  tokenPrice: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 4,
  },
  hotBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#a8dadc",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "600",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#f5f5f5",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortPickerContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    width: "80%",
    padding: 8,
  },
  picker: {
    color: "#FFF",
  },
  modalContent: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    width: "90%",
    height: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#BBB",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#FFF",
    flex: 1,
    textAlign: "right",
  },
  chartContainer: {
    marginTop: 16,
  },
});

export default TokenList;