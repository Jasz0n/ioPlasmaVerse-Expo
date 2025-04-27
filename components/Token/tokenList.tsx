import React, { FC, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ImageSourcePropType,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { Token } from "@/constants/currency";
import ActionButton from "../ActionButton"; // Import ActionButton to match RoutesModal

type TokenListModalProps = {
  visible: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelect: (token: Token) => void;
  onAddToken: (token: Token) => void;
  symbol: string;
};

const TokenListModal: FC<TokenListModalProps> = ({
  visible,
  onClose,
  tokens,
  onSelect,
  onAddToken,
  symbol,
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch token data from GeckoTerminal API
  const fetchTokenData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${symbol}/tokens/${search}`;
      console.log('Fetching token data from:', apiUrl);

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
        chainId: tokens[0]?.chainId || 1,
        contractAddress: search?.toString() || "",
        name: attributes.name,
        symbol: attributes.symbol,
        decimals: Number(attributes.decimals),
        image: attributes.image_url,
        balance: "0",
      };
      console.log('Fetched token:', token);
      onAddToken(token);
      setSearch("");
    } catch (err) {
      console.error("Error fetching token data:", err);
      setError("Failed to fetch token. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render each token item in the list
  const renderTokenItem = ({ item }: { item: Token }) => (
    <TouchableOpacity
      style={styles.tokenItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      accessible
      accessibilityLabel={`Select ${item.symbol} token, balance ${item.balance || "0"}`}
    >
      {item.image && typeof item.image === "string" ? (
        <Image
          source={{ uri: item.image }}
          style={styles.tokenImage}
          resizeMode="contain"
        />
      ) : (
         <Image
                                source={item?.image as ImageSourcePropType}
                                style={styles.tokenImage}
                              />
      )}
      <View style={styles.tokenInfo}>
        <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
        <ThemedText style={styles.tokenDetails}>
          {item.symbol} - Balance: {item.balance || "0"}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>Select a Token</ThemedText>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter token address or search..."
              placeholderTextColor="#BBB"
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search tokens"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={fetchTokenData}
              disabled={loading}
              accessibilityLabel="Search for token"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="search" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

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

          {/* Close Button */}
          <ActionButton
            title="Close"
            onPress={onClose}
            accessibilityLabel="Close token list modal"
          />
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Match RoutesModal
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400, // Match RoutesModal
    maxHeight: "80%",
    backgroundColor: "#1E1E1E", // Match RoutesModal
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333", // Match RoutesModal
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 18, // Match RoutesModal
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Slightly lighter than modal background
    borderWidth: 1,
    borderColor: "#333", // Match modal border
    borderRadius: 12, // Softer corners
    padding: 12,
    color: "#FFF",
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  tokenList: {
    marginBottom: 12, // Match RoutesModal
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "#333", // Match modal border
  },
  tokenImage: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFF",
  },
  tokenDetails: {
    fontSize: 12,
    color: "#BBB", // Match RoutesModal secondary text
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13, // Match RoutesModal
    fontWeight: "400",
    color: "#BBB", // Match RoutesModal
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 13, // Match RoutesModal
    color: "#FF6B6B", // Match RoutesModal
    textAlign: "center",
    marginBottom: 20,
  },
});

export default TokenListModal;