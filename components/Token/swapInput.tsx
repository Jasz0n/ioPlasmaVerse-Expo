import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { client } from "@/constants/thirdweb";
import { Token } from "@/constants/types";
import { ADDRESS_ZERO, defineChain, eth_getBalance, getContract, getRpcClient, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import { useActiveAccount } from "thirdweb/react";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";

const SwapInput = ({
  type,
  max,
  value,
  setValue,
  tokenList,
  setDropdownOpen,
  onSelectToken,
  selectedToken,
}: {
  type: "native" | "token";
  max: string;
  value: string;
  setValue: (value: string) => void;
  tokenList: Token[];
  setDropdownOpen: (type: "native" | "token") => void;
  onSelectToken: (token: Token) => void;
  selectedToken?: Token;
}) => {
  const account = useActiveAccount();
  const scale = useSharedValue(1); // For button press animation

  // Handle manual input change
  const handleAmount = (value: string) => {
    setValue(value);
  };

  // Handle percentage button clicks
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

      const amount = percent === 100
        ? formattedAmountOut
        : formattedAmountOut * (percent / 100);

      setValue(amount.toFixed(6));
    } catch (error) {
      console.error("Error fetching balance for percentage:", error);
    }
  };

  // Handle button press animation
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Calculate token value in USD
  const tokenValueInUSD = selectedToken?.price && value
    ? (parseFloat(value) * parseFloat(selectedToken.price)).toFixed(2)
    : "0.00";

  return (
    <ThemedView style={styles.swapInputContainer}>
      {/* Token Selector and Input Row */}
      <View style={styles.swapInputRow}>
        {selectedToken && typeof selectedToken.image === "string" && (
          <Image
            source={{ uri: selectedToken.image }}
            style={styles.tokenImage}
            resizeMode="contain"
          />
        )}
        <TextInput
          style={styles.swapInput}
          value={value}
          onChangeText={handleAmount}
          placeholder={`Enter ${type === "native" ? "From" : "To"} Amount`}
          placeholderTextColor="#666"
          keyboardType="numeric"
          accessibilityLabel={`Enter ${type} amount`}
        />
        <Animated.View style={[animatedButtonStyle]}>
          <TouchableOpacity
            style={styles.tokenSelectorButton}
            onPress={() => setDropdownOpen(type)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
            accessibilityLabel="Select token"
          >
            {selectedToken ? (
              <View style={styles.tokenSelectorContent}>
                <ThemedText style={styles.tokenSymbol}>
                  {selectedToken.symbol}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.tokenSelectorText}>Select Token</ThemedText>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Balance and Value Row */}
      <View style={styles.detailsRow}>
        <ThemedText style={styles.balanceText}>
          Balance: {max || "0"} {selectedToken?.symbol || ""}
        </ThemedText>
        {selectedToken?.price && (
          <ThemedText style={styles.valueText}>
            ~${tokenValueInUSD} USD
          </ThemedText>
        )}
      </View>

      {/* Percentage Buttons */}
      <View style={styles.percentageButtons}>
        {[25, 50, 75, 100].map((percent) => (
          <Animated.View key={percent} style={[animatedButtonStyle]}>
            <TouchableOpacity
              style={styles.percentageButton}
              onPress={() => handlePercentageClick(percent)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              accessibilityLabel={`Set ${percent}% of balance`}
            >
              <ThemedText style={styles.percentageButtonText}>
                {percent}%
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  swapInputContainer: {
    padding: 12, // Slightly tighter padding
    borderRadius: 16, // Softer corners
    backgroundColor: "#1E1E1E",
    marginVertical: 6,
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
  swapInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tokenImage: {
    width: 32, // Slightly larger for clarity
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#555",
  },
  swapInput: {
    flex: 1,
    height: 50,
    color: "#FFF",
    fontSize: 18, // Bolder input text
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  tokenSelectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "linear-gradient(135deg, #3A3A3A, #2A2A2A)", // Subtle gradient
    borderWidth: 1,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "700", // Bolder for emphasis
    color: "#FFF",
  },
  tokenSelectorText: {
    fontSize: 14,
    color: "#888",
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
});

export default SwapInput;
