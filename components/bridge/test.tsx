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
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { Token } from "@/constants/types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { client } from "@/constants/thirdweb";
import {
  ADDRESS_ZERO,
  defineChain,
  eth_getBalance,
  getContract,
  getRpcClient,
  NATIVE_TOKEN_ADDRESS,
} from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import { useActiveAccount } from "thirdweb/react";

type TokenBridgeSelectorProps = {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token, amount: string) => void;
  onAddToken: (token: Token) => void;
  label: string;
  symbol: string;
};

// Reusable TokenInput component for amount input
const TokenInput: FC<{
  amount: string;
  onChange: (text: string) => void;
  error: string | null;
}> = ({ amount, onChange, error }) => (
  <View style={styles.amountContainer}>
    <TextInput
      style={styles.amountInput}
      placeholder="Enter amount"
      placeholderTextColor="#666"
      value={amount}
      onChangeText={onChange}
      keyboardType="numeric"
      accessibilityLabel="Enter amount"
    />
    {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
  </View>
);

// Reusable TokenDropdown component for token selection
const TokenDropdown: FC<{
  selectedToken: Token | null;
  onPress: () => void;
}> = ({ selectedToken, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.tokenSelector}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityLabel="Select token"
      >
        {selectedToken && typeof selectedToken.image === "string" && selectedToken.image ? (
          <>
            <Image
              source={{ uri: selectedToken.image }}
              style={styles.tokenImage}
              resizeMode="contain"
            />
            <ThemedText style={styles.tokenSymbol}>{selectedToken.symbol}</ThemedText>
          </>
        ) : (
          <ThemedText style={styles.tokenSelectorText}>Select Token</ThemedText>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Reusable PercentageButtons component for quick amount selection
const PercentageButtons: FC<{
  selectedToken: Token | null;
  setAmount: (amount: string) => void;
}> = ({ selectedToken, setAmount }) => {
  const account = useActiveAccount();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePercentageClick = async (percent: number) => {
    if (!selectedToken || !account) return;

    try {
      let formattedAmountOut: number;

      if (selectedToken.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
        const rpcRequest = getRpcClient({ client, chain: defineChain(selectedToken.chainId) });
        const balanceNative = await eth_getBalance(rpcRequest, {
          address: account.address || ADDRESS_ZERO,
        });
        formattedAmountOut = Number(balanceNative) / 10 ** selectedToken.decimals;
      } else {
        const userBalance = await balanceOf({
          contract: getContract({
            client,
            chain: defineChain(selectedToken.chainId || 1),
            address: selectedToken.contractAddress || ADDRESS_ZERO,
          }),
          address: account.address || ADDRESS_ZERO,
        });
        formattedAmountOut = Number(userBalance) / 10 ** (selectedToken.decimals || 1);
      }

      const amount = percent === 100 ? formattedAmountOut : formattedAmountOut * (percent / 100);
      setAmount(amount.toFixed(6));
    } catch (error) {
      console.error("Error fetching balance for percentage:", error);
    }
  };

  return (
    <View style={styles.percentageButtons}>
      {[25, 50, 75, 100].map((percent) => (
        <Animated.View key={percent} style={[animatedStyle]}>
          <TouchableOpacity
            style={styles.percentageButton}
            onPress={() => handlePercentageClick(percent)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
            accessibilityLabel={`Set ${percent}% of balance`}
          >
            <ThemedText style={styles.percentageButtonText}>{percent}%</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

// Reusable TokenListModal component for token selection modal
const TokenListModal: FC<{
  visible: boolean;
  onClose: () => void;
  tokens: Token[];
  search: string;
  onSearchChange: (text: string) => void;
  onFetchToken: () => void;
  loading: boolean;
  onSelect: (token: Token) => void;
}> = ({ visible, onClose, tokens, search, onSearchChange, onFetchToken, loading, onSelect }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const renderTokenItem = ({ item }: { item: Token }) => (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.tokenItem}
        onPress={() => onSelect(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityLabel={`Select ${item.symbol} token`}
      >
        {typeof item.image === "string" && item.image ? (
          <Image source={{ uri: item.image }} style={styles.tokenImage} resizeMode="contain" />
        ) : (
          <View style={styles.tokenImagePlaceholder} />
        )}
        <View style={styles.tokenInfo}>
          <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
          <ThemedText style={styles.tokenDetails}>
            {item.symbol} - Balance: {item.balance || "0"}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select a Token</ThemedText>
            <Animated.View style={[animatedStyle]}>
              <TouchableOpacity
                onPress={onClose}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={22} color="#BBB" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tokens"
              placeholderTextColor="#666"
              value={search}
              onChangeText={onSearchChange}
            />
            <Animated.View style={[animatedStyle]}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={onFetchToken}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                accessibilityLabel="Search tokens"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="search" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <FlatList
            data={tokens}
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
  );
};

const TokenBridgeSelector: FC<TokenBridgeSelectorProps> = ({
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
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

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

  const handleAmountChange = (text: string) => {
    setAmount(text);
    setAmountError(null);

    const num = parseFloat(text);
    if (isNaN(num) || num <= 0) {
      setAmountError("Please enter a valid amount.");
      return;
    }

    if (selectedTokenData) {
      onSelect(selectedTokenData, text);
    }
  };

  const fetchTokenData = async () => {
    setLoading(true);
    setTokenData(null);
    try {
      const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${symbol}/tokens/${search}`;
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
        balance: "0",
        price: "0",
        value: "0",
        totalSupply: "",
        volume: "",
        marketCup: "",
        totalReverse: "",
        coinGeckoId: "",
        topPools: [],
      };
      onAddToken(token);
      setTokenData(token);
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setLoading(false);
    }
  };

  const tokenValueInUSD =
    selectedTokenData?.price && amount
      ? (parseFloat(amount) * parseFloat(selectedTokenData.price)).toFixed(2)
      : "0.00";

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedView style={styles.paper}>
        <View style={styles.inputRow}>
          <TokenDropdown
            selectedToken={selectedTokenData}
            onPress={() => setModalVisible(true)}
          />
          <TokenInput
            amount={amount}
            onChange={handleAmountChange}
            error={amountError}
          />
        </View>
        <View style={styles.detailsRow}>
          <ThemedText style={styles.balanceText}>
            Balance: {selectedTokenData?.balance || "0"} {selectedTokenData?.symbol || ""}
          </ThemedText>
          {selectedTokenData?.price && (
            <ThemedText style={styles.valueText}>~${tokenValueInUSD} USD</ThemedText>
          )}
        </View>
        <PercentageButtons selectedToken={selectedTokenData} setAmount={setAmount} />
      </ThemedView>
      <TokenListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        tokens={filteredTokens}
        search={search}
        onSearchChange={setSearch}
        onFetchToken={fetchTokenData}
        loading={loading}
        onSelect={(token) => {
          onSelect(token, amount);
          setModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#BBB",
    marginBottom: 6,
  },
  paper: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tokenSelector: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#3A3A3A",
    borderWidth: 1,
    borderColor: "#555",
    flexDirection: "row",
    alignItems: "center",
  },
  tokenImage: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#555",
  },
  tokenImagePlaceholder: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    backgroundColor: "#555",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  tokenSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  amountContainer: {
    flex: 1,
    marginLeft: 10,
  },
  amountInput: {
    height: 50,
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 10,
    textAlign: "right",
  },
  amountInputError: {
    borderColor: "#FF6B6B",
  },
  errorText: {
    fontSize: 11,
    color: "#FF6B6B",
    marginTop: 3,
    textAlign: "right",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 4,
  },
  balanceText: {
    fontSize: 13,
    color: "#BBB",
    fontWeight: "400",
  },
  valueText: {
    fontSize: 13,
    color: "#00C4B4",
    fontWeight: "500",
  },
  percentageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#3A3A3A",
    borderWidth: 1,
    borderColor: "#555",
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  percentageButtonText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#333",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    padding: 10,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#3A3A3A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
  },
  tokenList: {
    flexGrow: 0,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#444",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  tokenDetails: {
    fontSize: 13,
    color: "#BBB",
    fontWeight: "400",
  },
  emptyText: {
    fontSize: 13,
    color: "#BBB",
    textAlign: "center",
    marginTop: 16,
  },
});

export default TokenBridgeSelector;