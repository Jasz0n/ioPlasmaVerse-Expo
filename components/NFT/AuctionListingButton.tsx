"use client";
import { defineChain, getContract, NFT as NFTType } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { createAuction } from "thirdweb/extensions/marketplace";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";


export default function AuctionListingButton({
  tokenId,
  minimumBidAmount,
  buyoutBidAmount,
  auctionStart,
  auctionEnd,
  contractAddress,
  chainId,
  marketplaceAddress

}: {
  marketplaceAddress: string;
  tokenId: bigint;
  minimumBidAmount: string;
  buyoutBidAmount: string;
  auctionStart: string;
  auctionEnd: string;
  contractAddress: string;
  chainId: number;
}) {
  const MARKETPLACE = getContract({client:client, chain: defineChain(chainId),address:marketplaceAddress}); 
  const address =
  contractAddress.startsWith("0x") && contractAddress.length === 42
    ? (contractAddress as `0x${string}`)
    : null;

  if (!address) {
    return null;
  }

  return (
    <TransactionButton
      transaction={() => {
        
         
        return createAuction({
          contract: MARKETPLACE,
          assetContractAddress: address,
          tokenId: tokenId,
          minimumBidAmount,
          buyoutBidAmount,
          startTimestamp: new Date(auctionStart),
          endTimestamp: new Date(auctionEnd),
        });
      }}
      onTransactionSent={() => {
        
      }}
      onError={(error) => {
        
      }}
      onTransactionConfirmed={async (txResult) => {
        
      }}
    >
      <ThemedText
                              
                              >
                                List for Auction
                              </ThemedText>
    </TransactionButton>
  );
}
