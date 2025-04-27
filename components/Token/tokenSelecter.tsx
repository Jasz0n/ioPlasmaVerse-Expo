import React, { FC, useState } from "react";
import { View, TextInput, StyleSheet, Image, Modal, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { defineChain, getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { Token } from "@/constants/currency";


type TokenSelectorProps = {
  amount: string;
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  onAddToken: (token: Token) => void;
  label: string;
  symbol: string;
};

const TokenPaySelector: FC<TokenSelectorProps> = ({
  amount,
  tokens,
  selectedToken,
  symbol,
  onAddToken,
  onSelect,
  label,
}) => {
  const [tokenData, setTokenData] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const account = useActiveAccount();

  // Filter and sort tokens based on search
  const filteredTokens = tokens
    .filter(
      (token) =>
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.contractAddress.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const balanceA = parseFloat(a.balance || "0");
      const balanceB = parseFloat(b.balance || "0");
      return balanceB - balanceA;
    });

  const selectedTokenData =
    tokens.find((token) => token?.contractAddress === selectedToken?.contractAddress) || selectedToken;

  // Fetch token data from GeckoTerminal API
  const fetchTokenData = async () => {
    setLoading(true);
    setTokenData(null);
    try {
      const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${symbol}/tokens/${search}`;
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
        chainId: selectedToken?.chainId || 1,
        contractAddress: search?.toString() || "",
        name: attributes.name,
        symbol: attributes.symbol,
        decimals: Number(attributes.decimals),
        image: attributes.image_url,
      };
      console.log(token);
      onAddToken(token);
      setTokenData(token);
    } catch (error) {
      console.error("Error fetching token data:", error);
      
    } finally {
      setLoading(false);
    }
  };

  // Render each token item in the modal list
  const renderTokenItem = ({ item }: { item: Token }) => (
    <TouchableOpacity
      style={styles.tokenItem}
      onPress={() => {
        onSelect(item);
        setModalVisible(false);
      }}
    >
     {item && typeof item.image === "string" && (
                 <Image
                   source={{ uri: item.image }}
                   style={styles.tokenImage}
                   resizeMode="contain"
                 />
               )}
      <View style={styles.tokenInfo}>
        <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
        <ThemedText style={styles.tokenDetails}>
          {item.symbol} - Ballance: {item.balance || "0"}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Label */}
      <ThemedText style={styles.label}>{label}</ThemedText>

      {/* Main Token Display */}
      <ThemedView style={styles.paper}>
        <View style={styles.tokenDisplay}>
          <ThemedText style={styles.balanceText}>
            Amount: {amount || "0"}
          </ThemedText>
          <TouchableOpacity
            style={styles.tokenSelector}
            onPress={() => setModalVisible(true)}
          >
            {selectedTokenData ? (
              <>
                {selectedTokenData && typeof selectedTokenData.image === "string" && (
                 <Image
                   source={{ uri: selectedTokenData.image }}
                   style={styles.tokenImage}
                   resizeMode="contain"
                 />
               )}
                <ThemedText style={styles.tokenSymbol}>
                  {selectedTokenData.symbol || "Select Token"}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.tokenSymbol}>Select Token</ThemedText>
            )}
            <Ionicons name="chevron-down" size={20} color="#a8dadc" />
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Modal for Token Selection */}
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select a Token</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#a8dadc" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search tokens"
                placeholderTextColor="#a8dadc"
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={fetchTokenData}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#00DDEB" />
                ) : (
                  <Ionicons name="search" size={20} color="#00DDEB" />
                )}
              </TouchableOpacity>
            </View>

            {/* Token List */}
            <FlatList
              data={filteredTokens}
              renderItem={renderTokenItem}
              keyExtractor={(item) => item.contractAddress}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>No tokens found.</ThemedText>
              }
              style={styles.tokenList}
            />
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  tokenImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#a8dadc",
    marginBottom: 8,
  },
  paper: {
    borderWidth: 1,
    borderColor: "#00DDEB",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 16,
  },
  tokenDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: {
    fontSize: 12,
    color: "#a8dadc",
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#00DDEB",
  },
  tokenLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#00DDEB",
    borderRadius: 12,
    marginTop: 100,
    marginHorizontal: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "#00DDEB",
    borderRadius: 25,
    padding: 10,
    color: "#fff",
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
  },
  tokenList: {
    flexGrow: 0,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  tokenDetails: {
    fontSize: 12,
    color: "#a8dadc",
  },
  emptyText: {
    fontSize: 14,
    color: "#a8dadc",
    textAlign: "center",
    marginTop: 20,
  },
});

export default TokenPaySelector;