"use client";

import { NFT as NFTType, getContract, toUnits, readContract, defineChain } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";




    export default function DirectListingERC20({
    tokenId,
    pricePerToken,
    listingStart,
    listingEnd,
    contractAddress,
    chainId, 
    currencyAddress,
    marketplaceAddress
    }: {
      marketplaceAddress: string;

    tokenId: bigint;
    pricePerToken: string;
    listingStart: string;
    listingEnd: string;
    contractAddress: string;
    chainId: number,
    currencyAddress: string
    }) {
    const account = useActiveAccount();
    const address =
    contractAddress.startsWith("0x") && contractAddress.length === 42
      ? (contractAddress as `0x${string}`)
      : null;


      const handleListing = async () => {
      if (!account || !address) {
      throw new Error("Account not available");
      }

               
      const MARKETPLACE = getContract({client:client, chain: defineChain(chainId),address:marketplaceAddress})
      try {
        const transaction = await createListing({
          contract: MARKETPLACE,
          assetContractAddress: address,
          tokenId: tokenId,
          pricePerToken: pricePerToken,
          startTimestamp: new Date(listingStart),
          endTimestamp: new Date(listingEnd),
          currencyContractAddress: currencyAddress,
        });
        console.log("Listing transaction prepared:", transaction);
        return transaction;
      } catch (error) {
        console.error("Error in creating listing:", error);
        throw error;
      }
      };

            return (
              <TransactionButton
                transaction={handleListing}
                onTransactionSent={() => {
                console.log("Transaction sent...");
                
                }}
                onError={(error) => {
                console.error("Listing Failed:", error);
                
                }}
                onTransactionConfirmed={async (txResult) => {

                console.log("Transaction confirmed:", txResult);
               
                }}
                >
            <ThemedText
                                                        
                                                        >
                                                          List for Sale 
                                                        </ThemedText>
            </TransactionButton>
            );
            }