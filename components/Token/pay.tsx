"use client";

  import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
  import { TransactionButton, useActiveAccount, useActiveWalletChain, useActiveWalletConnectionStatus, useReadContract, useSendAndConfirmTransaction, useSwitchActiveWalletChain } from "thirdweb/react";
  import { encode, getContract, prepareContractCall, PreparedTransaction, readContract,eth_estimateGas, eth_gasPrice, getRpcClient, eth_getBalance, sendTransaction, defineChain, simulateTransaction, ADDRESS_ZERO, isAddress, estimateGas, eth_blockNumber, watchContractEvents, prepareEvent, prepareTransaction, toWei, NATIVE_TOKEN_ADDRESS, Bridge } from "thirdweb";
  import { approve, decimals, balanceOf, totalSupply, allowance, transferFrom } from "thirdweb/extensions/erc20";


import toast from "react-hot-toast";
import { chainData as aktiveChain , UNISWAP_CONTRACTS2 } from "@/constants/types";

import { client } from "@/constants/thirdweb";
import {  fetchPath, getAmountsIn, validatePath, validateUniswapV3Path } from "@/hooks/getAmounts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemedText } from "../ThemedText";
import { ActivityIndicator, Image, TouchableOpacity, View, StyleSheet, Switch, Platform } from "react-native";
import { Token, useCurrency } from "@/constants/currency";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "../ThemedView";
import TokenPaySelector from "./tokenSelecter";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import ChainSelectorModal from "../chainSelector.tsx/chainSelector";
import RoutesModal from "../RoutesModal/RoutesModal";
import ActionButton from "../ActionButton";
import PayDetails from "../pay/paydetails";
import RouteItem from "../pay/bridgeRoute";
import SwapDetails from "../pay/swapDetails";
import TokenListModal from "./tokenList";

type BuyingStep = "approval" | "confirm" | "approvalNative";
type BuyingStepDex = "Uniswapv2" | "Veldrome" | "UniswapV3Single" | "UniswapV3Multi" | "Quickswap"| "QuickswapMulti" |  "WrappedContract" | "transfer";
type Direction = "1Step" | "2Step";

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


  interface PaymentDetails {
    paymentId: string;
    recieverAddress: string;
    chainId: number;
    tokenAddress: string;
    amount: string;
    isPayed: boolean;
    createdAt: string;
    updatedAt: string;
    transactionHash: string;
  }
 export const PayInterFace: React.FC = () => {
  const { chainData, WETH9 , tokenBalances,  setChainId, setTokenList, updateBalances, chainId} = useCurrency();
  const [isChainModalVisible, setIsChainModalVisible] = useState(false);
  
    
    const account = useActiveAccount();
    const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
    const [currentFrom, setCurrentFrom] = useState<"A" | "B">("A"); // Active input
    const [buyingStep, setBuyingStep] = useState<BuyingStep>("approval");
    const [dexStep, setDexStep] = useState<BuyingStepDex>("Uniswapv2");
    const [error, setError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [direction, setDirection] = useState<Direction>("1Step");
  const [originToken, setOriginToken] = useState<Token | null>(null);
  const [destinationToken, setDestinationToken] = useState<Token | null>(null);
  const [originChainId, setOriginChainId] = useState<number>(Number(chainId || 1));
  const [destinationChainId, setDestinationChainId] = useState<number>(10);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  const [BridgeAmountIn, setBridgeAmount] = useState("0"); // Calculated amount for token A

    const [amountIn, setAmountIn] = useState("0"); // Calculated amount for token A
    const [amountInBigint, setAmountInBigint] = useState(0n); // Calculated amount for token A
    const [amountOut, setAmountOut] = useState("0"); // Calculated amount for token B
    const [destinationAmountOut, setDestinatioAmountOut] = useState("0"); // Calculated amount for token B
    const [amountOutBigInt, setAmountOutBigint] = useState(0n); // Calculated amount for token B
    const [symbol, setSymbol] = useState(""); 
    const [route, setRoute] = useState<any>();
    const switchChain = useSwitchActiveWalletChain();
    const chainInfo = useActiveWalletChain();  
    const [plasmaRouter, setRouterAddress] = useState("");
    const [fee, setFee] = useState(0);
    const [router, setRouter] = useState("");
    const [factory, setFactory] = useState("");
    const [paymentId, setPaymentId] = useState(""); // Calculated amount for token B
    const [reciever, setReciever] = useState("");
    const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [bridgeRoute, setBridgeRoute] = useState<Route>();
    const [routesError, setRoutesError] = useState<string | null>(null);
    const [routesPage, setRoutesPage] = useState(0);
    const ROUTES_PER_PAGE = 50;
    const [selectedChainId, setSelectedChainI] = useState<number>(Number(chainId || 1));
    const NETWORK = defineChain(selectedChainId || 1);
    const [tokenA, setTokenA] = useState<Token>(tokenBalances[0]);
    const [tokenB, setTokenB] = useState<Token>(tokenBalances[1]);
    const [path, setPath] = useState<any[]>([]);
      const [modalVisible, setModalVisible] = useState(false);
      const selectedChain = Object.values(aktiveChain).find((chain) => chain.chainId === chainId);

      
    const feePath = {
      feeRecipient: "0xdc2059cDCF5F6f70c805d6EFB5Bb0cE6144200c2", // Example tokenIn address
      tokenIn: WETH9, // Convert inputValue to smallest unit
      amountIn: 0n,
      nativeIn: 0n,
    };
    const params = useLocalSearchParams<{
      chainId: string;
      token: string;
      amount: string;
      reciever: string;
      paymentId: string;
    }>();
    
    const updateChain = async (chainId: number) => {
      updateBalances(chainId)
      setChainId(chainId)
    };
    const hasProcessedInitialLoad = useRef(false);
        // Animation states for Bridge Direction toggles
          const fromScale = useSharedValue(1);
          const fromBorderColor = useSharedValue("#666");
          const toScale = useSharedValue(1);
          const toBorderColor = useSharedValue("#666");
        
    const handleFromPressIn = () => {
          fromScale.value = withTiming(0.95, { duration: 100 });
          fromBorderColor.value = "#00C4B4";
        };
      
        const handleFromPressOut = () => {
          fromScale.value = withTiming(1, { duration: 100 });
          fromBorderColor.value = "#666";
        };
   

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
      const fromAnimatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: fromScale.value }],
          borderColor: fromBorderColor.value,
          backgroundColor: direction === "1Step" ? "#00C4B4" : "#444",
        }));

      useEffect(() => {
        
    
        if (hasProcessedInitialLoad.current) {
          return;
        }
    
        const { chainId: chainIdParam, token: tokenAddress, amount: uint256, reciever: address, paymentId: payment } = params;
    
        if (!tokenAddress || !chainIdParam || !address || !uint256 || !payment) {
          console.log('Missing required route parameters', params);
          setError('Missing required route parameters');
          return;
        }
    
        const parsedChainId = parseInt(chainIdParam, 10);
        if (isNaN(parsedChainId)) {
          console.log('Invalid chainId parameter', chainIdParam);
          setError('Invalid chainId parameter');
          return;
        }
    
        const amountInSmallestUnit = BigInt(uint256);
    
        console.log('Parsed values:', { tokenAddress, parsedChainId, amountInSmallestUnit });
        setSelectedChainI(parsedChainId)
        setReciever(address);
        setPaymentId(payment);
        setCurrentFrom("B");
    
        const processBalances = () => {
          console.log('Checking tokenBalances:', {
            length: tokenBalances.length,
            tokens: tokenBalances.map(t => ({ contractAddress: t.contractAddress, chainId: t.chainId }))
          });
    
          // Check if tokenBalances is populated and has valid chainId values
          const hasMatchingChainId = tokenBalances.length > 0 && tokenBalances.some(token => token.chainId === parsedChainId);
    
          if (!tokenBalances || tokenBalances.length === 0 || !hasMatchingChainId) {
            console.log('Token balances not ready or no tokens match the chainId:', parsedChainId);
            return;
          }
    
          console.log('Token balances ready with matching chainId:', parsedChainId);
    
          if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
            console.log('Processing native token');
            // Find the native token in tokenBalances (often represented by WETH or a native token placeholder)
            const nativeToken = tokenBalances.find(
              (token: Token) => 
                (token.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS || 
                 token.contractAddress.toLowerCase() === WETH9.toLowerCase()) && 
                token.chainId === parsedChainId
            );
    
            if (nativeToken) {
              console.log('Found native token:', nativeToken);
              const amountOutFormatted = (Number(amountInSmallestUnit) / Math.pow(10, nativeToken.decimals)).toString();
              setTokenB(nativeToken);
              setDestinationChainId(parsedChainId)
              setDestinationToken(nativeToken);
              setDestinatioAmountOut(amountOutFormatted)
              setAmountOut(amountOutFormatted);
              setAmountOutBigint(BigInt(amountInSmallestUnit));
              setPaymentId(payment);
              hasProcessedInitialLoad.current = true;
              console.log('Processing complete for native token');
            } else {
              console.error('Native token not found in tokenBalances for chainId:', parsedChainId);
              setError("Native token not found in available balances.");
            }
          } else {
            console.log('Looking for matching token with address:', tokenAddress);
            const matchingToken = tokenBalances.find(
              (token: Token) => 
                token.contractAddress.toLowerCase() === tokenAddress.toLowerCase() && 
                token.chainId === parsedChainId
            );
    
            if (matchingToken) {
              console.log('Found matching token:', matchingToken);
              const amountOutFormatted = (Number(amountInSmallestUnit) / Math.pow(10, matchingToken.decimals)).toString();
              setTokenB(matchingToken);
              setDestinationToken(matchingToken)
              setAmountOut(amountOutFormatted);
              setAmountOutBigint(BigInt(amountInSmallestUnit));
              setPaymentId(payment);
              hasProcessedInitialLoad.current = true;
              console.log('Processing complete for ERC-20 token');
            } else {
              console.error('Token not found in tokenBalances:', tokenAddress);
              setError("Requested token not found in available balances.");
            }
          }
        };
    
        const updateChainAndBalances = async () => {
          try {
            if (chainId !== parsedChainId) {
              console.log('Chain ID mismatch, updating chain to:', parsedChainId);
              await updateChain(parsedChainId);
            } else {
              console.log('Chain ID matches, checking balances');
              processBalances();
            }
          } catch (error) {
            console.error("Error updating chain:", error);
            setError("Failed to process token information");
          }
        };
    
        console.log('Calling updateChainAndBalances');
        updateChainAndBalances();
    
        if (chainId === parsedChainId) {
          processBalances();
        }
      }, [chainId, tokenBalances, setChainId, updateBalances, params, WETH9]);

      useEffect(() => {
        if (!tokenBalances || tokenBalances.length === 0) {
          console.log('tokenBalances is empty, fetching data...');
          updateBalances(Number(chainId || 1));
        }
      }, [chainId]);
    
     
        useEffect(() => {
          if (
            tokenA?.contractAddress.toLowerCase() === WETH9.toLowerCase() &&
            tokenB?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ) {
            setBuyingStep("confirm");
          } else if (
            tokenA?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()           ) {
            setBuyingStep("confirm");
          } else {
            setBuyingStep("approval");
          }
        }, [tokenA, tokenB, amountIn])
        
       
        
                
                
        useEffect(() => {
          const checkApproval = async () => {
            if (!account) return;
            let ERC20Approval: Promise<bigint> | undefined;
            
            // Only fetch approval if tokenA is not the native token
            if (tokenA && tokenA.contractAddress !== NATIVE_TOKEN_ADDRESS) {
              ERC20Approval = allowance({
                contract: getContract({
                  client,
                  chain: NETWORK,
                  address: tokenA.contractAddress,
                }),
                owner: account?.address,
                spender: plasmaRouter,
              });
            }
        
            // If ERC20Approval exists, resolve it and check approval
            if (ERC20Approval && account && amountIn && tokenA) {
              try {
                const approvalAmount = await ERC20Approval; // Resolve the promise
                const parsedAmountIn = BigInt(Math.round(Number(amountIn) * 10 ** tokenA.decimals));
                const isApproved = approvalAmount >= parsedAmountIn;
        
                if (isApproved) {
                  setBuyingStep("confirm");
                }
              } catch (error) {
                console.error("Error checking token approval:", error);
              }
            } else {
              // If conditions aren't met, reset approval state
            }
          };
        
          checkApproval();
        }, [account, amountIn, tokenA, NETWORK, plasmaRouter, client]);
   

    const handleSetApproval2 = async (tokenAddress: string) => {
      const tokenContract = getContract({
        address: tokenAddress,
        client,
        chain: NETWORK,
      });
    
      setIsApproving(true);
    
      try {
        

         const tx = await prepareContractCall({
                contract: tokenContract,
                method:
                "function approve(address spender, uint256 value) returns (bool)",
                params: [plasmaRouter, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
                
                });
        // Set max approval
        
    
        await mutateTransaction(tx);
        setBuyingStep("confirm");
        setIsApproving(false);
      } catch (err) {
        console.error("Error during approval:", err);
        setError("Approval failed. Please try again.");
        setIsApproving(false);
      }
    };

    const handleSetApproval = async (tokenAddress: string) => {
      
        try {
          // Check if the current chain matches the required chain
          if (chainInfo?.id === Number(chainId || 1)) {
            handleSetApproval2(tokenAddress); // Proceed with approval
          } else {
            // Attempt to switch chains
            await switchChain(NETWORK);
            console.log("Successfully switched chain");
      
            // If chain switching succeeds, proceed with approval
            handleSetApproval2(tokenAddress);
          }
        } catch (err) {
          // Handle any errors during chain switch or approval
          console.error("Error during approval:", err);
          setError("Approval failed. Please try again.");
        }
      };
    

    useEffect(() => {
      
      const fetchAmountsOut = async () => {
        if (currentFrom === "B" && tokenA && tokenB) {
          try {
            if (tokenA.contractAddress.toLowerCase() === tokenB.contractAddress.toLowerCase() ) {
            setDexStep("transfer");
            setAmountIn(amountOut);
            setAmountInBigint(amountOutBigInt)
            } else {
            const Amounts = await getAmountsIn(
              tokenA,
              tokenB,
              chainId || 1,
              amountOutBigInt
            );
            console.log("data", Amounts);
            if (!Amounts) return;
    
            const formattedAmountOut = (
              (Number(Amounts.bestAmountOut) * 1.02) / // Increase by 1%
              10 ** (tokenA?.decimals || 18) // Default to 18 if decimals is undefined
            ).toFixed(6);
            
            console.log("data", formattedAmountOut);
            setAmountIn(formattedAmountOut);
            setAmountInBigint(Amounts.bestAmountOut);
            setRouter(Amounts.routerAddress);
            setFee(Amounts.fee);
            setFactory(Amounts.factory)
            setRoute(Amounts.route);
            setDexStep(Amounts.bestDex);
            const path = await fetchPath(Amounts.route, tokenA, tokenB, amountIn, amountOut, dexStep, tokenBalances, currentFrom)
            if (path) {
              console.log("path", path)
              setPath(path)
            }
          }
          } catch (error) {
            console.error("Error fetching amounts out:", error);
          }
        }
      };
      
      fetchAmountsOut(); // Call the async function
    
    }, [amountOut, currentFrom, tokenA, tokenB, selectedChainId]);

    

    useEffect(() => {
        const fetchRoutes = async () => {
          if (!destinationToken) {
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
            
              options.destinationTokenAddress = destinationToken.contractAddress;
              options.destinationChainId = selectedChainId;
              options.originChainId = chainId;
            
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
      }, [account, tokenB, direction, selectedChainId, routesPage, chainId]);
    
     useEffect(() => {
        const fetchQuote = async () => {
          if (!routes || !destinationToken || !originToken ) {
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
            setBridgeAmount(amountInFormatted.toString());
            setAmountIn(amountInFormatted.toString());
            setAmountOutBigint(quoteResult.originAmount)
          } catch (err: any) {
            console.error("Error fetching swap quote:", err);
            setQuoteError("Failed to fetch quote: " + (err.message || "Unknown error"));
            setAmountOut("0");
          }
        };
        fetchQuote();
      }, [originToken, destinationToken, originChainId, destinationChainId, amountOut, direction]);
     
      const onAddToken = async (newToken: Token) => {
        const normalizedToken: Token = {
          ...newToken,
          image: typeof newToken.image === "string" ? newToken.image : "", // Convert image to string, default to empty string if not a string
        };
      
        setTokenList((tokenBalances) => [...tokenBalances, normalizedToken]);
      
        // Update tokenA with the normalized token
        setTokenA(normalizedToken);
      };

      const handleSelectRoute = (route: Route) => {
        const origin = {
          chainId: route.originToken.chainId,
          contractAddress: route.originToken.address.toString(),
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
          contractAddress: route.destinationToken.address.toString(),
          name: route.destinationToken.name,
          symbol: route.destinationToken.symbol,
          decimals: route.destinationToken.decimals,
          image: route.destinationToken.iconUri || "",
          balance: tokenB.balance,
          price: tokenB.price,
          value: tokenB.value,
          totalSupply: tokenB.totalSupply,
          volume: tokenB.volume,
          marketCap: "",
          totalReserve: "",
          coinGeckoId: "",
          topPools: [],
        };
        setTokenB(origin)
        setTokenB(origin)
        setOriginToken(origin);
        setBridgeRoute(route)
        setDestinationToken(destination);
        setOriginChainId(route.originToken.chainId);
        setDestinationChainId(route.destinationToken.chainId);
        setIsRoutesModalVisible(false);
      };

      const renderSwapDetails = () => {
        if (!(path && path.length > 1)) {
          console.log('SwapDetails not rendered: path is invalid or too short', { path });
          return null;
        }
      
        if (direction === "2Step") {
          return (
            <SwapDetails
              succes=""
              onSelect={setModalVisible}
              amountIn={amountIn}
              amountOut={BridgeAmountIn}
              path={path}
              direction={direction}
            />
          );
        }
      
        if (chainId === destinationChainId) {
          return (
            <SwapDetails
            succes=""
              onSelect={setModalVisible}
              amountIn={amountIn}
              amountOut={amountOut}
              path={path}
              direction={direction}
            />
          );
        }
      
        console.log('SwapDetails not rendered: conditions not met', { direction, chainId, destinationChainId });
        return null;
      };

      const renderSwapModalButton = () => {
        if (!(path && path.length < 1)) {
          console.log('SwapDetails not rendered: path is invalid or too short', { path });
          return null;
        }
      
        if (direction === "2Step") {
          return (
            <ActionButton
              title="Step 1: View Available Tokens"
              onPress={() => setModalVisible(true)}
              accessibilityLabel="View available Tokens"
            />
          );
        }
      
        if (chainId === destinationChainId) {
          return (
            <ActionButton
              title="View Available Tokens"
              onPress={() => setModalVisible(true)}
              accessibilityLabel="View available Tokens"
            />
          );
        }
      
        console.log('SwapDetails not rendered: conditions not met', { direction, chainId, destinationChainId });
        return null;
      };
    
      return (
        <View style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.title}>Crypto Payment</ThemedText>
    


          <View style={styles.directionContainer}>
                    <ThemedText style={styles.label}>                   Steps                                 {direction === "1Step" ? "Destination Chain" : "Origin Chain"}</ThemedText>
                    <View style={styles.toggleContainer}>
                      <Animated.View style={[styles.toggleButton, fromAnimatedStyle]}>
                        <TouchableOpacity
                          onPress={() => setDirection("1Step")}
                          onPressIn={handleFromPressIn}
                          onPressOut={handleFromPressOut}
                          activeOpacity={0.7}
                          accessibilityLabel="Set direction to From"
                        >
                          <ThemedText
                            style={[
                              styles.toggleText,
                              direction === "1Step" ? styles.toggleTextActive : styles.toggleTextInactive,
                            ]}
                          >
                            {direction === "1Step" ? "1Step": "2Step"}
                            </ThemedText>
                        </TouchableOpacity>
                      </Animated.View>
          
                      <Switch
                        value={direction === "1Step"}
                        onValueChange={(value) => setDirection(value ? "1Step" : "2Step")}
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
                            {selectedChain?.name}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                    </View>
                  </View>
                  <View style={styles.paymentDetails}>
              <ThemedText style={styles.label}>Choose Token you want to pay with</ThemedText>
              {chainId === Number("13231213") &&(
              <TokenPaySelector
              amount={amountIn}
                tokens={tokenBalances}
                selectedToken={tokenA}
                symbol={chainData?.symbol || "ETH"}
                onSelect={setTokenA}
                onAddToken={onAddToken}
                label="From"
              />
              )}

             
              {renderSwapModalButton()}
        
              
      
       
                  {chainId != selectedChainId && !bridgeRoute &&(
          <ActionButton
                  title="View Available Routes"
                  onPress={() => setIsRoutesModalVisible(true)}
                  accessibilityLabel="View available routes"
                />
              )}
            


          {renderSwapDetails()}
          {direction === "2Step" && path.length > 1 && bridgeRoute && (
          <View style={styles.arrowContainer}>
          <Ionicons name="arrow-down" size={24} color="rgba(46, 204, 113, 0.8)" />
          </View>
          )}
         
              {bridgeRoute && (
                <RouteItem succes="" item={bridgeRoute} direction={direction} onSelect={setIsRoutesModalVisible} amountA={BridgeAmountIn} amountB={destinationAmountOut} />
              )}            
            {/* Payment Details */}
            
              
            
             
              {destinationToken && (

              <PayDetails tokenA={tokenA} tokenB={destinationToken} amountIn={amountIn} amountOut={destinationAmountOut} amountBridge={BridgeAmountIn} tokenBridge={tokenB} direction={direction} />
              )}
                  
                
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>Pay with ioPlasmaVerse</ThemedText>
                <View style={styles.dividerLine} />
              </View>
            </View>

            
    
            {/* Approval Button */}
            {buyingStep === "approval" && tokenA && tokenA.contractAddress !== NATIVE_TOKEN_ADDRESS && (
              <ThemedView>
                <ThemedText style={styles.approvalText}>Approval required before paying.</ThemedText>
                <TouchableOpacity
                  style={[styles.button, isApproving && styles.buttonDisabled]}
                  onPress={() => handleSetApproval(tokenA.contractAddress)}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Approve {tokenA.symbol}</ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
            )}

            <ChainSelectorModal
                    visible={isChainModalVisible}
                    onClose={() => setIsChainModalVisible(false)}
                    onSelectChain={(newChainId) => updateChain(newChainId)}
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

      <TokenListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        tokens={tokenBalances}
        onSelect={setTokenA}
        onAddToken={onAddToken}
        symbol={symbol}
      />
          </ThemedView>
        </View>
      );
    };
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#1A1A1A", // Match modal background
      },
      arrowContainer: {
        alignItems: "center", // Center the arrow horizontally
        marginBottom: 16,
      },
      directionContainer: {
        marginBottom: 16,
      },
      toggleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        padding: 4,
       
      },
      selectorImage: {
        width: 20,
        height: 20,
        marginRight: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#BBB", // Updated to brighter border
      },
      selectorPlaceholder: {
        width: 20,
        height: 20,
        marginRight: 8,
        textAlign: "center",
        color: "#BBB", 
      },
      toggleButton: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#BBB", 
        paddingHorizontal: 8,
        paddingVertical: 6,
      },
      toggleText: {
        fontSize: 13,
        marginHorizontal: 8,
      },
      toggleTextInactive: {
        color: "#BBB", 
      },
      toggleTextActive: {
        color: "#FFF",
        fontWeight: "600",
      },
      switch: {
        marginHorizontal: 8,
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
        borderColor: "#BBB",
        backgroundColor: "#252525", 
        borderRadius: 10,
        padding: 10,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
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
      centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1A1A1A", 
      },
      card: {
        width: "100%",
        maxWidth: 500,
        backgroundColor: "#1E1E1E", 
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "#BBB", 
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
      title: {
        fontSize: 18, 
        fontWeight: "700",
        color: "#FFF",
        textAlign: "center",
        marginBottom: 12,
      },
      subtitle: {
        fontSize: 13, 
        color: "#BBB", 
        textAlign: "center",
        marginBottom: 20,
      },
      highlight: {
        color: "#FFF",
      },
      iconContainer: {
        alignItems: "center",
        marginBottom: 20,
      },
      detailsContainer: {
        marginBottom: 20,
      },
      detailText: {
        fontSize: 13, 
        color: "#BBB", 
        marginBottom: 8,
      },
      button: {
        backgroundColor: "#FFF", 
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1E1E1E", 
      },
      disabledSelector: {
        borderWidth: 1,
        borderColor: "#BBB", 
        backgroundColor: "rgba(255, 255, 255, 0.05)", 
        borderRadius: 8,
        padding: 12,
      },
      selectorText: {
        fontSize: 16,
        color: "#FFF",
      },
      paymentDetails: {
        marginBottom: 20,
      },
      tokenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      },
      tokenInfo: {
        flexDirection: "row",
        alignItems: "center",
      },
      tokenLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#BBB",
      },
      tokenName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#FFF",
      },
      tokenPrice: {
        fontSize: 12,
        color: "#BBB", 
      },
      tokenAmount: {
        alignItems: "flex-end",
      },
      tokenAmountText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#FFF",
      },
      tokenValue: {
        fontSize: 12,
        color: "#BBB", 
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
      approvalCard: {
        backgroundColor: "rgba(255, 255, 255, 0.05)", 
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#BBB",
      },
      approvalText: {
        fontSize: 13,
        color: "#FF6B6B", 
        fontWeight: "600",
        marginBottom: 10,
      },
      tokenSelectorContainer: {
        marginBottom: 20,
      },
      tokenSelector: {
        borderWidth: 1,
        borderColor: "#BBB", 
        backgroundColor: "rgba(255, 255, 255, 0.05)", 
        borderRadius: 8,
        padding: 12,
      },
      tokenSelectorInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      tokenDropdown: {
        maxHeight: 200,
        backgroundColor: "#252525",
        borderRadius: 8,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#BBB", 
      },
      tokenItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#BBB", 
      },
    });
    
    const styles2 = StyleSheet.create({
      container: {
        flex: 1,
        padding: 20,
      },
       directionContainer: {
          marginBottom: 16,
        },
        toggleContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#252525", // Lightened background
          borderRadius: 10,
          padding: 4,
          borderWidth: 1,
          borderColor: "#BBB", // Brighter border
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
        toggleButton: {
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#BBB  ",
          paddingHorizontal: 8,
          paddingVertical: 6,
        },
        toggleText: {
          fontSize: 13,
          marginHorizontal: 8,
        },
        toggleTextInactive: {
          color: "#DDD", // Brighter inactive text
        },
        toggleTextActive: {
          color: "#FFF",
          fontWeight: "600",
        },
        switch: {
          marginHorizontal: 8,
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
      centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1A1A1A",
      },
      card: {
        width: "100%",
        maxWidth: 500,
        backgroundColor: "rgba(26, 26, 26, 0.9)",
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "#00DDEB",
      },
      title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
      },
      subtitle: {
        fontSize: 16,
        color: "#a8dadc",
        textAlign: "center",
        marginBottom: 20,
      },
      highlight: {
        color: "#fff",
      },
      iconContainer: {
        alignItems: "center",
        marginBottom: 20,
      },
      detailsContainer: {
        marginBottom: 20,
      },
      detailText: {
        fontSize: 14,
        color: "#a8dadc",
        marginBottom: 8,
      },
      button: {
        backgroundColor: "#00DDEB",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
      },
      
      disabledSelector: {
        borderWidth: 1,
        borderColor: "#00DDEB",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        padding: 12,
      },
      selectorText: {
        fontSize: 16,
        color: "#fff",
      },
      paymentDetails: {
        marginBottom: 20,
      },
      tokenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      },
      tokenInfo: {
        flexDirection: "row",
        alignItems: "center",
      },
      tokenLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
      },
      tokenName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#fff",
      },
      tokenPrice: {
        fontSize: 12,
        color: "#a8dadc",
      },
      tokenAmount: {
        alignItems: "flex-end",
      },
      tokenAmountText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#fff",
      },
      tokenValue: {
        fontSize: 12,
        color: "#a8dadc",
      },
      divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
      },
      dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#00DDEB",
      },
      dividerText: {
        marginHorizontal: 10,
        fontSize: 14,
        color: "#a8dadc",
      },
      approvalCard: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
      },
      approvalText: {
        fontSize: 14,
        color: "#f39c12",
        fontWeight: "600",
        marginBottom: 10,
      },
      tokenSelectorContainer: {
        marginBottom: 20,
      },
      tokenSelector: {
        borderWidth: 1,
        borderColor: "#00DDEB",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        padding: 12,
      },
      tokenSelectorInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      tokenDropdown: {
        maxHeight: 200,
        backgroundColor: "#2d2d44",
        borderRadius: 8,
        marginTop: 5,
      },
      tokenItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
      },
    });
    
    export default PayInterFace;