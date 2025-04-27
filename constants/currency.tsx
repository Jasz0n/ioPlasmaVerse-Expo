import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ADDRESS_ZERO, defineChain, eth_getBalance, getContract, getRpcClient, NATIVE_TOKEN_ADDRESS, readContract } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { client } from '@/constants/thirdweb';
import { UNISWAP_CONTRACTS2 } from './types';

// Mocked chain list and Uniswap contracts for demonstration
// Replace with actual imports from your project


// Define types
export interface Token {
  chainId: number;
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  balance?: string;
  price?: string;
  value?: string;
  totalSupply?: string;
  volume?: string;
  marketCup?: string;
  totalReverse?: string;
  coinGeckoId?: string;
  topPools?: string[];
}


interface Explorer {
  name: string;
  url: string;
  standard: string;
}

interface Chain2 {
  name: string;
  chainId: number;
  explorer: Explorer;
  symbol: string;
}

interface CurrencyContextProps {
  updateBalances: (chainId: number) => void;
  router: string;
  tokenList: Token[];
  setTokenList: React.Dispatch<React.SetStateAction<Token[]>>;
  tokenBalances: Token[];
  chainId: number;
  nftCollection: string;
  WETH9: string;
  feeReciever: string;
  symbol: string;
  chainData: Chain2;
  setChainId: React.Dispatch<React.SetStateAction<number>>;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
  initialParams?: {
    userId: string;
    groupId: string;
    chatId: string;
    isAdmin: boolean;
    isFounder: boolean;
  };
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
  initialParams = { userId: "", groupId: "", chatId: "", isAdmin: false, isFounder: false },
}) => {
  // State Variables
  const chainDataDefault: Chain2 = {
    name: "",
    chainId: 0,
    explorer: { name: "", url: "", standard: "" },
    symbol: "",
  };

  const [WETH9, setWETH9] = useState<string>(ADDRESS_ZERO);
  const [router, setRouter] = useState<string>(ADDRESS_ZERO);
  const [symbol, setSymbol] = useState<string>("");
  const [chainId, setChainId] = useState<number>(8453);
  const [chainData, setChainData] = useState<Chain2>(chainDataDefault);
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const account = useActiveAccount();
  const [tokenBalances, setTokenBalances] = useState<Token[]>([]);
 
  const [marketplace, setMarketplaceContract] = useState<string>(ADDRESS_ZERO);
  const [nftCollection, setNftCollection] = useState<string>(ADDRESS_ZERO);
  const [feeReciever, setFeeReciever] = useState<string>(ADDRESS_ZERO);
  
 
  
  // Fetch token list
  const fetchTokenList = useCallback(async () => {
    try {
      console.log("🔍 Fetching token list...");

      if (!chainId)  {
        console.error("❌ Error: chainId or account is undefined or invalid.");
        return;
      }
       const chainData = Object.values(UNISWAP_CONTRACTS2).find(
                                                (data) => data.chainId === chainId
                                              );
                                            
                                              if (!chainData) {
                                                console.error(`Chain data not found for chainId: ${chainId}`);
                                                return null;
                                              }
                    const symbol = chainData.symbol;                          
                    const WETH9 = chainData.wrappedAddress; 
                    const router = chainData.router;    

      const url = `https://www.ioplasmaverse.com/api/getCurrencyData/${chainId}/${account?.address || "0x7FD17fA9FeeA8Aef4754a3349189188b0618a3FE"}`;
      const response = await fetch(url);
      console.log("url", url);
      if (!response.ok) {
        console.error(`❌ Failed to fetch token list. HTTP Status: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (!data || typeof data !== "object" || !("tokens" in data) || !Array.isArray(data.tokens)) {
        console.error("❌ Invalid API response structure.");
        return;
      }
      
      const tokens: Token[] = data.tokens.map((token: any) => ({
        chainId: chainId,
        contractAddress: token.contractAddress.toString(),
        name: token.name,
        symbol: token.symbol,
        decimals: Number(token.decimals),
        image: token.contractAddress.toString() === NATIVE_TOKEN_ADDRESS ? chainData.nativeToken.image: token.logoURI,
        balance: token.balance,
        price: token.price,
        value: token.value,
        totalSupply: token.totalSupply || "",
        volume: token.volume || "",
        marketCup: token.marketCup || "",
        totalReverse: token.totalReserve || "",
        coinGeckoId: token.coinCeckoId || "",
        topPools: token.topPools || [],
      }));
      setMarketplaceContract(chainData.MarketplaceContract)
      setRouter(router)
      setSymbol(symbol)
      setWETH9(WETH9)
      setTokenList(tokens);
      setTokenBalances(tokens);
    } catch (error: any) {
      console.error("❌ Error in fetchTokenList:", error.message || error);
    }
  }, [chainId]);






  useEffect(() => {
    fetchTokenList();
  }, [chainId, fetchTokenList]);

  

  return (
    <CurrencyContext.Provider
      value={{
        feeReciever,
        symbol,
        nftCollection,
        tokenList,
        router,
        updateBalances: fetchTokenList,
        setTokenList: setTokenBalances,
        tokenBalances,
        WETH9,
        chainId,
        setChainId,
        chainData,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};