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
import { chainData, Token, UNISWAP_CONTRACTS2 } from "@/constants/types";
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
import { useCurrency } from "@/constants/currency";
import { ThemedView } from "../ThemedView";
import TokenBridgeSelector from "./bridgeSelector";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import ActionButton from "../ActionButton";
import RouteItem from "./RouterItems";
import ChainModal from "./chainModal";

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
  const { chainData:chainData2, tokenBalances, setChainId, updateBalances, chainId } = useCurrency();
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const switchChain = useSwitchActiveWalletChain();
  const chainInfo = useActiveWalletChain();

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
  const selectedChain = Object.values(chainData).find((chain) => chain.chainId === selectedChainId);

  const [originToken, setOriginToken] = useState<Token | null>(null);
  const [destinationToken, setDestinationToken] = useState<Token | null>(null);
  const [originChainId, setOriginChainId] = useState<number>(Number(chainId || 1));
  const [destinationChainId, setDestinationChainId] = useState<number>(10);

  const NETWORK = defineChain(originChainId || 1);
  const plasmaRouter = Object.values(UNISWAP_CONTRACTS2).find((data) => data.chainId === originChainId)?.router || ADDRESS_ZERO;

  const scale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
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
      if (!account || !originToken || originToken.contractAddress === THIRDWEB_NATIVE_TOKEN_ADDRESS) return;
      try {
        if (originToken.contractAddress.toLowerCase() === THIRDWEB_NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          setBuyingStep("confirm");
          return;
        }
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
        console.log("Skipping fetchRoutes: No account or token selected");
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
          options.destinationChainId = selectedChainId;
        } else {
          options.destinationTokenAddress = selectedToken.contractAddress;
          options.destinationChainId = chainId;
          options.originChainId = selectedChainId;
        }
        const filteredRoutes = await Bridge.routes(options);
        console.log("Fetched routes:", filteredRoutes);
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
        const amountOutFormatted = Number(quoteResult.destinationAmount) / 10 ** destinationToken.decimals;
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
    setOriginToken(origin);
    setDestinationToken(destination);
    setOriginChainId(route.originToken.chainId);
    setDestinationChainId(route.destinationToken.chainId);
    setIsRoutesModalVisible(false);
  };

  

  return (
    <View style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText style={styles.title}>Crypto Bridge</ThemedText>

        <View style={styles.directionContainer}>
          <ThemedText style={styles.label}>Bridge Direction</ThemedText>
          <View style={styles.toggleContainer}>
            <ThemedText style={[styles.toggleText, direction === "from" && styles.toggleTextActive]}>From</ThemedText>
            <Switch
              value={direction === "to"}
              onValueChange={(value) => setDirection(value ? "to" : "from")}
              trackColor={{ false: "#555", true: "#fff" }}
              thumbColor="#FFF"

            />
            <ThemedText style={[styles.toggleText, direction === "to" && styles.toggleTextActive]}>To</ThemedText>
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

        <View style={styles.selectorContainer}>
          <ThemedText style={styles.label}>{direction === "from" ? "Destination Chain" : "Origin Chain"}</ThemedText>
          <Animated.View style={[animatedButtonStyle]}>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setIsChainModalVisible(true)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              accessibilityLabel="Select chain"
            >
              <ThemedText style={styles.selectorText}>
                {Object.entries(UNISWAP_CONTRACTS2).find(([_, data]) => data.chainId === selectedChainId)?.[0] || "Select Chain"}
              
               {selectedChain?.image ? (
                          <Image source={selectedChain.image} style={styles.selectorImage} />
                        ) : (
                          <ThemedText>?</ThemedText>
                        )}
                        </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ActionButton
          title="View Available Routes"
          onPress={() => setIsRoutesModalVisible(true)}
          accessibilityLabel="View available routes"
        />

        {originToken && destinationToken && (
          <View style={styles.paymentDetails}>
            <ThemedText style={styles.label}>You Pay</ThemedText>
            {quoteError ? (
              <ThemedText style={styles.errorText}>{quoteError}</ThemedText>
            ) : (
              <View style={styles.tokenRow}>
                <View style={styles.tokenInfo}>
                  <View>
                    <ThemedText style={styles.tokenName}>
                       ({originToken.symbol})
                    </ThemedText>
                    <Image
                source={{ uri: originToken.image as string }}
                style={styles.tokenLogo}
                resizeMode="contain"
              />
                    
                  </View>
                </View>
                <View style={styles.tokenAmount}>
                  <ThemedText style={styles.tokenAmountText}>
                    {parseFloat(amountIn).toFixed(6)} {originToken.symbol}
                  </ThemedText>
                 
                </View>
              </View>
            )}

            <ThemedText style={styles.label}>You Receive</ThemedText>
            <View style={styles.tokenRow}>
              <View style={styles.tokenInfo}>
                <View>
                  <ThemedText style={styles.tokenName}>
                    ({destinationToken.symbol})
                  </ThemedText>
                  <Image
                source={{ uri: destinationToken.image as string }}
                style={styles.tokenLogo}
                resizeMode="contain"
              />
                  
                </View>
              </View>
              <View style={styles.tokenAmount}>
                <ThemedText style={styles.tokenAmountText}>
                  {parseFloat(amountOut).toFixed(6)} {destinationToken.symbol}
                </ThemedText>                
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>Bridge with</ThemedText>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        {buyingStep === "approval" && originToken && originToken.contractAddress !== THIRDWEB_NATIVE_TOKEN_ADDRESS && (
          <ThemedView style={styles.approvalCard}>
            <ThemedText style={styles.approvalText}>Approval required before bridging.</ThemedText>
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
          <ThemedView style={styles.approvalCard}>
            <ThemedText style={styles.approvalText}>Confirm your cross-chain swap.</ThemedText>
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
          <ThemedView style={styles.approvalCard}>
            <ThemedText style={styles.approvalText}>Swap completed successfully!</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
         <Modal
               visible={isChainModalVisible}
               transparent={true}
               animationType="slide"
               onRequestClose={() => setIsChainModalVisible(false)}
              >
                        <View style={styles.modalOverlay}>

                <ThemedView style={styles.modalContainer}>
                    <FlatList
                      data={Object.values(chainData)}
                      keyExtractor={(item) => item.chainId.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => {
                            setSelectedChainId(item.chainId);
                            setIsChainModalVisible(false);
                          }}
                        >
                          {item.image && <Image source={item.image} style={styles.modalImage} />}
                          <ThemedText style={styles.modalText}>{item.name}</ThemedText>
                        </TouchableOpacity>
                      )}
                    />
                     <ActionButton
                      title="Close"
                      onPress={() => setIsChainModalVisible(false)}
                      accessibilityLabel="Close Chain modal"
                    />
                    
                  </ThemedView>
                </View>
              </Modal>
      
      <Modal
        visible={isRoutesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRoutesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Available Routes</ThemedText>

            {routesError ? (
              <ThemedText style={styles.errorText}>{routesError}</ThemedText>
            ) : routes.length === 0 ? (
              <ThemedText style={styles.modalLabel}>No routes available</ThemedText>
            ) : (
              <>
                <FlatList
                  data={routes}
                  renderItem={({ item }) => <RouteItem item={item} onSelect={handleSelectRoute} />}
                  keyExtractor={(item) => `${item.originToken.address}-${item.destinationToken.address}`}
                  style={styles.routeList}
                />
                <View style={styles.pagination}>
                  <ActionButton
                    title="Previous"
                    onPress={() => setRoutesPage((prev) => Math.max(prev - 1, 0))}
                    disabled={routesPage === 0}
                    accessibilityLabel="Previous routes page"
                  />
                  <ActionButton
                    title="Next"
                    onPress={() => setRoutesPage((prev) => prev + 1)}
                    disabled={routes.length < ROUTES_PER_PAGE}
                    accessibilityLabel="Next routes page"
                  />
                </View>
              </>
            )}

            <ActionButton
              title="Close"
              onPress={() => setIsRoutesModalVisible(false)}
              accessibilityLabel="Close routes modal"
            />
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 8,
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
    marginBottom: 16,
  },
  directionContainer: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#444",
  },
  toggleText: {
    fontSize: 13,
    color: "#BBB",
    marginHorizontal: 8,
    paddingVertical: 6,
  },
  toggleTextActive: {
    color: "#FFF",
    fontWeight: "600",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 8,
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
    borderWidth: 0.5,
    borderColor: "#444",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 10,
  },
  selectorImage: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  selectorText: {
    color: "#fff",
    fontSize: 16,
    marginRight: 8,
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "50%",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  modalIcon: {
    marginRight: 12,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
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
  paymentDetails: {
    marginBottom: 16,
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#444",
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  tokenPrice: {
    fontSize: 11,
    color: "#BBB",
    marginTop: 3,
  },
  tokenAmount: {
    alignItems: "flex-end",
  },
  tokenAmountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  tokenValue: {
    fontSize: 11,
    color: "#00C4B4",
    marginTop: 3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#BBB",
    fontWeight: "400",
  },
  approvalCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#444",
  },
  approvalText: {
    fontSize: 13,
    color: "#f39c12",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    marginBottom: 10,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
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
  
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#BBB",
    marginBottom: 10,
    textAlign: "center",
  },
  chainList: {
    maxHeight: 180,
    marginBottom: 12,
  },
  chainItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#444",
  },
  chainItemText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "500",
  },
  routeList: {
    marginBottom: 12,
  },
  routeItem: {
    marginBottom: 10,
  },
  routeCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#444",
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
  tokenPair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  tokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: "#555",
  },
  tokenSymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  tokenChain: {
    fontSize: 11,
    color: "#BBB",
    marginTop: 2,
  },
  arrow: {
    fontSize: 14,
    color: "#00C4B4",
    marginHorizontal: 8,
    fontWeight: "600",
  },
  routeDescription: {
    fontSize: 11,
    color: "#BBB",
    textAlign: "center",
    opacity: 0.8,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  closeButton: {
    padding: 10,
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  }
});

export default PlasmaBridge;