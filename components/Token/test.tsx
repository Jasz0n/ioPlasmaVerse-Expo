import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
  ImageSourcePropType,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  getContract,
  defineChain,
  ADDRESS_ZERO,
  NATIVE_TOKEN_ADDRESS,
  prepareContractCall,
  getRpcClient,
  eth_getBalance,
  readContract,
} from "thirdweb";
import { allowance } from "thirdweb/extensions/erc20";
import {
  TransactionButton,
  useActiveAccount,
  useReadContract,
  useSendAndConfirmTransaction,
} from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { chainData, Token, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { useCurrency } from "@/constants/currency";
import { getAmountsIn, getAmountsOut } from "@/hooks/getAmounts";


// Define the Token type

type TupleType = readonly (readonly [string, string, boolean, string])[];

// SwapInput Component
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
  return (
    <ThemedView style={styles.swapInputContainer}>
      <View style={styles.swapInputRow}>
        <TextInput
          style={styles.swapInput}
          value={value}
          onChangeText={setValue}
          placeholder={`Enter ${type === "native" ? "From" : "To"} Amount`}
          placeholderTextColor="#A0A0A0"
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.tokenSelectorButton}
          onPress={() => setDropdownOpen(type)}
        >
          {selectedToken ? (
            <View style={styles.tokenSelectorContent}>
              <Image
                 source={
                  typeof selectedToken.image === 'string'
                    ? { uri: selectedToken.image }
                    : Array.isArray(selectedToken.image) || typeof selectedToken.image === 'number'
                    ? selectedToken.image
                    : { uri: selectedToken.image.toString() }
                }
                style={styles.tokenImage}
              />
              <ThemedText style={styles.tokenSymbol}>
                {selectedToken.symbol}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.tokenSelectorText}>Select Token</ThemedText>
          )}
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.balanceText}>
        Balance: {max || "0"}
      </ThemedText>
    </ThemedView>
  );
};

// Main SwapInterface Component
export default function Dex() {
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
    const {  WETH9, chainId , router: routerPlasma, tokenBalances, setChainId, setTokenList, updateBalances } = useCurrency();
  
    const [currentFrom, setCurrentFrom] = useState<string>("native");
    const [isApproving, setIsApproving] = useState(false);
  const NETWORK = defineChain(chainId);
  const [tokenA, setTokenA] = useState<Token | undefined>(undefined);
  const [tokenB, setTokenB] = useState<Token | undefined>(undefined);
  const [amountOut, setAmountOut] = useState<string>("");
  const [amountIn, setAmountIn] = useState("");
  const [buyingStep, setBuyingStep] = useState<string>("confirm");
  const [tokenSelectorVisible, setTokenSelectorVisible] = useState(false);
  const [selectTokenType, setSelectTokenType] = useState<"native" | "token">("native");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isFast, setIsFast] = useState(false);
  const [WETH, setWETH] = useState<Token | undefined>(undefined);
  const [feeAmount, setFeeAmount] = useState<bigint>(0n);
  const [tokenListData, setTokenListData] = useState<any[]>([]);
  const [amountOutBigInt, setAmountOutBigInt] = useState(0n);
  const [amountInBigInt, setAmountInBigint] = useState(0n);
  const [router, setRouter] = useState<string>("");
  const [factory, setFactoryAddress] = useState<string>("");
  const [fee, setFee] = useState<number>(0);
  const [bestRoute, setRoute] = useState<any>();
  const [dexStep, setDexStep] = useState<string>("");
  const BASE_GAS_PRICE = BigInt(1000000000000); // 1 Qev
  const FAST_GAS_PRICE = BigInt(1800000000000); // 1.2 Qev
  const gasPrice = isFast ? FAST_GAS_PRICE : BASE_GAS_PRICE;

  const feePath = {
    feeRecipient: "0x515D1BcEf9536075CC6ECe0ff21eCCa044Db9446",
    tokenIn: WETH9,
    amountIn: 0n,
    nativeIn: 0n,
  };

 

  const handleDropdownOpen = (type: "native" | "token") => {
    setTokenSelectorVisible(true);
    setSelectTokenType(type);
  };

  const handleAmountInChange = (value: string) => {
    setAmountIn(value);
    setCurrentFrom("A");
  };

  const handleAmountOutChange = (value: string) => {
    setAmountOut(value);
    setCurrentFrom("B");
  };

  const handleSelectToken = (token: Token, type: "native" | "token") => {
    type === "native" ? setTokenA(token) : setTokenB(token);
    setTokenSelectorVisible(false);
  };
  useEffect(() => {
    console.log("🔄 useEffect triggered (amountIn update)");
    const parsedAmountFloat = parseFloat(amountIn);
    if (isNaN(parsedAmountFloat) || parsedAmountFloat <= 0) {
    console.warn("⚠️ Invalid amountIn value:", amountIn);
    return;  // Early exit if the value is invalid
  }
  if (!tokenA) return;
  const parsedAmount = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));

    const fetchAmountsOut = async () => {
      if (currentFrom === "A" &&tokenA && tokenB && parsedAmount > 1n) {

        console.log("⚡ Calling getAmountsOut with:", { tokenA, tokenB, chainId, parsedAmount });

        try {
          const Amounts = await getAmountsOut(
            tokenA,
            tokenB,
             chainId,
             parsedAmount
            );
  
          console.log("📦 getAmountsOut response:", Amounts);
  
          if (!Amounts) {
            console.warn("⚠️ No amount received from getAmountsOut");
            return;
          }
  
          const formattedAmountOut = (Number(Amounts.bestAmountOut) / 10 ** tokenB.decimals).toFixed(4);
          console.log("🔹 Formatted Amount Out:", formattedAmountOut);
          const minAmountOut = (Amounts.bestAmountOut * BigInt(98)) / BigInt(100);
          setAmountOut(formattedAmountOut);
          setAmountOutBigInt(minAmountOut);
          setRouter(Amounts.routerAddress);
          setFee(Amounts.fee);
          setRoute(Amounts.route);
          setDexStep(Amounts.bestDex);
          setFactoryAddress(Amounts.factory);
  
        } catch (error) {
          console.error("❌ Error fetching amounts out:", error);
        }
      } else {
        console.warn("⚠️ fetchAmountsOut skipped: tokenA or tokenB is missing");
      }
    };
  
    fetchAmountsOut();
  }, [amountIn, tokenA, tokenB, chainId, currentFrom]);
  
  const handleApproval = async () => {
    if (!tokenA) throw Error;
    try {
      setLoading(true);
      setMessage("⏳ Approving ERC20 token...");
      const tokenContract = getContract({
        address: tokenA.contractAddress,
        client,
        chain: NETWORK,
      });

      /** ✅ Execute ERC-20 Approval Transaction */
      const transaction = await prepareContractCall({
              contract: tokenContract,
              method:
              "function approve(address spender, uint256 value) returns (bool)",
              params: [routerPlasma, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
                 
              });

      console.log("🔹 Transaction prepared:", transaction);
      return transaction;
    } catch (error) {
      setLoading(false);
      setMessage("❌ Approval failed. Please try again.");
      console.error("❌ Error in preparing transaction:", error);
      throw error;
    }
  };
  
  useEffect(() => {
    console.log("🔄 useEffect triggered (amountIn update)");
    console.log("✅ Dependencies:", { amountOut, currentFrom, tokenA, tokenB, chainId });
    const parsedAmountFloat = parseFloat(amountOut);
    if (isNaN(parsedAmountFloat) || parsedAmountFloat <= 0) {
    console.warn("⚠️ Invalid amountIn value:", amountOut);
    return;  // Early exit if the value is invalid
  }

    const fetchAmountsIn = async () => {
      if (currentFrom === "B" && tokenA && tokenB) {
        const parsedAmount = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));

        console.log("⚡ Calling getAmountsIn with:", { tokenA, tokenB, chainId, amountOut });

        try {
          const Amounts = await getAmountsIn(
            tokenA,
            tokenB,
            chainId,
            parsedAmount
          );
  
          console.log("📦 getAmountsIn response:", Amounts);
  
          if (!Amounts) {
            console.warn("⚠️ No amount received from getAmountsIn");
            return;
          }
  
          const formattedAmountOut = (
            (Number(Amounts.bestAmountOut) * 1.02) / // Increase by 1%
            10 ** (tokenA?.decimals || 18) // Default to 18 if decimals is undefined
          ).toFixed(6);
  
          console.log("🔹 Formatted Amount Out:", formattedAmountOut);
          const amountIn = (Amounts?.bestAmountOut || 1n) * BigInt(1001) / BigInt(1000);  

          setAmountIn(formattedAmountOut);
          setAmountInBigint(amountIn);
          setRouter(Amounts.routerAddress);
          setFactoryAddress(Amounts.factory)
          setFee(Amounts.fee);
          setRoute(Amounts.route);
          setDexStep(Amounts.bestDex);
  
        } catch (error) {
          console.error("❌ Error fetching amounts out:", error);
        }
      } else {
        console.warn("⚠️ fetchAmountsOut skipped: Either currentFrom is not 'B' or tokenA/tokenB is missing");
      }
    };
  
    fetchAmountsIn();
  }, [amountOut, currentFrom, tokenA, tokenB, chainId]);
  const savePoints = async (transactionHash: string, points: number) => {    
    const message = `✅ Successfully purchased! 🎉 ${account?.address} with this transaction you receive ${points} points`;
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
         
        }),
      });
  
      if (!res.ok) {
        const text = await res.text();
        console.error('❌ Raw response:', text);
        throw new Error(`API request failed: ${res.status} ${text}`);
      }
  
      const responseData = await res.json();
      console.log("🔹 API Response:", responseData);
  
      alert("✅ Points saved successfully!");
    } catch (err) {
      console.error("❌ Error saving points:", err);
    }
  };

  useEffect(() => {
      if (
        tokenA?.contractAddress === WETH9 &&
        tokenB?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      ) {
        setBuyingStep("approval");
      } else if (
        tokenA?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      ) {
        setBuyingStep("confirm");
      } else {
        setBuyingStep("approval");
      }
    }, [tokenA, tokenB, WETH9]);
  

  useEffect(() => {
    if (
      !tokenA || !tokenB
    ) {
      setTokenA(tokenBalances[0]);
      setTokenB(tokenBalances[1]);

    } 
  }, [tokenBalances]);
  
  const filteredTokens = tokenBalances.filter(
    (token) =>
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.contractAddress.toLowerCase().includes(search.toLowerCase())
  );

  const truncate = (value: string) => {
    if (!value) return "";
    return value.length > 5 ? value.slice(0, 5) : value;
  };

  return (
    <View>
      <ThemedView style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Swap OnChain Tokens
        </ThemedText>
.
        {/* Token Selector Modal */}
        <Modal
          visible={tokenSelectorVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setTokenSelectorVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>

            


             <View style={styles.modalHeader}>  
                <ThemedText style={styles.modalTitle}>Select Token</ThemedText>
                <TouchableOpacity onPress={() => setTokenSelectorVisible(false)}>
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search token..."
                placeholderTextColor="#A0A0A0"
              />
              <FlatList
                data={filteredTokens}
                keyExtractor={(item) => item.contractAddress}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tokenItem}
                    onPress={() => handleSelectToken(item, selectTokenType)}
                  >
                        <Image source={
                  typeof item.image === 'string'
                    ? { uri: item.image }
                    : Array.isArray(item.image) || typeof item.image === 'number'
                    ? item.image
                    : { uri: item.image }
                } style={styles.tokenImage} />

                    
                    

                    <View style={styles.tokenInfo}>
                      <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
                      <ThemedText style={styles.tokenSymbol}>{item.symbol}</ThemedText>
                    </View>
                    <ThemedText style={styles.tokenBalance}>
                      {truncate(item.balance || "0")}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <ThemedText style={styles.noTokensText}>No tokens found.</ThemedText>
                }
              />
            </ThemedView>
          </ThemedView>
        </Modal>

        {/* Swap Inputs */}
        {loading ? (
          <ActivityIndicator color="#A0A0A0" style={styles.loadingIndicator} />
        ) : (
          <View style={styles.swapInputsContainer}>
            {tokenBalances.length > 0 && (
              <>
                <SwapInput
                  type="native"
                  max={tokenA?.balance || "0"}
                  value={amountIn}
                  setValue={handleAmountInChange}
                  tokenList={tokenBalances}
                  setDropdownOpen={handleDropdownOpen}
                  onSelectToken={(token) => handleSelectToken(token, "native")}
                  selectedToken={tokenA}
                />
                <SwapInput
                  type="token"
                  max={tokenB?.balance || "0"}
                  value={amountOut}
                  setValue={handleAmountOutChange}
                  tokenList={tokenBalances}
                  setDropdownOpen={handleDropdownOpen}
                  onSelectToken={(token) => handleSelectToken(token, "token")}
                  selectedToken={tokenB}
                />
              </>
            )}
          </View>
        )}

        {/* Swap Message */}
        {message && (
          <ThemedView style={styles.messageContainer}>
            <ThemedText style={styles.messageText}>{message}</ThemedText>
          </ThemedView>
        )}

        {/* Approve/Swap Button Placeholder */}
        {buyingStep === "approval" && tokenA?.contractAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && (
                                    <ThemedView style={styles.actionButton}>
        
                          <TransactionButton
                          disabled={loading}
                          transaction={handleApproval}
                          onTransactionSent={() => {
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Approval failed. Please try again.");
                            console.error("❌ Approval Failed:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setBuyingStep("approval");
                            savePoints(txResult.transactionHash, 20)
                           
                          }}
                        >
               <ThemedText style={styles.noTokensText}>Approve Swap.</ThemedText>
        
                        </TransactionButton>
                        </ThemedView>
        
                        )}

               {buyingStep === "confirm" && currentFrom === "A" && tokenA && tokenB && (
                    <ThemedView style={styles.actionButton}>

                        {dexStep === "WrappedContract" && tokenA.contractAddress.toLowerCase() === WETH9.toLowerCase() ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");                      
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function withdraw(uint256 wed) payable",
                              params: [BigInt(Number(amountIn) * 10 ** 18)],
                              
                            })
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            updateBalances(chainId);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : tokenB.contractAddress.toLowerCase() === WETH9.toLowerCase() && dexStep === "WrappedContract" ? (
                          <TransactionButton  
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction..."); 
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function deposit() payable",
                              value: BigInt(Number(amountIn) * 10 ** 18),
                              
                            })                     
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            savePoints(txResult.transactionHash, 50);
                            updateBalances(chainId);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              `
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        
                        ) : dexStep === "Uniswapv2" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                              
                            
                            const minutes = 5; // Set deadline duration (5 minutes)
                            const deadline = Math.floor(Date.now() / 1000) + minutes * 60;
                            const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));
                                                     
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            
                                            const path =  
                                            {
                                             path: bestRoute, 
                                             SwapToNative: swapToNative,
                                             factory: factory,
                                             nativeIn: nativeIn
                   
                                           };
                                            
                                                  
                                          return  prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma}),
                              method: 
                              "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, (address[] path, bool SwapToNative, address factory, uint256 nativeIn) path, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, uint256 deadline) payable returns (uint256[] amounts)",
                
                              params: [parsedAmountIn,amountOutBigInt,path, feePath, account?.address || "",BigInt(deadline)],
                              value: nativeIn,
                              
                            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setMessage(
                              "✅ Swap Successful! 🎉 "
                              
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Multi" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals)); 
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountIn: parsedAmountIn,
                                              amountOutMinimum: 0n,
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                                            };
                                           
                                          
                            return           prepareContractCall({
                                              contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                              params: [params, feePath, router, true],
                                              value: nativeIn,
                                                
                                                });
                                                setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            setLoading(false);
                            savePoints(txResult.transactionHash, 50);
                            setMessage(
                              `✅ Swap Successful! 🎉
                              `
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Single" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));
 
                    
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                           const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                          
                                            const params = {
                                              tokenIn: tokenIn.toString(), 
                                              tokenOut: tokenOut.toString(), 
                                              fee: fee,
                                              recipient: account?.address || "",
                                              amountIn: parsedAmountIn,
                                              amountOutMinimum: amountOutBigInt,
                                              sqrtPriceLimitX96:0n,
                    
                                            };
                                            console.log("router",router)
                                            
                                           
                    
                            return           prepareContractCall({
                                         contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                              params: [params, feePath, router,true, swapToNative],
                                              value: nativeIn,
                                             
                                            });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 `
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                           ) : dexStep === "Quickswap" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));
  
                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                              const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                              const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                              const nativeIn = nativeAmount + feePath.nativeIn;
                              const params = {
                                      tokenIn: tokenIn.toString(), 
                                      tokenOut: tokenOut.toString(), 
                                      fee: fee,
                                      recipient: account?.address || "",
                                      amountIn: parsedAmountIn,
                                      amountOutMinimum: amountOutBigInt,
                                      sqrtPriceLimitX96:0n,
                    
                                     };
                                              
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                                params: [params, feePath, router,false, swapToNative],
                                                value: nativeIn,
                                                });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              updateBalances(chainId);
                              savePoints(txResult.transactionHash, 50);
                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉 `
                              );
                            }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                          ) : dexStep === "QuickswapMulti" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));
 
                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                              const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                              const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                              const nativeIn = nativeAmount + feePath.nativeIn;
                              const params = {
                                    path: bestRoute, // Example tokenIn address
                                    recipient: account?.address || "",
                                    amountIn: parsedAmountIn,
                                    amountOutMinimum: amountOutBigInt,
                                    tokenIn: tokenIn,
                                    tokenOut: tokenOut,
                                    swapToNative: swapToNative
                                              };
                                              
                                            
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                                params: [params, feePath, router, false],
                                                value: nativeIn,
                                                                    });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              updateBalances(chainId);
                              savePoints(txResult.transactionHash, 50);

                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉 `
                              );
                            }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                            const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));                    
                           
                           
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const route: TupleType = bestRoute;
                                            const routes = route?.map((entry) => {
                                              const [from, to, stable, factory] = entry; // Explicit destructuring
                                              return {
                                                from:from, // Ensure it's a string
                                                to: to,     // Ensure it's a string
                                                stable:stable, // Ensure it's a boolean
                                                factory: factory, // Ensure it's a string
                                              };
                                            }) || [];
                                            
                                            
                                            // Ensure the routes array has the correct structure
                                            if (routes.some(route => typeof route.from !== "string" || typeof route.to !== "string")) {
                                              throw new Error("Invalid route structure.");
                                            }
                                            
                                          const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                          const nativeIn = nativeAmount + feePath.nativeIn;
                
                            return          prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma,}),
                              method: 
                              "function swapExactTokensForTokensVeldrome(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, address router, uint256 nativeIn, bool SwapToNative) payable returns (uint256[] amountOut)",
                              params: [parsedAmountIn, amountOutBigInt, routes, feePath, account?.address || "", router,nativeIn , swapToNative],
                              value: nativeIn,
                              });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 `
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        )}
                      </ThemedView>
                              )}  
                
                
                              
                
                
                              {buyingStep === "confirm" && currentFrom === "B" && tokenA && tokenB && (
                         <ThemedView style={styles.actionButton}>

                        {dexStep === "WrappedContract" && tokenA.contractAddress.toLowerCase() === WETH9.toLowerCase() ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");                      
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function withdraw(uint256 wed) payable",
                              params: [BigInt(Math.floor(parseFloat(amountIn) * 10 ** 18))],

                            })
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 `
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : tokenB.contractAddress.toLowerCase() === WETH9.toLowerCase() && dexStep === "WrappedContract" ? (
                          <TransactionButton  
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction..."); 
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function deposit() payable",
                              value: BigInt(Math.floor(parseFloat(amountIn) * 10 ** 18)),
                                         })                     
                            setMessage("📤 Transaction sent. Waiting for confirmation...");

                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        
                        ) : dexStep === "Uniswapv2" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            ); 
                            const parsedAmountOut = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));
    
                           
                    
                            
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                              const minutes = 5; // Set deadline duration (5 minutes)
                                              const deadline = Math.floor(Date.now() / 1000) + minutes * 60;
                                            const path =  
                                            {
                                             path: bestRoute, 
                                             SwapToNative: swapToNative,
                                             factory: factory,
                                             nativeIn: nativeAmount
                   
                                           };
                                            
                                                  
                                          return  prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma}),
                              method: 
                              "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, (address[] path, bool SwapToNative, address factory, uint256 nativeIn) path, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, uint256 deadline) payable returns (uint256[] amounts)",
                              params: [parsedAmountOut,amountInBigInt, path, feePath, account?.address || "", BigInt(deadline)],
                              value: nativeIn,                              
                            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {     
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                          
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Multi" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            const parsedAmountOut = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));

                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,                            
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                                            };
                                           
                                        
                    
                            return           prepareContractCall({
                                              contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                              params: [params, feePath, router, true],
                                              value: nativeIn,
                                               
                                                });
                                                setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            setLoading(false);
                            savePoints(txResult.transactionHash, 50);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Single" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            const parsedAmountOut = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));
 
                             
                    
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                           const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                           const nativeIn = nativeAmount + feePath.nativeIn;
                                          
                                            const params = {
                                              tokenIn: tokenIn.toString(), 
                                              tokenOut: tokenOut.toString(), 
                                              fee: fee,
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,
                                              sqrtPriceLimitX96:0n,
                    
                                            };
                                            console.log("router",router)
                                            
                    
                            return           prepareContractCall({
                                         contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                              params: [params, feePath, router,true, swapToNative],
                                              value: nativeIn,
                                             
                                            });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                           ) : dexStep === "Quickswap" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(
                                Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                              );  
                              const parsedAmountOut = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));

                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                            const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                            const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                              const nativeIn = nativeAmount + feePath.nativeIn;
                                              const params = {
                                                tokenIn: tokenIn.toString(), 
                                                tokenOut: tokenOut.toString(), 
                                                fee: fee,
                                                recipient: account?.address || "",
                                                amountOut: parsedAmountOut,
                                                amountInMaximum: amountInBigInt,
                                                sqrtPriceLimitX96:0n,
                    
                                              };
                                              
                                              
                                            
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                                params: [params, feePath, router,false, swapToNative],
                                                value: nativeIn,
                                                                    });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              updateBalances(chainId);
                              savePoints(txResult.transactionHash, 50);
                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉`
                              );
                            }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        ) : dexStep === "QuickswapMulti" ? (
                    
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                            const parsedAmountOut = BigInt(Math.floor(parseFloat(amountOut) * 10 ** tokenB.decimals));

                    
                                     
                            console.log("router",router)
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                          const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                          const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                  
                                            };
                                            
                                            
                                          
                  
                            return           prepareContractCall({
                                        contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                               params: [params, feePath, router, false],
                                              value: nativeIn,
                                                                       });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            updateBalances(chainId);
                            savePoints(txResult.transactionHash, 50);
                            setMessage(
                              `✅ Swap Successful! 🎉`
                            );
                          }}
                      >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                  
                      </TransactionButton>
                        ) : (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                              
                            const parsedAmountIn = BigInt(Math.floor(parseFloat(amountIn) * 10 ** tokenA.decimals));

                           
                           
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const route: TupleType = bestRoute;
                                            const routes = route?.map((entry) => {
                                              const [from, to, stable, factory] = entry; // Explicit destructuring
                                              return {
                                                from:from, // Ensure it's a string
                                                to: to,     // Ensure it's a string
                                                stable:stable, // Ensure it's a boolean
                                                factory: factory, // Ensure it's a string
                                              };
                                            }) || [];
                                            
                                            
                                            // Ensure the routes array has the correct structure
                                            if (routes.some(route => typeof route.from !== "string" || typeof route.to !== "string")) {
                                              throw new Error("Invalid route structure.");
                                            }
                                            
                                          const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                          const nativeIn = nativeAmount + feePath.nativeIn;
                                
                    
                    
                            return          prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma,}),
                              method: 
                              "function swapExactTokensForTokensVeldrome(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, address router, uint256 nativeIn, bool SwapToNative) payable returns (uint256[] amountOut)",
                              params: [parsedAmountIn, 0n, routes, feePath, account?.address || "", router,nativeIn , swapToNative],
                              value: nativeIn,
                                       });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            updateBalances(chainId);
                            setMessage(
                              `✅ Swap Successful! 🎉 `
                            );
                          }}
                        >
                    <ThemedText style={styles.noTokensText}>{loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}</ThemedText>
                    
                        </TransactionButton>
                        )}
                        </ThemedView>
              )} 
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: '100%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Match dark theme
    paddingBottom: 70,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  swapInputsContainer: {
    gap: 16,
  },
  swapInputContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  swapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swapInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#444',
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
  },
  tokenSelectorButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  tokenSelectorText: {
    color: '#A0A0A0',
    fontSize: 16,
  },
  tokenSymbol: {
    color: '#fff',
    fontSize: 16,
  },
  balanceText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#333',
    marginBottom: 8,
  },
  tokenInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tokenName: {
    fontSize: 16,
    color: '#fff',
  },
  tokenBalance: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  noTokensText: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginVertical: 16,
  },
  messageContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingIndicator: {
    marginVertical: 16,
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
});