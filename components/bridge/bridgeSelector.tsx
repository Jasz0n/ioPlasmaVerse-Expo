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
import TokenListModal from "../Token/tokenList";
import { Token } from "@/constants/currency";

type TokenBridgeSelectorProps = {
  tokens: Token[];
  amount?: string;
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
      placeholderTextColor="#777"
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
  const borderColor = useSharedValue("#666");
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    borderColor.value = "#00C4B4";
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
    borderColor.value = "#666";
  };
  

  return (
    <Animated.View style={[styles.tokenSelector, animatedStyle]}>
      <TouchableOpacity
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
          <>
          <Image
                        source={selectedToken?.image as ImageSourcePropType}
                        style={styles.tokenImage}
                      />
          <ThemedText style={styles.tokenSelectorText}>{selectedToken?.symbol}</ThemedText>
          </>
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
  const percentages = [25, 50, 75, 100];
  const borderColors = percentages.map(() => useSharedValue("#666"));
  const scales = percentages.map(() => useSharedValue(1));

  const handlePressIn = (index: number) => {
    scales[index].value = withTiming(0.95, { duration: 100 });
    borderColors[index].value = "#00C4B4";
  };

  const handlePressOut = (index: number) => {
    scales[index].value = withTiming(1, { duration: 100 });
    borderColors[index].value = "#666";
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
      {percentages.map((percent, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scales[index].value }],
          borderColor: borderColors[index].value,
        }));

        return (
          <Animated.View key={percent} style={[styles.percentageButton, animatedStyle]}>
            <TouchableOpacity
              onPress={() => handlePercentageClick(percent)}
              onPressIn={() => handlePressIn(index)}
              onPressOut={() => handlePressOut(index)}
              activeOpacity={0.7}
              accessibilityLabel={`Set ${percent}% of balance`}
            >
              <ThemedText style={styles.percentageButtonText}>{percent}%</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};



const TokenBridgeSelector: FC<TokenBridgeSelectorProps> = ({
  tokens,
  amount:value,
  selectedToken,
  symbol,
  onAddToken,
  onSelect,
  label,
}) => {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [amounts, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const amount = value || amounts;
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

        onSelect={(token) => {
          onSelect(token, amount);
          setModalVisible(false);
        } } onAddToken={onAddToken} symbol={symbol}      />
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
    backgroundColor: "#252525",
    borderWidth: 1,
    borderColor: "#BBB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBB",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tokenSelector: {
    paddingVertical: 10,
    width: 90,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#666",
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tokenImage: {
    
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#777",
  },
  tokenImagePlaceholder: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    backgroundColor: "#777",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  tokenSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#BBB",
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
    marginTop: 8,
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
    marginTop: 8,
    paddingHorizontal: 4,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#666",
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  percentageButtonText: {
    fontSize: 14,
    color: "#DDD",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#666",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
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
    borderColor: "#666",
    padding: 10,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#444",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#666",
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
    borderColor: "#666",
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