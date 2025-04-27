import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, Alert, Modal, Platform, TextInput, FlatList, Image, ScrollView } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import WebView, { WebViewNavigation } from "react-native-webview";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { useConnectionManager } from "thirdweb/react";
import { Account, createWalletConnectClient, createWalletConnectSession, DefaultWalletConnectRequestHandlers, WalletConnectClient, type Wallet } from "thirdweb/wallets";
import { Address, defineChain, estimateGas, eth_blockNumber, eth_call, eth_estimateGas, eth_gasPrice, eth_getBalance, eth_getTransactionByHash, eth_getTransactionCount, eth_getTransactionReceipt, getRpcClient, Hex } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { getGasPrice, toHex } from "thirdweb";
import { WalletConnectRequestError, WalletConnectSignRequestPrams, WalletConnectTransactionRequestParams, WalletConnectSwitchEthereumChainRequestParams, WalletConnectSignTypedDataRequestParams, WalletConnectRawTransactionRequestParams, WalletConnectAddEthereumChainRequestParams } from "thirdweb/dist/types/wallets/wallet-connect/receiver/types";

// Define types for JSON-RPC requests and responses
type JsonRpcRequest = {
  id: number;
  method: string;
  params: any[];
  jsonrpc: "2.0";
};

type JsonRpcResponse = {
  id: number;
  result?: any;
  error?: { code: number; message: string };
  jsonrpc: "2.0";
};

type Tab = {
  id: string;
  url: string;
  title?: string;
  favicon?: string;
  wcSession?: any; // WalletConnect session
};

type DecodedTransaction = {
  functionName: string;
  params: { name: string; type: string; value: any }[];
  extraDecoded?: any;
};

export default function DappBrowserScreen() {
  const router = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://react-app.walletconnect.com/" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showTabManager, setShowTabManager] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const webViewRefs = useRef<Map<string, WebView>>(new Map());
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [chainSwitchRequest, setChainSwitchRequest] = useState<{ chainId: number; id: number; tabId: string } | null>(null);const [chainSwitchResolve, setChainSwitchResolve] = useState<((value: void) => void) | null>(null);
const [chainSwitchReject, setChainSwitchReject] = useState<((reason: Error) => void) | null>(null);

const [chainAddRequest, setChainAddRequest] = useState<{
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls?: string[];
} | null>(null);
const [chainAddResolve, setChainAddResolve] = useState<((value: void) => void) | null>(null);
const [chainAddReject, setChainAddReject] = useState<((reason: Error) => void) | null>(null);



  const [showTxModal, setShowTxModal] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);  
    const [txDetails, setTxDetails] = useState<{
      to: string;
      value: string;
      gas: string;
      gasPrice: string;
      data: string;
      decoded?: DecodedTransaction;
    } | null>(null);
    const [txResolve, setTxResolve] = useState<((value: void) => void) | null>(null);
    const [txReject, setTxReject] = useState<((reason: Error) => void) | null>(null);
    const [connectResolve, setConnectResolve] = useState<((value: void) => void) | null>(null);
    const [connectReject, setConnectReject] = useState<((reason: Error) => void) | null>(null);
  const connectionManager = useConnectionManager();
  const  [chain, setChain] = useState(1);
  const chainID = toHex(chain);
  const [wcClient, setWcClient] = useState<WalletConnectClient | null>(null);
  const [wcUri, setWcUri] = useState<string | null>(null);
  const rpcRequest = getRpcClient({ client, chain: defineChain(chain) });

    
  
   useEffect(() => {
      if (!account || !wallet) {
        Alert.alert("Error", "Please connect a wallet first.");
        router.back();
        return;
      }
      connectionManager.defineChains([defineChain(1), defineChain(4689), defineChain(10)]);
      connectionManager.connect(wallet, { client });
      setChain(connectionManager.activeWalletChainStore.getValue()?.id || 1); 
      const initWalletConnect = async () => {
        try {
          const customHandlers: {
            [key: string]: (_: { account: Account; chainId: number; params: unknown[] }) => Promise<Hex | WalletConnectRequestError>;
          } = {
            personal_sign: async ({ account, params }) => {
              const [message, address] = params as WalletConnectSignRequestPrams; // [string, Address]
              if (address.toLowerCase() !== account.address.toLowerCase()) {
                throw { code: 4001, message: "Address mismatch" } as WalletConnectRequestError;
              }
              const decodedMessage = Buffer.from(message.slice(2), "hex").toString();
              return await account.signMessage({ message: decodedMessage }); // Returns Hex
            },
            eth_sign: async ({ account, params }) => {
              const [address, message] = params as WalletConnectSignRequestPrams; // [string, Address], order differs
              if (address.toLowerCase() !== account.address.toLowerCase()) {
                throw { code: 4001, message: "Address mismatch" } as WalletConnectRequestError;
              }
              const decodedMessage = Buffer.from(message.slice(2), "hex").toString();
              return await account.signMessage({ message: decodedMessage }); // Returns Hex
            },
            eth_signTransaction: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectTransactionRequestParams;
              
              return await DefaultWalletConnectRequestHandlers.eth_signTransaction({
                account,
                params: [prams],
              });
            },
            eth_sendTransaction: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectTransactionRequestParams;
              const gas = await eth_estimateGas(rpcRequest, {
                from: prams.from,
                to: prams.to,
                data: prams.data,
                value: prams.value || "0x0" as `0x${string}` 
                })
  
                const price = await eth_gasPrice(rpcRequest)
                const nonce = prams.nonce
                      ? parseInt(prams.nonce, 16)
                      : await eth_getTransactionCount(rpcRequest, { address: account.address });
                    console.log("Fetched nonce:", nonce);
                const transaction = {
                  from: prams.from,
                  to: prams.to,
                  data: prams.data,
                  value: prams.value || "0x0" as `0x${string}`,
                  gas: prams.gas || toHex(gas),
                  gasPrice: prams.gasPrice || toHex(price),
                  nonce: prams.nonce || toHex(nonce),
                }
              return await DefaultWalletConnectRequestHandlers.eth_sendTransaction({
                account,
                chainId,
                thirdwebClient: client,
                params: [transaction],
              }); 
            },
            eth_sendRawTransaction: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectRawTransactionRequestParams; 
              return await DefaultWalletConnectRequestHandlers.eth_sendRawTransaction({
                account,
                chainId,
                params: [prams],
              });
            },
            wallet_switchEthereumChain: async ({ account, chainId, params }) => {
              const [switchParams] = params as WalletConnectSwitchEthereumChainRequestParams; // [{ chainId: Hex }]
              const newChainId = parseInt(switchParams.chainId.slice(2), 16);
              await wallet.switchChain(defineChain(chainId)); // Assumes switchChain takes a number
              return switchParams.chainId as Hex; // Return hex chainId
            },
            eth_signTypedData: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectSignTypedDataRequestParams; // [{ chainId: Hex }]
              return await DefaultWalletConnectRequestHandlers.eth_signTypedData({
                account,
                params: [ account.address as `0x${string}` ,prams],
              });
            },
            eth_signTypedData_v4: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectSignTypedDataRequestParams;
              return await DefaultWalletConnectRequestHandlers.eth_signTypedData_v4({
                account,
                params: [ account.address as `0x${string}` ,prams],
              });
            },
            wallet_addEthereumChain: async ({ account, chainId, params }) => {
              const [prams] = params as WalletConnectAddEthereumChainRequestParams;
              return await DefaultWalletConnectRequestHandlers.wallet_addEthereumChain({
                wallet,
                params: [prams],
              });
            },
            
          };
    
          const wc = await createWalletConnectClient({
            client,
            wallet,
            chains: [defineChain(1), defineChain(4689), defineChain(10)],
            requestHandlers: customHandlers,
            onConnect: (session) => {
              console.log("WalletConnect session connected:", session);
              setTabs(prev => prev.map(tab =>
                tab.id === activeTabId ? { ...tab, wcSession: session } : tab
              ));
            },
            onDisconnect: (session) => {
              console.log("WalletConnect session disconnected:", session);
              setTabs(prev => prev.map(tab =>
                tab.wcSession?.topic === session.topic ? { ...tab, wcSession: undefined } : tab
              ));
            },
            onError: (error) => {
              console.error("WalletConnect error:", error);
              Alert.alert("WalletConnect Error", error.message);
            },
          });
          setWcClient(wc);
        } catch (error) {
          console.error("Failed to initialize WalletConnect:", error);
        }
      };
    
      initWalletConnect();
    }, [account, wallet, connectionManager]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const addNewTab = (url: string) => {
    const newTabId = (tabs.length + 1).toString();
    setTabs([...tabs, { id: newTabId, url }]);
    setActiveTabId(newTabId);
    setShowTabManager(false);
    setNewUrl("");
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    if (newTabs.length === 0) {
      setIsModalVisible(false);
      router.back();
      return;
    }
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId);
    setShowTabManager(false);
  };

  const goBack = () => {
    const webView = webViewRefs.current.get(activeTabId);
    if (webView && webView.goBack) {
      console.log("Going back in WebView");
      webView.goBack();
    } else {
      console.log("Closing modal and navigating back");
      setIsModalVisible(false);
      router.back();
    }
  };

  const decodeTxData = async (data: string): Promise<DecodedTransaction | null> => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/getTransaction/function?input=${data}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.transaction) {
        return result.transaction;
      } else {
        console.error("Failed to decode transaction:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Error calling decodeTransaction API:", error);
      return null;
    }
  };

  const handleNavigationStateChange = (tabId: string, navState: { canGoBack: boolean; url: string; title?: string }) => {
    console.log("Navigation state changed for tab", tabId, ":", navState);
    setTabs(tabs =>
      tabs.map(tab =>
        tab.id === tabId ? { ...tab, canGoBack: navState.canGoBack, title: navState.title || tab.url } : tab
      )
    );
    // Attempt to fetch favicon
    const faviconUrl = `${new URL(navState.url).origin}/favicon.ico`;
    setTabs(tabs =>
      tabs.map(tab =>
        tab.id === tabId ? { ...tab, favicon: faviconUrl } : tab
      )
    );
  };
  const handleWeb3Request = async (data: string, tabId: string) => {
    console.log(`Received Web3 request for tab ${tabId}:`, data);
  
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse Web3 request:", error);
      return;
    }
  
    if (parsed.type === "wc_uri" && parsed.uri && wcClient) {
      console.log("Initiating WalletConnect session with URI:", parsed.uri);
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) {
        console.error("Tab not found for ID:", tabId);
        return;
      }
  
      const uriParams = new URLSearchParams(parsed.uri.split("?")[1] || "");
      const sessionTopic = uriParams.get("sessionTopic");
  
      if (sessionTopic) {
        const existingTab = tabs.find(t => t.wcSession?.topic === sessionTopic);
        if (existingTab) {
          console.log("Session already exists for topic:", sessionTopic, "in tab:", existingTab.id);
          if (existingTab.id !== tabId) {
            setActiveTabId(existingTab.id);
          }
          return;
        }
        console.log("Associating existing session topic:", sessionTopic, "with tab:", tabId);
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, wcSession: { topic: sessionTopic } } : t
        ));
      } else if (!tab.wcSession) {
        setWcUri(parsed.uri);
        try {
          await createWalletConnectSession({
            walletConnectClient: wcClient,
            uri: parsed.uri,
          });
          // Note: onConnect already updates tabs with the session
        } catch (error) {
          console.error("Failed to create WalletConnect session:", error);
        }
      }
      return;
    }
  
    const request: JsonRpcRequest = parsed;
    const { method, params, id } = request;
    const tab = tabs.find(t => t.id === tabId);
  
    if (!account || !wallet) {
      sendError(id, -32603, "No account available", tabId);
      return;
    }
  
    // WalletConnect handling
    if (tab?.wcSession && wcClient) {
      try {
        const response = await wcClient.request({
          topic: tab.wcSession.topic,
          chainId: `eip155:${chain}`,
          request: { method, params },
        });
        sendResponse(id, response, tabId);
      } catch (error) {
        sendError(id, -32603, (error as Error).message, tabId);
      }
      return;
    }
  
    // MetaMask-style handling
    try {
      switch (method) {
        case "wallet_requestPermissions":
          console.log("Handling wallet_requestPermissions:", params);
          if (isConnected && account) {
            sendResponse(id, [{ parentCapability: "eth_accounts", caveats: [] }], tabId);
          } else {
            sendError(id, -32603, "Not connected", tabId);
          }
          break;
  
        case "wallet_getPermissions":
          console.log("Handling wallet_getPermissions");
          if (isConnected && account) {
            sendResponse(id, [{ parentCapability: "eth_accounts", caveats: [] }], tabId);
          } else {
            sendResponse(id, [], tabId);
          }
          break;
       case "eth_requestAccounts":
                 console.log("Handling eth_requestAccounts");
                 setShowConnectModal(true);
                 await new Promise<void>((resolve, reject) => {
                   setConnectResolve(() => resolve);
                   setConnectReject(() => reject);
                 });
                 try {
                   await connectionManager.connect(wallet, {
                     client: client,
                     onConnect: (connectedWallet) => {
                       const address = connectedWallet.getAccount()?.address;
                       console.log("Connected wallet address:", address);
                       setIsConnected(true);
                       if (address) {
                         sendResponse(id, [address], tabId);
                         emitConnectEvent(address, tabId);
                       } else {
                         sendError(id, -32603, "No address available after connection", tabId);
                       }
                     },
                   });
                 } catch (error) {
                   console.error("Connection failed:", error);
                   sendError(id, -32603, "Failed to connect: " + (error as Error).message, tabId);
                 }
                 break;

        case "eth_accounts":
          console.log("Handling eth_accounts");
          if (isConnected) {
            const activeAccount = connectionManager.activeAccountStore.getValue();
            sendResponse(id, activeAccount ? [activeAccount.address] : [], tabId);
          } else {
            sendResponse(id, [], tabId);
          }
          break;

        case "eth_chainId":
          console.log("Handling eth_chainId");
          sendResponse(id, chainID, tabId);
          break;
          case "net_version":
            console.log("Handling net_version");
            const netChain = connectionManager.activeWalletChainStore.getValue();
            sendResponse(id, chainID, tabId);
            break;
            case "wallet_switchEthereumChain":
        const [chainInfo] = params;
        const requestedChainId = parseInt(chainInfo.chainId, 16);
        if (chain === requestedChainId) {
          sendResponse(id, null, tabId);
        } else {
          setChainSwitchRequest({ chainId: requestedChainId, id, tabId });
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error("Chain switch timed out")), 30000);
              const resolveWithClear = () => {
                clearTimeout(timeout);
                resolve();
              };
              const rejectWithClear = (reason: Error) => {
                clearTimeout(timeout);
                reject(reason);
              };
              setChainSwitchResolve(() => resolveWithClear);
              setChainSwitchReject(() => rejectWithClear);
            });
            await connectionManager.switchActiveWalletChain(defineChain(requestedChainId));
            sendResponse(id, null, tabId);
            emitConnectEvent(account.address, tabId); // Update chainId in dApp
          } catch (error) {
            sendError(id, 4902, (error as Error).message || "Failed to switch chain", tabId);
          }
        }
        break;
  
        case "wallet_addEthereumChain":
          console.log("Handling wallet_addEthereumChain:", params);
          const [newChainInfo] = params;
          const chainId = parseInt(newChainInfo.chainId, 16);
          const currentChainForAdd = connectionManager.activeWalletChainStore.getValue();
          if (currentChainForAdd?.id === chainId) {
            sendResponse(id, null, tabId); // Already on the correct chain
          } else {
            try {
              // Since Thirdweb supports all EVM chains, we can treat this as a switch
              const newChain = defineChain(chainId);
              // Show confirmation modal
              setChainAddRequest({
                chainId,
                chainName: newChainInfo.chainName,
                rpcUrls: newChainInfo.rpcUrls,
                nativeCurrency: newChainInfo.nativeCurrency,
                blockExplorerUrls: newChainInfo.blockExplorerUrls,
              });
              await new Promise<void>((resolve, reject) => {
                setChainAddResolve(() => resolve);
                setChainAddReject(() => reject);
              });
              await connectionManager.switchActiveWalletChain(newChain);
              sendResponse(id, null, tabId);
            } catch (error) {
              sendError(id, 4902, (error as Error).message || "Failed to add chain", tabId);
            }
          }
          break;
  
        case "eth_gasPrice":
          console.log("Handling eth_gasPrice");
          const gasPriceInfo = await eth_gasPrice(rpcRequest);
          sendResponse(id, `0x${gasPriceInfo.toString(16)}`, tabId);
          break;

        case "eth_getBalance":
          console.log("Handling eth_getBalance:", params);
          const [address] = params;
          const balance = await eth_getBalance(rpcRequest, { address: account.address });
          sendResponse(id, `0x${balance.toString(16)}`, tabId);
          break;

        case "eth_blockNumber":
          console.log("Handling eth_blockNumber");
          const blockNumbe = await eth_blockNumber(rpcRequest);
          sendResponse(id, `0x${blockNumbe.toString(16)}`, tabId);
          break;

        case "eth_sendTransaction":
                  if (!account) return;
                  console.log("Handling eth_sendTransaction:", params[0]);
                  const txRaw = params[0] as { to: string; value: string; data?: string; gas?: string; nonce?: string; from?: string; gasPrice: string };
        
                  if (txRaw.from && txRaw.from.toLowerCase() !== account.address.toLowerCase()) {
                    throw new Error("Transaction 'from' address does not match active account");
                  }
        
                  const gasPrice = chain === 4689 ?  1000000000000n : await eth_gasPrice(rpcRequest);
                  console.log("Fetched gasPrice:", gasPrice.toString());
        
                  const nonce = txRaw.nonce
                    ? parseInt(txRaw.nonce, 16)
                    : await eth_getTransactionCount(rpcRequest, { address: account.address });
                  console.log("Fetched nonce:", nonce);
        
                  const tx = {
                    chainId: chain,
                    chain: defineChain(chain),
                    client: client,
                    to: txRaw.to as Address,
                    value: BigInt(txRaw.value || "0x0"),
                    data: (txRaw.data || "0x") as `0x${string}`,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    gas: txRaw.gas ? BigInt(txRaw.gas) : undefined,
                  };
        
                  const functionSelector = tx.data.slice(0, 10);
                  console.log("Function selector:", functionSelector);
                  let gas = 1000000n;
                  if (!tx.gas) {
                    try {
                      if (account.estimateGas) {
                        gas = await account.estimateGas(tx);
                      }
                      tx.gas = gas;
                      console.log("Estimated gas:", gas.toString());
                    } catch (gasError) {
                      console.error("Gas estimation failed:", gasError);
                      tx.gas = functionSelector === "0x095ea7b3" ? BigInt(70000) : BigInt(200000);
                      console.log("Using fallback gas limit:", tx.gas.toString());
                    }
                  }
        
                  // Decode the transaction data
                  const decodedTx = await decodeTxData(tx.data);
        
                  // Prepare transaction details for the modal
                  const txDetails = {
                    to: tx.to.toString(),
                    value: tx.value.toString(),
                    gas: tx.gas.toString(),
                    gasPrice: tx.gasPrice.toString(),
                    data: tx.data.slice(0, 20) + "...",
                    decoded: decodedTx || undefined,
                  };
        
                  // Show the custom modal
                  setTxDetails(txDetails);
                  setShowTxModal(true);
        
                  // Wait for user confirmation
                  await new Promise<void>((resolve, reject) => {
                    setTxResolve(() => resolve);
                    setTxReject(() => reject);
                  });
        
                  console.log("Sending transaction with params:", tx);
                  const txResponse = await account.sendTransaction(tx);
                  console.log("Transaction hash:", txResponse.transactionHash);
                  sendResponse(id, txResponse.transactionHash, tabId);
                  break;

        case "eth_getTransactionReceipt":
          console.log("Handling eth_getTransactionReceipt:", params[0]);
          const receiptHash = params[0] as string;

          const maxAttempts = 10;
          const retryInterval = 5000;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const receipt = await eth_getTransactionReceipt(rpcRequest, {
                hash: receiptHash as `0x${string}`,
              });
              const formattedReceipt = {
                transactionHash: receipt.transactionHash,
                transactionIndex: toHex(receipt.transactionIndex),
                blockHash: receipt.blockHash,
                blockNumber: toHex(receipt.blockNumber),
                from: receipt.from,
                to: receipt.to,
                gasUsed: toHex(receipt.gasUsed),
                cumulativeGasUsed: toHex(receipt.cumulativeGasUsed),
                contractAddress: receipt.contractAddress || null,
                logs: receipt.logs.map(log => ({
                  address: log.address,
                  topics: log.topics,
                  data: log.data,
                  logIndex: toHex(log.logIndex),
                  transactionIndex: toHex(log.transactionIndex),
                  transactionHash: log.transactionHash,
                  blockHash: log.blockHash,
                  blockNumber: toHex(log.blockNumber),
                })),
                status: receipt.status === "success" ? "0x1" : "0x0",
              };
              console.log("Transaction receipt found on attempt", attempt, ":", formattedReceipt);
              sendResponse(id, formattedReceipt, tabId);
              return;
            } catch (error: any) {
              if (error.message.includes("Transaction receipt not found")) {
                console.log(`Attempt ${attempt}/${maxAttempts}: Receipt not yet available for:`, receiptHash);
                if (attempt === maxAttempts) {
                  console.log("Max attempts reached, returning null for:", receiptHash);
                  sendResponse(id, null, tabId);
                  return;
                }
                await new Promise(resolve => setTimeout(resolve, retryInterval));
              } else {
                console.error("Error fetching transaction receipt:", error);
                sendError(id, -32603, error.message || "Internal error", tabId);
                return;
              }
            }
          }
          break;

        case "eth_getTransactionByHash":
          console.log("Handling eth_getTransactionByHash:", params[0]);
          const txHash = params[0] as string;
          const txData = await eth_getTransactionByHash(rpcRequest, {
            hash: txHash as `0x${string}`,
          });

          const formattedTx = {
            hash: txData.hash,
            to: txData.to,
            from: txData.from,
            value: toHex(txData.value),
            data: txData.input,
            gas: toHex(txData.gas),
            gasPrice: toHex(txData.gasPrice || BigInt(0)),
            nonce: toHex(txData.nonce),
            blockNumber: txData.blockNumber ? toHex(txData.blockNumber) : null,
            blockHash: txData.blockHash || null,
            transactionIndex: txData.transactionIndex !== undefined ? toHex(txData.transactionIndex?.toString() || "") : null,
          };
          console.log("Transaction data:", formattedTx);
          sendResponse(id, formattedTx, tabId);
          break;
          case "eth_getTransactionCount":
            console.log("Handling eth_getTransactionCount:", params);
            const txCount = await eth_getTransactionCount(rpcRequest, { address: account?.address });
            sendResponse(id, `0x${txCount.toString(16)}`, tabId);
            break;
    
          case "eth_estimateGas":
            console.log("Handling eth_estimateGas:", params);
            const [txParams] = params;
            const gasEstimate = await eth_estimateGas(rpcRequest, {
              to: txParams.to as Address,
              data: (txParams.data || "0x") as `0x${string}`,
              value: txParams.value || "0x0" as `0x${string}`,
              from: txParams.from || account.address,
            });
            sendResponse(id, `0x${gasEstimate.toString(16)}`, tabId);
            break;
    
          case "eth_getCode":
            console.log("Handling eth_getCode:", params);
            const [codeAddress, codeBlockTag = "latest"] = params;
            const code = await rpcRequest({
              method: "eth_getCode",
              params: [codeAddress, codeBlockTag],
            });
            sendResponse(id, code, tabId);
            break;
    
          case "eth_getStorageAt":
            console.log("Handling eth_getStorageAt:", params);
            const [storageAddress, position, storageBlockTag = "latest"] = params;
            const storage = await rpcRequest({
              method: "eth_getStorageAt",
              params: [storageAddress, position, storageBlockTag],
            });
            sendResponse(id, storage, tabId);
            break;
    
          case "eth_getBlockByNumber":
            console.log("Handling eth_getBlockByNumber:", params);
            const [blockNumber, fullTx = false] = params;
            const blockByNumber = await rpcRequest({
              method: "eth_getBlockByNumber",
              params: [blockNumber, fullTx],
            });
            sendResponse(id, blockByNumber, tabId);
            break;
    
          case "eth_getBlockByHash":
            console.log("Handling eth_getBlockByHash:", params);
            const [blockHash, fullTxHash = false] = params;
            const blockByHash = await rpcRequest({
              method: "eth_getBlockByHash",
              params: [blockHash, fullTxHash],
            });
            sendResponse(id, blockByHash, tabId);
            break;
    
        case "personal_sign":
          console.log("Handling personal_sign:", params);
          const message = params[0];
          const decodedMessage = Buffer.from(message.slice(2), "hex").toString();
          let signature = await account.signMessage({ message: decodedMessage });
          console.log("Generated signature (no prefix):", signature);
          sendResponse(id, signature, tabId);
          break;

        case "eth_call":
          console.log("Handling eth_call:", params);
          const [callData] = params;
          const { to, data } = callData;
          const result = await eth_call(rpcRequest, {
            to: to as Address,
            data: data as `0x${string}`,
          });

          console.log("eth_call result:", result);
          sendResponse(id, result, tabId);
          break;
        // Add other MetaMask methods as needed (e.g., eth_call, eth_getBalance)
        default:
          console.log("Unsupported method:", method);
          sendError(id, -32601, "Method not supported", tabId);
      }
    } catch (error: any) {
      console.error("Error handling Web3 request:", error);
      sendError(id, -32603, error.message || "Internal error", tabId);
    }
  };
  

  const handleWeb3Request2 = async (data: string, tabId: string) => {
    console.log(`Received Web3 request for tab ${tabId}:`, data);
   
  
    let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse Web3 request:", error);
    return;
  }

  if (parsed.type === "wc_uri" && parsed.uri && wcClient) {
    console.log("Initiating WalletConnect session with URI:", parsed.uri);
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      console.error("Tab not found for ID:", tabId);
      return;
    }

    // Parse sessionTopic from URI if present
    const uriParams = new URLSearchParams(parsed.uri.split("?")[1] || "");
    const sessionTopic = uriParams.get("sessionTopic");

    if (sessionTopic) {
      const existingTab = tabs.find(t => t.wcSession?.topic === sessionTopic);
      if (existingTab) {
        console.log("Session already exists for topic:", sessionTopic, "in tab:", existingTab.id);
        if (existingTab.id !== tabId) {
          setActiveTabId(existingTab.id);
        }
        return;
      }
      // Associate existing session topic
      console.log("Associating existing session topic:", sessionTopic, "with tab:", tabId);
      setTabs(prev => prev.map(t =>
        t.id === tabId ? { ...t, wcSession: { topic: sessionTopic } } : t
      ));
    } else if (!tab.wcSession) {
      // Create new session
      setWcUri(parsed.uri);
      try {
        const session = await createWalletConnectSession({
          walletConnectClient: wcClient,
          uri: parsed.uri,
        });
        console.log("WalletConnect session initiated with topic:", session);
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, wcSession: session } : t
        ));
      } catch (error) {
        console.error("Failed to create WalletConnect session:", error);
      }
    }
    return;
  }

  const request: JsonRpcRequest = parsed;
  const { method, params, id } = request;
  const tab = tabs.find(t => t.id === tabId);

  if (!account || !wallet) {
    sendError(id, -32603, "No account available", tabId);
    return;
  }

  if (tab?.wcSession && wcClient) {
    try {
      const response = await wcClient.request({
        topic: tab.wcSession.topic,
        chainId: `eip155:${chain}`,
        request: { method, params },
      });
      sendResponse(id, response, tabId);
    } catch (error) {
      sendError(id, -32603, (error as Error).message, tabId);
    }
    return;
  }

    try {
      switch (method) {
        case "wallet_requestPermissions":
          console.log("Handling wallet_requestPermissions:", params);
          if (isConnected && account) {
            sendResponse(id, [{ parentCapability: "eth_accounts", caveats: [] }], tabId);
          } else {
            sendError(id, -32603, "Not connected", tabId);
          }
          break;
  
        case "wallet_getPermissions":
          console.log("Handling wallet_getPermissions");
          if (isConnected && account) {
            sendResponse(id, [{ parentCapability: "eth_accounts", caveats: [] }], tabId);
          } else {
            sendResponse(id, [], tabId);
          }
          break;
       case "eth_requestAccounts":
                 console.log("Handling eth_requestAccounts");
                 setShowConnectModal(true);
                 await new Promise<void>((resolve, reject) => {
                   setConnectResolve(() => resolve);
                   setConnectReject(() => reject);
                 });
                 try {
                   await connectionManager.connect(wallet, {
                     client: client,
                     onConnect: (connectedWallet) => {
                       const address = connectedWallet.getAccount()?.address;
                       console.log("Connected wallet address:", address);
                       setIsConnected(true);
                       if (address) {
                         sendResponse(id, [address], tabId);
                         emitConnectEvent(address, tabId);
                       } else {
                         sendError(id, -32603, "No address available after connection", tabId);
                       }
                     },
                   });
                 } catch (error) {
                   console.error("Connection failed:", error);
                   sendError(id, -32603, "Failed to connect: " + (error as Error).message, tabId);
                 }
                 break;

        case "eth_accounts":
          console.log("Handling eth_accounts");
          if (isConnected) {
            const activeAccount = connectionManager.activeAccountStore.getValue();
            sendResponse(id, activeAccount ? [activeAccount.address] : [], tabId);
          } else {
            sendResponse(id, [], tabId);
          }
          break;

        case "eth_chainId":
          console.log("Handling eth_chainId");
          sendResponse(id, chainID, tabId);
          break;
          case "net_version":
            console.log("Handling net_version");
            const netChain = connectionManager.activeWalletChainStore.getValue();
            sendResponse(id, chainID, tabId);
            break;
            case "wallet_switchEthereumChain":
        const [chainInfo] = params;
        const requestedChainId = parseInt(chainInfo.chainId, 16);
        if (chain === requestedChainId) {
          sendResponse(id, null, tabId);
        } else {
          setChainSwitchRequest({ chainId: requestedChainId, id, tabId });
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error("Chain switch timed out")), 30000);
              const resolveWithClear = () => {
                clearTimeout(timeout);
                resolve();
              };
              const rejectWithClear = (reason: Error) => {
                clearTimeout(timeout);
                reject(reason);
              };
              setChainSwitchResolve(() => resolveWithClear);
              setChainSwitchReject(() => rejectWithClear);
            });
            await connectionManager.switchActiveWalletChain(defineChain(requestedChainId));
            sendResponse(id, null, tabId);
            emitConnectEvent(account.address, tabId); // Update chainId in dApp
          } catch (error) {
            sendError(id, 4902, (error as Error).message || "Failed to switch chain", tabId);
          }
        }
        break;
  
        case "wallet_addEthereumChain":
          console.log("Handling wallet_addEthereumChain:", params);
          const [newChainInfo] = params;
          const chainId = parseInt(newChainInfo.chainId, 16);
          const currentChainForAdd = connectionManager.activeWalletChainStore.getValue();
          if (currentChainForAdd?.id === chainId) {
            sendResponse(id, null, tabId); // Already on the correct chain
          } else {
            try {
              // Since Thirdweb supports all EVM chains, we can treat this as a switch
              const newChain = defineChain(chainId);
              // Show confirmation modal
              setChainAddRequest({
                chainId,
                chainName: newChainInfo.chainName,
                rpcUrls: newChainInfo.rpcUrls,
                nativeCurrency: newChainInfo.nativeCurrency,
                blockExplorerUrls: newChainInfo.blockExplorerUrls,
              });
              await new Promise<void>((resolve, reject) => {
                setChainAddResolve(() => resolve);
                setChainAddReject(() => reject);
              });
              await connectionManager.switchActiveWalletChain(newChain);
              sendResponse(id, null, tabId);
            } catch (error) {
              sendError(id, 4902, (error as Error).message || "Failed to add chain", tabId);
            }
          }
          break;
  
        case "eth_gasPrice":
          console.log("Handling eth_gasPrice");
          const gasPriceInfo = await eth_gasPrice(rpcRequest);
          sendResponse(id, `0x${gasPriceInfo.toString(16)}`, tabId);
          break;

        case "eth_getBalance":
          console.log("Handling eth_getBalance:", params);
          const [address] = params;
          const balance = await eth_getBalance(rpcRequest, { address: account.address });
          sendResponse(id, `0x${balance.toString(16)}`, tabId);
          break;

        case "eth_blockNumber":
          console.log("Handling eth_blockNumber");
          const blockNumbe = await eth_blockNumber(rpcRequest);
          sendResponse(id, `0x${blockNumbe.toString(16)}`, tabId);
          break;

        case "eth_sendTransaction":
                  if (!account) return;
                  console.log("Handling eth_sendTransaction:", params[0]);
                  const txRaw = params[0] as { to: string; value: string; data?: string; gas?: string; nonce?: string; from?: string; gasPrice: string };
        
                  if (txRaw.from && txRaw.from.toLowerCase() !== account.address.toLowerCase()) {
                    throw new Error("Transaction 'from' address does not match active account");
                  }
        
                  const gasPrice = 1000000000000n;
                  console.log("Fetched gasPrice:", gasPrice.toString());
        
                  const nonce = txRaw.nonce
                    ? parseInt(txRaw.nonce, 16)
                    : await eth_getTransactionCount(rpcRequest, { address: account.address });
                  console.log("Fetched nonce:", nonce);
        
                  const tx = {
                    chainId: chain,
                    chain: defineChain(chain),
                    client: client,
                    to: txRaw.to as Address,
                    value: BigInt(txRaw.value || "0x0"),
                    data: (txRaw.data || "0x") as `0x${string}`,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    gas: txRaw.gas ? BigInt(txRaw.gas) : undefined,
                  };
        
                  const functionSelector = tx.data.slice(0, 10);
                  console.log("Function selector:", functionSelector);
                  let gas = 1000000n;
                  if (!tx.gas) {
                    try {
                      if (account.estimateGas) {
                        gas = await account.estimateGas(tx);
                      }
                      tx.gas = gas;
                      console.log("Estimated gas:", gas.toString());
                    } catch (gasError) {
                      console.error("Gas estimation failed:", gasError);
                      tx.gas = functionSelector === "0x095ea7b3" ? BigInt(70000) : BigInt(200000);
                      console.log("Using fallback gas limit:", tx.gas.toString());
                    }
                  }
        
                  // Decode the transaction data
                  const decodedTx = await decodeTxData(tx.data);
        
                  // Prepare transaction details for the modal
                  const txDetails = {
                    to: tx.to.toString(),
                    value: tx.value.toString(),
                    gas: tx.gas.toString(),
                    gasPrice: tx.gasPrice.toString(),
                    data: tx.data.slice(0, 20) + "...",
                    decoded: decodedTx || undefined,
                  };
        
                  // Show the custom modal
                  setTxDetails(txDetails);
                  setShowTxModal(true);
        
                  // Wait for user confirmation
                  await new Promise<void>((resolve, reject) => {
                    setTxResolve(() => resolve);
                    setTxReject(() => reject);
                  });
        
                  console.log("Sending transaction with params:", tx);
                  const txResponse = await account.sendTransaction(tx);
                  console.log("Transaction hash:", txResponse.transactionHash);
                  sendResponse(id, txResponse.transactionHash, tabId);
                  break;

        case "eth_getTransactionReceipt":
          console.log("Handling eth_getTransactionReceipt:", params[0]);
          const receiptHash = params[0] as string;

          const maxAttempts = 10;
          const retryInterval = 5000;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const receipt = await eth_getTransactionReceipt(rpcRequest, {
                hash: receiptHash as `0x${string}`,
              });
              const formattedReceipt = {
                transactionHash: receipt.transactionHash,
                transactionIndex: toHex(receipt.transactionIndex),
                blockHash: receipt.blockHash,
                blockNumber: toHex(receipt.blockNumber),
                from: receipt.from,
                to: receipt.to,
                gasUsed: toHex(receipt.gasUsed),
                cumulativeGasUsed: toHex(receipt.cumulativeGasUsed),
                contractAddress: receipt.contractAddress || null,
                logs: receipt.logs.map(log => ({
                  address: log.address,
                  topics: log.topics,
                  data: log.data,
                  logIndex: toHex(log.logIndex),
                  transactionIndex: toHex(log.transactionIndex),
                  transactionHash: log.transactionHash,
                  blockHash: log.blockHash,
                  blockNumber: toHex(log.blockNumber),
                })),
                status: receipt.status === "success" ? "0x1" : "0x0",
              };
              console.log("Transaction receipt found on attempt", attempt, ":", formattedReceipt);
              sendResponse(id, formattedReceipt, tabId);
              return;
            } catch (error: any) {
              if (error.message.includes("Transaction receipt not found")) {
                console.log(`Attempt ${attempt}/${maxAttempts}: Receipt not yet available for:`, receiptHash);
                if (attempt === maxAttempts) {
                  console.log("Max attempts reached, returning null for:", receiptHash);
                  sendResponse(id, null, tabId);
                  return;
                }
                await new Promise(resolve => setTimeout(resolve, retryInterval));
              } else {
                console.error("Error fetching transaction receipt:", error);
                sendError(id, -32603, error.message || "Internal error", tabId);
                return;
              }
            }
          }
          break;

        case "eth_getTransactionByHash":
          console.log("Handling eth_getTransactionByHash:", params[0]);
          const txHash = params[0] as string;
          const txData = await eth_getTransactionByHash(rpcRequest, {
            hash: txHash as `0x${string}`,
          });

          const formattedTx = {
            hash: txData.hash,
            to: txData.to,
            from: txData.from,
            value: toHex(txData.value),
            data: txData.input,
            gas: toHex(txData.gas),
            gasPrice: toHex(txData.gasPrice || BigInt(0)),
            nonce: toHex(txData.nonce),
            blockNumber: txData.blockNumber ? toHex(txData.blockNumber) : null,
            blockHash: txData.blockHash || null,
            transactionIndex: txData.transactionIndex !== undefined ? toHex(txData.transactionIndex?.toString() || "") : null,
          };
          console.log("Transaction data:", formattedTx);
          sendResponse(id, formattedTx, tabId);
          break;
          case "eth_getTransactionCount":
            console.log("Handling eth_getTransactionCount:", params);
            const txCount = await eth_getTransactionCount(rpcRequest, { address: account?.address });
            sendResponse(id, `0x${txCount.toString(16)}`, tabId);
            break;
    
          case "eth_estimateGas":
            console.log("Handling eth_estimateGas:", params);
            const [txParams] = params;
            const gasEstimate = await eth_estimateGas(rpcRequest, {
              to: txParams.to as Address,
              data: (txParams.data || "0x") as `0x${string}`,
              value: txParams.value || "0x0" as `0x${string}`,
              from: txParams.from || account.address,
            });
            sendResponse(id, `0x${gasEstimate.toString(16)}`, tabId);
            break;
    
          case "eth_getCode":
            console.log("Handling eth_getCode:", params);
            const [codeAddress, codeBlockTag = "latest"] = params;
            const code = await rpcRequest({
              method: "eth_getCode",
              params: [codeAddress, codeBlockTag],
            });
            sendResponse(id, code, tabId);
            break;
    
          case "eth_getStorageAt":
            console.log("Handling eth_getStorageAt:", params);
            const [storageAddress, position, storageBlockTag = "latest"] = params;
            const storage = await rpcRequest({
              method: "eth_getStorageAt",
              params: [storageAddress, position, storageBlockTag],
            });
            sendResponse(id, storage, tabId);
            break;
    
          case "eth_getBlockByNumber":
            console.log("Handling eth_getBlockByNumber:", params);
            const [blockNumber, fullTx = false] = params;
            const blockByNumber = await rpcRequest({
              method: "eth_getBlockByNumber",
              params: [blockNumber, fullTx],
            });
            sendResponse(id, blockByNumber, tabId);
            break;
    
          case "eth_getBlockByHash":
            console.log("Handling eth_getBlockByHash:", params);
            const [blockHash, fullTxHash = false] = params;
            const blockByHash = await rpcRequest({
              method: "eth_getBlockByHash",
              params: [blockHash, fullTxHash],
            });
            sendResponse(id, blockByHash, tabId);
            break;
    
        case "personal_sign":
          console.log("Handling personal_sign:", params);
          const message = params[0];
          const decodedMessage = Buffer.from(message.slice(2), "hex").toString();
          let signature = await account.signMessage({ message: decodedMessage });
          console.log("Generated signature (no prefix):", signature);
          sendResponse(id, signature, tabId);
          break;

        case "eth_call":
          console.log("Handling eth_call:", params);
          const [callData] = params;
          const { to, data } = callData;
          const result = await eth_call(rpcRequest, {
            to: to as Address,
            data: data as `0x${string}`,
          });

          console.log("eth_call result:", result);
          sendResponse(id, result, tabId);
          break;

        default:
          console.log("Unsupported method:", method);
          sendError(id, -32601, "Method not supported", tabId);
      }
    } catch (error: any) {
      console.error("Error handling Web3 request:", error);
      sendError(id, -32603, error.message || "Internal error", tabId);
    }
  };

  const sendResponse = (id: number, result: any, tabId: string) => {
    console.log(`Sending response for tab ${tabId}:`, { id, result });
    const response: JsonRpcResponse = { id, result, jsonrpc: "2.0" };
    const webView = webViewRefs.current.get(tabId);
    webView?.injectJavaScript(`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(JSON.stringify(response))}
        }));
      })();
    `);
  };
  
  const sendError = (id: number, code: number, message: string, tabId: string) => {
    console.log(`Sending error for tab ${tabId}:`, { id, code, message });
    const response: JsonRpcResponse = { id, error: { code, message }, jsonrpc: "2.0" };
    const webView = webViewRefs.current.get(tabId);
    webView?.injectJavaScript(`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(JSON.stringify(response))}
        }));
      })();
    `);
  };

  const emitConnectEvent = (address: string, tabId: string) => {
    console.log(`Emitting connect and accountsChanged events for address ${address} on tab ${tabId}`);
    const webView = webViewRefs.current.get(tabId);
    webView?.injectJavaScript(`
      if (window.ethereum) {
        const connectEvent = { chainId: ${chainID} };
        const accountsEvent = ["${address}"];
        window.ethereum.listeners?.get("connect")?.forEach(cb => cb(connectEvent));
        window.ethereum.listeners?.get("accountsChanged")?.forEach(cb => cb(accountsEvent));
      }
    `);
  };

  const mobileUserAgent = Platform.OS === "ios"
    ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    : "Mozilla/5.0 (Linux; Android 12; SM-G998B Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36";

  const viewportFix = `
    (function() {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    })();
  `;

 

  const injectedJavaScript = (tabId: string) => `
  (function() {
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: "${account?.address || ""}",
      chainId: "0x${(connectionManager.activeWalletChainStore.getValue()?.id || chain).toString(16)}",
      request: (args) => {
        console.log("window.ethereum.request called with:", args);
        return new Promise((resolve, reject) => {
          const id = Math.floor(Math.random() * 1000000);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            id,
            jsonrpc: "2.0",
            method: args.method,
            params: args.params || [],
            tabId: "${tabId}"
          }));
          // Store resolve/reject for this request
          window.ethereum._requests = window.ethereum._requests || {};
          window.ethereum._requests[id] = { resolve, reject };
        });
      },
      on: (event, callback) => {
        if (!window.ethereum._events) window.ethereum._events = {};
        if (!window.ethereum._events[event]) window.ethereum._events[event] = [];
        window.ethereum._events[event].push(callback);
      },
      emit: (event, data) => {
        if (window.ethereum._events?.[event]) {
          window.ethereum._events[event].forEach(cb => cb(data));
        }
      }
    };
    window.web3 = { currentProvider: window.ethereum };

    // Handle responses from React Native
    window.addEventListener('message', (event) => {
      try {
        const response = JSON.parse(event.data);
        const id = response.id;
        if (window.ethereum._requests?.[id]) {
          if (response.error) {
            window.ethereum._requests[id].reject(new Error(response.error.message));
          } else {
            window.ethereum._requests[id].resolve(response.result);
          }
          delete window.ethereum._requests[id];
        }
      } catch (e) {
        console.error("Error processing message:", e);
      }
    });

    // Intercept WalletConnect attempts
    const originalOpen = window.open;
    window.open = function(url) {
      if (url && url.startsWith("wc:")) {
        console.log("Intercepted WalletConnect URI:", url);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "wc_uri",
          uri: url,
          tabId: "${tabId}"
        }));
        return null;
      }
      return originalOpen ? originalOpen.apply(this, arguments) : null;
    };

    // Monitor WalletConnect library if present
    if (window.WalletConnectProvider || window.walletconnect) {
      console.log("WalletConnect detected on page");
      const checkWc = setInterval(() => {
        const wcElements = document.querySelectorAll('a[href^="wc:"]');
        if (wcElements.length > 0) {
          wcElements.forEach(el => {
            const uri = el.getAttribute("href");
            console.log("Found WalletConnect URI in DOM:", uri);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "wc_uri",
              uri: uri,
              tabId: "${tabId}"
            }));
            el.removeAttribute("href");
          });
          clearInterval(checkWc);
        }
      }, 1000);
    }

    console.log("Ethereum provider and WalletConnect interceptor injected");
  })();
`;

  const onMessage = (event: { nativeEvent: { data: string } }, tabId: string) => {
    const data = event.nativeEvent.data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.tabId !== tabId) return; // Ignore messages from other tabs
      if (parsed.type === "console") {
        console.log(`WebView console [${parsed.level}] for tab ${tabId}: ${parsed.message}`);
      } else if (parsed.type === "debug") {
        console.log(`WebView debug for tab ${tabId}: ${parsed.message}`);
      } else {
        console.log(`WebView message received for tab ${tabId}:`, data);
        handleWeb3Request(data, tabId);
      }
    } catch (e) {
      console.log(`WebView raw message for tab ${tabId}:`, data);
      handleWeb3Request(data, tabId);
    }
  };

  const renderTabItem = ({ item }: { item: Tab }) => (
    <View style={styles.tabItem}>
      <TouchableOpacity style={styles.tabContent} onPress={() => switchTab(item.id)}>
        {item.favicon ? (
          <Image source={{ uri: item.favicon }} style={styles.favicon} />
        ) : (
          <Ionicons name="globe" size={20} color="#fff" />
        )}
        <ThemedText style={styles.tabTitle} numberOfLines={1}>
          {item.title || item.url}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => closeTab(item.id)}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      onRequestClose={goBack}
      presentationStyle="fullScreen"
    >
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerTitleContainer}
            onPress={() => setShowTabManager(true)}
          >
            {activeTab?.favicon ? (
              <Image source={{ uri: activeTab.favicon }} style={styles.favicon} />
            ) : (
              <Ionicons name="globe" size={20} color="#fff" style={styles.headerIcon} />
            )}
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {activeTab?.title || activeTab?.url || "Dapp Browser"}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTabManager(true)} style={styles.headerButton}>
            <Ionicons name="apps" size={24} color="#fff" />
            <View style={styles.tabCountBadge}>
              <ThemedText style={styles.tabCountText}>{tabs.length}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
  
        {showTabManager ? (
          <View style={styles.tabManager}>
            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder="Enter dApp URL (e.g., https://...)"
                placeholderTextColor="#888"
                value={newUrl}
                onChangeText={setNewUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={styles.goButton}
                onPress={() => {
                  if (newUrl) {
                    const formattedUrl = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
                    addNewTab(formattedUrl);
                  }
                }}
              >
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={tabs}
              renderItem={renderTabItem}
              keyExtractor={item => item.id}
              style={styles.tabList}
            />
          </View>
        ) : (
          account && activeTab && (
            <WebView
              key={activeTab.id}
              ref={(ref) => {
                if (ref) webViewRefs.current.set(activeTab.id, ref);
              }}
              source={{ uri: activeTab.url }}
              style={styles.webview}
              onNavigationStateChange={(navState) => handleNavigationStateChange(activeTab.id, navState)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              onMessage={(event) => onMessage(event, activeTab.id)}
              injectedJavaScript={injectedJavaScript(activeTab.id)}
              userAgent={mobileUserAgent}
              contentMode={Platform.OS === "ios" ? "mobile" : undefined}
              scalesPageToFit={false}
              setBuiltInZoomControls={false}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              onLoadStart={(e) => console.log(`WebView load started for tab ${activeTab.id}:`, e.nativeEvent)}
              onLoad={(e) => console.log(`WebView loaded for tab ${activeTab.id}:`, e.nativeEvent)}
              onLoadEnd={(e) => console.log(`WebView load ended for tab ${activeTab.id}:`, e.nativeEvent)}
              onError={(e) => console.error(`WebView error for tab ${activeTab.id}:`, e.nativeEvent)}
            />
          )
        )}

        <Modal
                  visible={showTxModal}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => {
                    setShowTxModal(false);
                    txReject?.(new Error("User rejected transaction"));
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.txModalContainer}>
                      <ThemedText style={styles.txModalTitle}>Confirm Transaction</ThemedText>
                      <ScrollView style={styles.txModalContent}>
                        {txDetails && (
                          <>
                            <View style={styles.txDetailRow}>
                              <ThemedText style={styles.txDetailLabel}>To:</ThemedText>
                              <ThemedText style={styles.txDetailValue} numberOfLines={1}>
                                {txDetails.to}
                              </ThemedText>
                            </View>
                            <View style={styles.txDetailRow}>
                              <ThemedText style={styles.txDetailLabel}>Value:</ThemedText>
                              <ThemedText style={styles.txDetailValue}>
                                {txDetails.value} wei
                              </ThemedText>
                            </View>
                            <View style={styles.txDetailRow}>
                              <ThemedText style={styles.txDetailLabel}>Gas:</ThemedText>
                              <ThemedText style={styles.txDetailValue}>
                                {txDetails.gas}
                              </ThemedText>
                            </View>
                            <View style={styles.txDetailRow}>
                              <ThemedText style={styles.txDetailLabel}>Gas Price:</ThemedText>
                              <ThemedText style={styles.txDetailValue}>
                                {txDetails.gasPrice} wei
                              </ThemedText>
                            </View>
                            {txDetails.decoded ? (
                              <>
                                <View style={styles.txDetailRow}>
                                  <ThemedText style={styles.txDetailLabel}>Function:</ThemedText>
                                  <ThemedText style={styles.txDetailValue}>
                                    {txDetails.decoded.functionName}
                                  </ThemedText>
                                </View>
                                {txDetails.decoded.params.map((param, index) => (
                                  <View key={index} style={styles.txDetailRow}>
                                    <ThemedText style={styles.txDetailLabel}>
                                      {param.name} ({param.type}):
                                    </ThemedText>
                                    <ThemedText style={styles.txDetailValue} numberOfLines={1}>
                                      {typeof param.value === "object"
                                        ? JSON.stringify(param.value)
                                        : param.value.toString()}
                                    </ThemedText>
                                  </View>
                                ))}
                                {txDetails.decoded.extraDecoded && (
                                  <View style={styles.txDetailRow}>
                                    <ThemedText style={styles.txDetailLabel}>Extra Data:</ThemedText>
                                    <ThemedText style={styles.txDetailValue}>
                                      {JSON.stringify(txDetails.decoded.extraDecoded)}
                                    </ThemedText>
                                  </View>
                                )}
                              </>
                            ) : (
                              <View style={styles.txDetailRow}>
                                <ThemedText style={styles.txDetailLabel}>Data:</ThemedText>
                                <ThemedText style={styles.txDetailValue}>
                                  {txDetails.data}
                                </ThemedText>
                              </View>
                            )}
                          </>
                        )}
                      </ScrollView>
                      <View style={styles.txModalButtons}>
                        <TouchableOpacity
                          style={[styles.txModalButton, styles.txModalCancelButton]}
                          onPress={() => {
                            setShowTxModal(false);
                            txReject?.(new Error("User rejected transaction"));
                          }}
                        >
                          <ThemedText style={styles.txModalButtonText}>Cancel</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.txModalButton, styles.txModalConfirmButton]}
                          onPress={() => {
                            setShowTxModal(false);
                            txResolve?.();
                          }}
                        >
                          <ThemedText style={styles.txModalButtonText}>Confirm</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
                {chainSwitchRequest && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <ThemedText style={styles.modalTitle}>Switch Network</ThemedText>
                <ThemedText style={styles.modalText}>
                  This dApp requests to switch to chain ID {chainSwitchRequest.chainId}.
                </ThemedText>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setChainSwitchRequest(null);
                      chainSwitchReject?.(new Error("User rejected chain switch"));
                    }}
                  >
                    <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      setChainSwitchRequest(null);
                      chainSwitchResolve?.();
                      setChain(chainSwitchRequest.chainId)
                    }}
                  >
                    <ThemedText style={styles.modalButtonText}>Switch</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
                <Modal
          visible={showConnectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowConnectModal(false);
            connectReject?.(new Error("User rejected connection"));
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.connectModalContainer}>
              <ThemedText style={styles.connectModalTitle}>Connect to dApp</ThemedText>
              {activeTab && (
                <View style={styles.dappInfoContainer}>
                  <View style={styles.dappInfoRow}>
                    {activeTab.favicon ? (
                      <Image source={{ uri: activeTab.favicon }} style={styles.dappFavicon} />
                    ) : (
                      <Ionicons name="globe" size={24} color="#fff" style={styles.dappIcon} />
                    )}
                    <View style={styles.dappTextContainer}>
                      <ThemedText style={styles.dappName} numberOfLines={1}>
                        {activeTab.title || "Unknown dApp"}
                      </ThemedText>
                      <ThemedText style={styles.dappUrl} numberOfLines={1}>
                        {activeTab.url}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
              <ThemedText style={styles.connectModalMessage}>
                Do you want to connect to this dApp?
              </ThemedText>
              <View style={styles.connectModalButtons}>
                <TouchableOpacity
                  style={[styles.connectModalButton, styles.connectModalCancelButton]}
                  onPress={() => {
                    setShowConnectModal(false);
                    connectReject?.(new Error("User rejected connection"));
                  }}
                >
                  <ThemedText style={styles.connectModalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.connectModalButton, styles.connectModalConfirmButton]}
                  onPress={() => {
                    setShowConnectModal(false);
                    connectResolve?.();
                  }}
                >
                  <ThemedText style={styles.connectModalButtonText}>Connect</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#1A1A1A",
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  tabCountBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF5555",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabCountText: {
    color: "#fff",
    fontSize: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabManager: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 16,
  },
  urlInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  goButton: {
    padding: 8,
    backgroundColor: "#555",
    borderRadius: 8,
  },
  tabList: {
    flex: 1,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tabContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  favicon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  tabTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  txModalContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  txModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  txModalContent: {
    maxHeight: "70%",
    marginBottom: 16,
  },
  txDetailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  txDetailLabel: {
    color: "#A0A0A0",
    fontSize: 14,
    width: 100,
  },
  txDetailValue: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  txModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  txModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  txModalCancelButton: {
    backgroundColor: "#FF5555",
  },
  txModalConfirmButton: {
    backgroundColor: "#4CAF50",
  },
  txModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  connectModalContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  connectModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dappInfoContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  dappInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dappFavicon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  dappIcon: {
    marginRight: 8,
  },
  dappTextContainer: {
    flex: 1,
  },
  dappName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dappUrl: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  connectModalMessage: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  connectModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  connectModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  connectModalCancelButton: {
    backgroundColor: "#FF5555",
  },
  connectModalConfirmButton: {
    backgroundColor: "#4CAF50",
  },
  connectModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: { backgroundColor: "#2A2A2A", padding: 20, borderRadius: 12, width: "80%" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  modalText: { color: "#fff", marginBottom: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 8 },
  cancelButton: { backgroundColor: "#FF5555" },
  confirmButton: { backgroundColor: "#4CAF50" },
  modalButtonText: { color: "#fff", fontSize: 16 },
});

