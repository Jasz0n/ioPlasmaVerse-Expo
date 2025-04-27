"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Address, NATIVE_TOKEN_ADDRESS, ThirdwebContract, defineChain, eth_blockNumber, getContract, getRpcClient, readContract, resolveMethod } from 'thirdweb';



interface MarketListingsResponse {
  scListings: ScListing[];
  auctions: EnglishAuction[];
  listings: DirectListing[];
}

export interface DirectListing {
  id: string;
  creatorAddress: string;
  assetContractAddress: string;
  tokenId: string;
  quantity: string;
  currencyContractAddress: string;
  currencySymbol: string;
  pricePerToken: string;
  startTimeInSeconds: string;
  endTimeInSeconds: string;
  isReservedListing: boolean;
  status: number;
  symbol: string;
  marketplaceAddress: string;
  chainId: number;
}
export interface EnglishAuction  {
  id: string;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: string;
  quantity: string;
  currencyContractAddress: Address;
  minimumBidAmount: string;
  minimumBidCurrencyValue: string; // GetBalanceResult
  buyoutBidAmount: string;
  buyoutCurrencyValue: string; // GetBalanceResult 
  timeBufferInSeconds: string;
  bidBufferBps: string;
  startTimeInSeconds: string;
  endTimeInSeconds: string;
  status: string;
  symbol: string;
  marketplaceAddress: string;
  chainId: number;
};

export interface offer {
  offerId: string;
  tokenId: string;
  quantity: string;
  totalPrice: string;
  expirationTimestamp: string;
  offeror: string;
  assetContract: string;
  currency: string;
  tokenType: string;
  status: string; 
  pricePerToken: string;
  symbol: string;
  marketplaceAddress: string;
  chainId: number;
  }

  export interface ScListing {
   
    tokenId: string;
    price: string;
    contractAddress: string;
    timestamp: string;
    ownerAddress: string;
    }
interface ContractData {
  totalSupply: number;
  validTotalSupply: number;
  uniqueOwners: number;
}

interface MarketplaceContextProps {
  validListings: DirectListing[];
  ScMarketListing: ScListing[];
  validAuctions: EnglishAuction[];
  loading: boolean;
  refetchMarketplace: (section: ThirdwebContract, type: string) =>  Promise<void>;  
  
}

interface MarketplaceDataProviderProps {
  children: ReactNode;
}



const MarketplaceDataContext = createContext<MarketplaceContextProps | undefined>(undefined);

export const MarketplaceProvider: React.FC<MarketplaceDataProviderProps> = ({ children }) => {
  const [validListings, setValidListings] = useState<DirectListing[]>([]);
  const [validAuctions, setValidAuctions] = useState<EnglishAuction[]>([]);
  
  const [validOffers, setValidOffers] = useState<offer[]>([]);
  const [ScMarketListing, setMarketListings] = useState<ScListing[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);



  const fetchMarket = useCallback(async () => {
    try {
      console.log("🔍 Fetching token list...");
      const url = "https://www.ioplasmaverse.com/api/getMarketListings";
      const response = await fetch(url);
      console.log("url", url);

      if (!response.ok) {
        console.error(`❌ Failed to fetch token list. HTTP Status: ${response.status}`);
        return;
      }

      const data: MarketListingsResponse = await response.json();

      if (!data || typeof data !== "object") {
        console.error("❌ Invalid API response structure: Response is not an object.");
        return;
      }

      const { scListings, auctions, listings } = data;

      if (!Array.isArray(scListings)) {
        console.error("❌ Invalid API response: scListings is not an array.");
        return;
      }
      if (!Array.isArray(auctions)) {
        console.error("❌ Invalid API response: auctions is not an array.");
        return;
      }
      if (!Array.isArray(listings)) {
        console.error("❌ Invalid API response: listings is not an array.");
        return;
      }

      setMarketListings(scListings);
      setValidAuctions(auctions);
      setValidListings(listings);

      console.log("✅ Successfully fetched and set market listings:", {
        scListingsCount: scListings.length,
        auctionsCount: auctions.length,
        listingsCount: listings.length,
      });
    } catch (error: any) {
      console.error("❌ Error in fetchMarket:", error.message || error);
    }
  }, [setMarketListings, setValidAuctions]);

  // Fetch data on component mount
  useEffect(() => {
    fetchMarket();
  }, []);


// useEffect to combine all listings


  return (
    <MarketplaceDataContext.Provider value={{ validListings,ScMarketListing, refetchMarketplace: fetchMarket, validAuctions,  loading: isLoading }}>
      {children}
    </MarketplaceDataContext.Provider>
  );
};

export const useMarketplaceData = () => {
  const context = useContext(MarketplaceDataContext);
  if (!context) {
    throw new Error('useContractData must be used within a MarketplaceProvider');
  }
  return context;
};
