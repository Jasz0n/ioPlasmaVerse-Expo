import React, { useCallback, useEffect, useState } from "react";
import {
  TransactionButton,
  useActiveAccount,
  useActiveWalletChain,
  useSendAndConfirmTransaction,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  sendAndConfirmTransaction,
  defineChain,
  ADDRESS_ZERO,
  NATIVE_TOKEN_ADDRESS as THIRDWEB_NATIVE_TOKEN_ADDRESS,
  toWei,
} from "thirdweb";
import { approve, allowance } from "thirdweb/extensions/erc20";
import { Bridge } from "thirdweb";
import { chainData, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";
import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  FlatList,
  Switch,
  Platform,
} from "react-native";
import { Token, useCurrency } from "@/constants/currency";
import { ThemedView } from "../ThemedView";
import TokenBridgeSelector from "./bridgeSelector";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import ActionButton from "../ActionButton";
import ChainModal from "./chainModal";
import ChainSelectorModal from "../chainSelector.tsx/chainSelector";
import RoutesModal from "../RoutesModal/RoutesModal";
import PaymentDetails from "./paymentDetails";
import RouteItem from "../pay/bridgeRoute";
import { MenuPointHorizontal } from "stream-chat-expo";

type BuyingStep = "approval" | "confirm" | "swap";
type Direction = "from" | "to";

type Route = {
  originToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
  destinationToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
};

const PlasmaBridge: React.FC = () => {
  const { chainData: chainData2, tokenBalances, setChainId, updateBalances, chainId } = useCurrency();
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const switchChain = useSwitchActiveWalletChain();
  const chainInfo = useActiveWalletChain();
    const [bridgeRoute, setBridgeRoute] = useState<Route>();

  const [buyingStep, setBuyingStep] = useState<BuyingStep>("approval");
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [amountIn, setAmountIn] = useState("0");
  const [amountOut, setAmountOut] = useState("0.1");
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState<Token | null>(tokenBalances[0] || null);
  const [direction, setDirection] = useState<Direction>("from");
  const [selectedChainId, setSelectedChainId] = useState<number>(10);
  const [isChainModalVisible, setIsChainModalVisible] = useState(false);
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routesPage, setRoutesPage] = useState(0);
  const ROUTES_PER_PAGE = 10;

  const [originToken, setOriginToken] = useState<Token | null>(null);
  const [destinationToken, setDestinationToken] = useState<Token | null>(null);
  const [originChainId, setOriginChainId] = useState<number>(Number(chainId || 1));
  const [destinationChainId, setDestinationChainId] = useState<number>(10);
  const selectedChain = Object.values(chainData).find((chain) => chain.chainId === destinationChainId);

  const NETWORK = defineChain(originChainId || 1);
  const plasmaRouter = Object.values(UNISWAP_CONTRACTS2).find((data) => data.chainId === originChainId)?.router || ADDRESS_ZERO;

  // Animation states for Destination Chain selector
  const chainScale = useSharedValue(1);
  const chainBorderColor = useSharedValue("#666");
  const chainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chainScale.value }],
    borderColor: chainBorderColor.value,
  }));

  const handleChainPressIn = () => {
    chainScale.value = withTiming(0.95, { duration: 100 });
    chainBorderColor.value = "#00C4B4";
  };

  const handleChainPressOut = () => {
    chainScale.value = withTiming(1, { duration: 100 });
    chainBorderColor.value = "#666";
  };

  // Animation states for Bridge Direction toggles
  const fromScale = useSharedValue(1);
  const fromBorderColor = useSharedValue("#666");
  const toScale = useSharedValue(1);
  const toBorderColor = useSharedValue("#666");

  const fromAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fromScale.value }],
    borderColor: fromBorderColor.value,
    backgroundColor: direction === "from" ? "#DDD" : "#444",
  }));

  const toAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toScale.value }],
    borderColor: toBorderColor.value,
    backgroundColor: direction === "to" ? "#00C4B4" : "#444",
  }));

  const handleFromPressIn = () => {
    fromScale.value = withTiming(0.95, { duration: 100 });
    fromBorderColor.value = "#00C4B4";
  };

  const handleFromPressOut = () => {
    fromScale.value = withTiming(1, { duration: 100 });
    fromBorderColor.value = "#666";
  };

  const handleToPressIn = () => {
    toScale.value = withTiming(0.95, { duration: 100 });
    toBorderColor.value = "#00C4B4";
  };

  const handleToPressOut = () => {
    toScale.value = withTiming(1, { duration: 100 });
    toBorderColor.value = "#666";
  };

  const updateChain = async (chainId: number) => {
    updateBalances(chainId);
    setChainId(chainId);
  };

  useEffect(() => {
    const chainData = Object.values(UNISWAP_CONTRACTS2).find((data) => data.chainId === Number(chainId || 1));
    if (chainData && tokenBalances.length > 0) {
      setOriginChainId(chainData.chainId);
      setSelectedToken(tokenBalances[0]);
    }
  }, [chainId, tokenBalances]);

  useEffect(() => {
    const checkApproval = async () => {
      if ( !originToken || originToken.contractAddress === THIRDWEB_NATIVE_TOKEN_ADDRESS) return;
      try {
        if (originToken.contractAddress.toLowerCase() === THIRDWEB_NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          setBuyingStep("confirm");
          return;
        }
        if (!account) return;
        const approvalAmount = await allowance({
          contract: getContract({ client, chain: NETWORK, address: originToken.contractAddress }),
          owner: account.address,
          spender: plasmaRouter,
        });
        const parsedAmountIn = BigInt(Math.round(Number(amountIn) * 10 ** originToken.decimals));
        setBuyingStep(approvalAmount >= parsedAmountIn ? "confirm" : "approval");
      } catch (error) {
        console.error("Error checking token approval:", error);
      }
    };
    checkApproval();
  }, [account, amountIn, originToken, NETWORK, plasmaRouter]);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!selectedToken) {
        return;
      }
      try {
        setRoutesError(null);
        const options: any = {
          limit: ROUTES_PER_PAGE,
          offset: routesPage * ROUTES_PER_PAGE,
          client,
        };
        if (direction === "from") {
          options.originTokenAddress = selectedToken.contractAddress;
          options.originChainId = chainId;
          options.destinationChainId = destinationChainId;
        } else {
          options.destinationTokenAddress = selectedToken.contractAddress;
          options.destinationChainId = chainId;
          options.originChainId = destinationChainId;
        }
        const filteredRoutes = await Bridge.routes(options);
        setRoutes(filteredRoutes);
      } catch (err: any) {
        console.error("Error fetching routes:", err);
        setRoutesError("Failed to fetch routes: " + (err.message || "Unknown error"));
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, [account, selectedToken, direction, selectedChainId, routesPage]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!originToken || !destinationToken || direction === "to") {
        return;
      }
      try {
        setQuoteError(null);
        const sellAmount = parseFloat(amountIn);
        const sellAmountWei = BigInt(Math.round(sellAmount * 10 ** originToken.decimals));
        const quoteResult = await Bridge.Sell.quote({
          originChainId,
          originTokenAddress: originToken.contractAddress,
          destinationChainId,
          destinationTokenAddress: destinationToken.contractAddress,
          sellAmountWei,
          client,
        });
        console.log("destinationToken", destinationToken)
        const amountOutFormatted = Number(quoteResult.destinationAmount) / 10 ** 18;
        console.log("quoteResult", quoteResult)
        setAmountOut(amountOutFormatted.toString());
      } catch (err: any) {
        console.error("Error fetching swap quote:", err);
        setQuoteError("Failed to fetch quote: " + (err.message || "Unknown error"));
        setAmountOut("0");
      }
    };
    fetchQuote();
  }, [originToken, destinationToken, originChainId, destinationChainId, amountIn, direction]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!originToken || !destinationToken || direction === "from") {
        console.log("Skipping fetchQuote: Missing tokens or invalid amount");
        return;
      }
      try {
        setQuoteError(null);
        const buyAmount = parseFloat(amountOut);
        const buyAmountWei = BigInt(Math.round(buyAmount * 10 ** destinationToken.decimals));
        const quoteResult = await Bridge.Buy.quote({
          originChainId,
          originTokenAddress: originToken.contractAddress,
          destinationChainId,
          destinationTokenAddress: destinationToken.contractAddress,
          buyAmountWei,
          client,
        });
        const amountInFormatted = Number(quoteResult.originAmount) / 10 ** originToken.decimals;
        setAmountIn(amountInFormatted.toString());
      } catch (err: any) {
        console.error("Error fetching swap quote:", err);
        setQuoteError("Failed to fetch quote: " + (err.message || "Unknown error"));
        setAmountOut("0");
      }
    };
    fetchQuote();
  }, [originToken, destinationToken, originChainId, destinationChainId, amountOut, direction]);

  const handleSetApproval = async (tokenAddress: string) => {
    const tokenContract = getContract({ address: tokenAddress, client, chain: NETWORK });
    setIsApproving(true);
    try {
      if (chainInfo?.id !== originChainId) {
        await switchChain(defineChain(originChainId));
        console.log("Successfully switched chain");
      }
      const tx = await prepareContractCall({
        contract: tokenContract,
        method: "function approve(address spender, uint256 value) returns (bool)",
        params: [plasmaRouter, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
      });
      await mutateTransaction(tx);
      setBuyingStep("confirm");
    } catch (err) {
      console.error("Error during approval:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!account || !originToken || !destinationToken) return;
    setIsSwapping(true);
    try {
      const buyAmountWei = BigInt(Math.round(Number(amountOut) * 10 ** destinationToken.decimals));
      const preparedBuy = await Bridge.Buy.prepare({
        originChainId,
        originTokenAddress: originToken.contractAddress,
        destinationChainId,
        destinationTokenAddress: destinationToken.contractAddress,
        buyAmountWei,
        sender: account.address,
        receiver: account.address,
        client,
      });
      for (const transaction of preparedBuy.transactions) {
        const tx = {
          to: transaction.to as string,
          value: BigInt(transaction.value ?? 0n),
          data: transaction.data,
          chain: defineChain(transaction.chainId),
          client,
        };
        const result = await sendAndConfirmTransaction({ transaction: tx, account });
        let swapStatus;
        do {
          swapStatus = await Bridge.status({
            transactionHash: result.transactionHash,
            client,
            chainId: destinationChainId,
          });
        } while (swapStatus.status !== "COMPLETED");
      }
      setBuyingStep("swap");
    } catch (err: any) {
      console.error("Error during swap:", err);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSelectRoute = (route: Route) => {
    const origin = {
      chainId: route.originToken.chainId,
      contractAddress: route.originToken.address,
      name: route.originToken.name,
      symbol: route.originToken.symbol,
      decimals: route.originToken.decimals,
      image: route.originToken.iconUri || "",
      balance: "0",
      price: "0",
      value: "0",
      totalSupply: "",
      volume: "",
      marketCap: "",
      totalReserve: "",
      coinGeckoId: "",
      topPools: [],
    };
    const destination = {
      chainId: route.destinationToken.chainId,
      contractAddress: route.destinationToken.address,
      name: route.destinationToken.name,
      symbol: route.destinationToken.symbol,
      decimals: route.destinationToken.decimals,
      image: route.destinationToken.iconUri || "",
      balance: "0",
      price: "0",
      value: "0",
      totalSupply: "",
      volume: "",
      marketCap: "",
      totalReserve: "",
      coinGeckoId: "",
      topPools: [],
    };
    setBridgeRoute(route)
    setOriginToken(origin);
    setDestinationToken(destination);
    setOriginChainId(route.originToken.chainId);
    setDestinationChainId(route.destinationToken.chainId);
    setIsRoutesModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.card}>
        <View style={styles.divider}>
                          <View style={styles.dividerLine} />
                          <ThemedText style={styles.title}>Crypto Bridge</ThemedText>
                          <View style={styles.dividerLine} />
                        </View>
        <View style={styles.directionContainer}>
          <ThemedText style={styles.label}>                   Bridge Direction                 {direction === "from" ? "Destination Chain" : "Origin Chain"}</ThemedText>
          <View style={styles.toggleContainer}>
            <Animated.View style={[styles.toggleButton, fromAnimatedStyle]}>
              <TouchableOpacity
                onPress={() => setDirection("from")}
                onPressIn={handleFromPressIn}
                onPressOut={handleFromPressOut}
                activeOpacity={0.7}
                accessibilityLabel="Set direction to From"
              >
                <ThemedText
                  style={[
                    styles.toggleText,
                    direction === "from" ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  {direction === "to" ? "to": "from"}
                  </ThemedText>
              </TouchableOpacity>
            </Animated.View>
                
            <Switch
              value={direction === "to"}
              onValueChange={(value) => setDirection(value ? "to" : "from")}
              trackColor={{ false: "#555", true: "#FFF" }}
              thumbColor="#FFF"
              style={styles.switch}
            />

           
            <Animated.View style={[styles.selector, chainAnimatedStyle]}>
            <TouchableOpacity
              onPress={() => setIsChainModalVisible(true)}
              onPressIn={handleChainPressIn}
              onPressOut={handleChainPressOut}
              activeOpacity={0.7}
              accessibilityLabel="Select chain"
            >
              <View style={styles.selectorContent}>
                {selectedChain?.image ? (
                  <Image source={selectedChain.image} style={styles.selectorImage} />
                ) : (
                  <ThemedText style={styles.selectorPlaceholder}>?</ThemedText>
                )}
                <ThemedText style={styles.selectorText}>
                  {Object.entries(UNISWAP_CONTRACTS2).find(([_, data]) => data.chainId === selectedChainId)?.[0] || "Select Chain"}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </Animated.View>
          </View>
        </View>
        
        <View style={styles.selectorContainer}>
          <TokenBridgeSelector
            tokens={tokenBalances}
            selectedToken={selectedToken}
            symbol={chainData2?.symbol || "ETH"}
            onSelect={(token: Token, amount: string) => {
              setSelectedToken(token);
              direction === "from" ? setAmountIn(amount) : setAmountOut(amount);
            }}
            onAddToken={(token: Token) => setSelectedToken(token)}
            label={direction === "from" ? "From Token" : "To Token"}
          />
        </View>

        
        {!bridgeRoute && (
        <ActionButton
          title="View Available Routes"
          onPress={() => setIsRoutesModalVisible(true)}
          accessibilityLabel="View available routes"
        />
        )}

      {bridgeRoute && (
                  <RouteItem succes="" item={bridgeRoute} direction={direction} onSelect={setIsRoutesModalVisible} amountA={amountIn} amountB={amountOut} />
          )}


          <View style={styles.divider}>
                          <View style={styles.dividerLine} />
                          <ThemedText style={styles.dividerText}>Bridge with ioPlasmaVerse</ThemedText>
                          <View style={styles.dividerLine} />
                        </View>
              
          
        

        {buyingStep === "approval" && originToken && originToken.contractAddress !== THIRDWEB_NATIVE_TOKEN_ADDRESS && (
          <ThemedView >
            <ActionButton
              title={`Approve ${originToken.symbol}`}
              onPress={() => handleSetApproval(originToken.contractAddress)}
              disabled={isApproving}
              loading={isApproving}
              accessibilityLabel={`Approve ${originToken.symbol}`}
            />
          </ThemedView>
        )}

        {buyingStep === "confirm" && originToken && destinationToken && (
          <ThemedView>
            <ActionButton
              title="Confirm Swap"
              onPress={handleSwap}
              disabled={isSwapping || !!quoteError}
              loading={isSwapping}
              accessibilityLabel="Confirm swap"
            />
          </ThemedView>
        )}

        {buyingStep === "swap" && (
          <ThemedView >
            <ThemedText style={styles.toggleText}>Swap completed successfully!</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ChainSelectorModal
        visible={isChainModalVisible}
        onClose={() => setIsChainModalVisible(false)}
        onSelectChain={(newChainId) => setDestinationChainId(newChainId)}
      />

  <RoutesModal
        visible={isRoutesModalVisible}
        onClose={() => setIsRoutesModalVisible(false)}
        routes={routes}
        routesError={routesError}
        onSelectRoute={handleSelectRoute}
        routesPage={routesPage}
        setRoutesPage={setRoutesPage}
        routesPerPage={ROUTES_PER_PAGE}
      />


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#BBB", 
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13, 
    color: "#BBB", 
  },
  card: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#333",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  directionContainer: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
   
  },
  toggleButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal:20,
    borderColor: "#BBB  ",
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
    marginHorizontal: 8,
  },
  toggleTextInactive: {
    fontWeight: "600",
    color: "#DDD",

  },
  toggleTextActive: {
    fontWeight: "600",

  },
  switch: {
    marginHorizontal: 8,
    paddingHorizontal: 10,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#BBB",
    marginBottom: 6,
  },
  selector: {
    borderWidth: 1,
    borderColor: "#666", // Brighter border
    backgroundColor: "#444", // Lightened background
    borderRadius: 10,
    padding: 10,
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
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorImage: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#777", // Added border to match token images
  },
  selectorPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 8,
    textAlign: "center",
    color: "#BBB",
  },
  selectorText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600", // Slightly bolder text
  },
  
  button: {
    backgroundColor: "#3A3A3A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#555",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
 
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    marginBottom: 10,
    textAlign: "center",
  },  
});

export default PlasmaBridge;
