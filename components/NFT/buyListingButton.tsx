"use client";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  buyFromListing,
  buyoutAuction,
} from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { Address, defineChain, getContract } from "thirdweb";
import { DirectListing, EnglishAuction, useMarketplaceData } from "@/constants/marketProvider";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";



export default function BuyListingButton({
  auctionListing,
  directListing,
  nativeCurrency
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  nativeCurrency?: string;
}) {
  const account = useActiveAccount();
  const { refetchMarketplace } = useMarketplaceData();

  return (
    <TransactionButton
      disabled={
        account?.address === auctionListing?.creatorAddress ||
        account?.address === directListing?.creatorAddress ||
        (!directListing && !auctionListing)
      }
      transaction={() => {
        if (!account) throw new Error("No account");
        console.log("Transaction initiated by account:", account.address);
        
        if (auctionListing) {
          console.log("Auction Listing ID:", auctionListing.id);
          return buyoutAuction({
            contract: getContract({client, chain: defineChain(auctionListing.chainId), address: auctionListing.marketplaceAddress}),
            auctionId: BigInt(auctionListing.id)
          });
        } else if (directListing) {
          console.log("Direct Listing ID:", directListing.id);
          return buyFromListing({
            contract: getContract({client, chain: defineChain(directListing.chainId), address: directListing.marketplaceAddress}),
            listingId: BigInt(directListing.id),
            recipient: account.address,
            quantity: BigInt(1),
          });
        } else {
          throw new Error("No valid listing found for this NFT");
        }
      }}
      onTransactionSent={() => {
        console.log("Transaction sent");
        
      }}
      onError={(error) => {
        console.error("Transaction failed with error:", error);
       
      }}
      onTransactionConfirmed={async (txResult) => {
        refetchMarketplace(getContract({client, chain: defineChain( auctionListing?.chainId|| directListing?.chainId || 1),address: auctionListing?.marketplaceAddress || directListing?.marketplaceAddress || ""}),auctionListing? "auction": "listing"),

        console.log("Transaction confirmed with result:", txResult);
        
        // Refetch the data after transaction confirmation
      }}
    >
        <ThemedText
                                
                                >
                                  Buy Now
                                </ThemedText>
    
    </TransactionButton>
  );
}
