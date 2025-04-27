"use client";

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
import { useActiveAccount } from "thirdweb/react";

// Define the ContractMetadata interface (same as in your previous code)
interface Attribute {
  trait_type: string;
  value: string | number;
  frequency?: string;
  count?: number;
  image?: string;
}

interface ContractMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  vrm_file?: string;
  ranking?: any;
  attributes: Attribute[];
  owner: string;
  tokenUri: string;
  contractAddress: string; // Added from API response
  chainId: number; // Added from API response
}

// Update the context type to use ContractMetadata[]
type UserContextType = {
  nft: ContractMetadata[];
};

// Create a context
const NftContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const NftProvider: React.FC<UserProviderProps> = ({ children }) => {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [Nfts, setNfts] = useState<ContractMetadata[]>([]);

  // Fetch owned NFTs
  const fetchOwnedNfts = useCallback(async () => {
    try {
      console.log("🔍 Fetching token list...");
      setLoading(true);

      if (!account) {
        console.error("❌ Error: Account is undefined.");
        return;
      }

      const url = `https://www.ioplasmaverse.com/api/nft/getOwnedNFTs/${account.address}`;
      const response = await fetch(url);
      console.log("url", url);

      if (!response.ok) {
        console.error(`❌ Failed to fetch token list. HTTP Status: ${response.status}`);
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data) {
        console.error("❌ Invalid API response structure.");
        throw new Error("Invalid API response structure");
      }

      // Map the API response to ContractMetadata
      // The API response already matches the ContractMetadata interface, including contractAddress and chainId
      const fetchedNfts: ContractMetadata[] = data.nfts.map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        animation_url: nft.animation_url,
        vrm_file: nft.vrm_file,
        ranking: nft.ranking,
        attributes: nft.attributes || [],
        owner: nft.owner,
        tokenUri: nft.tokenUri,
        contractAddress: nft.contractAddress,
        chainId: nft.chainId,
      }));

      setNfts(fetchedNfts);
    } catch (error: any) {
      console.error("❌ Error in fetchOwnedNfts:", error.message || error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchOwnedNfts();
    }
  }, [account, fetchOwnedNfts]);

  return (
    <NftContext.Provider value={{
      nft: Nfts,
    }}>
      {children}
    </NftContext.Provider>
  );
};

export const useNfts = (): UserContextType => {
  const context = useContext(NftContext);
  if (!context) {
    throw new Error('useNfts must be used within a NftProvider');
  }
  return context;
};