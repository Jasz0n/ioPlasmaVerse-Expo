"use client";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import {
  
 
  buyFromListing,
  buyoutAuction,
  getListing,
} from "thirdweb/extensions/marketplace";

import toast from "react-hot-toast";
import { balanceOf } from "thirdweb/extensions/erc20";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { Address, ADDRESS_ZERO, defineChain, getContract, ThirdwebContract } from "thirdweb";
import { DirectListing, EnglishAuction, useMarketplaceData } from "@/constants/marketProvider";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";




const toSmallestUnit = (amount: string, decimals: number): string => {
  const amountBigInt = BigInt(parseFloat(amount) * Math.pow(10, decimals));
  return amountBigInt.toString();
};

export default function BuyListingButtonErc20({
  auctionListing,
  directListing,
  account,
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  account: Address;
}) {
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const MARKETPLACE =  getContract({client: client, chain: defineChain(directListing?.chainId || auctionListing?.chainId || 1), address: directListing?.marketplaceAddress || auctionListing?.marketplaceAddress || ADDRESS_ZERO})
   const { refetchMarketplace } = useMarketplaceData();
 

  const { data: UserTokenBalance, isLoading: loadingUserWallet } = useReadContract(
    balanceOf,
    {
      contract: getContract({client: client, chain: defineChain(directListing?.chainId || auctionListing?.chainId || 1), address: directListing?.currencyContractAddress || auctionListing?.currencyContractAddress || ADDRESS_ZERO}),
      address: account ,
      queryOptions: {
        enabled: !!account,
      }
    }
  );

  useEffect(() => {
    if (!loadingUserWallet && UserTokenBalance && directListing) {
      const listingPrice = BigInt(toSmallestUnit(directListing.pricePerToken, 9));
      const userBalance = BigInt(UserTokenBalance.toString());

      if (userBalance >= listingPrice) {
        setHasSufficientBalance(true);
      } else {
        setHasSufficientBalance(false);
      }
    }
  }, [UserTokenBalance, loadingUserWallet, directListing]);

  return (
    <TransactionButton
      disabled={
        account === auctionListing?.creatorAddress ||
        account === directListing?.creatorAddress ||
        (!directListing && !auctionListing) ||
        !hasSufficientBalance ||
        loadingUserWallet
      }
      transaction={async () => {
        if (!account) throw new Error("No account");
        console.log("Transaction initiated by account:", account);
        if (auctionListing) {
          console.log("Auction Listing ID:", auctionListing.id);
          return buyoutAuction({
            contract: MARKETPLACE,
            auctionId: BigInt(auctionListing.id),
          });
        } else if (directListing) {
          console.log("Direct Listing ID:", directListing.id);
          const listingDetails = await getListingDetails(BigInt(directListing.id), MARKETPLACE);
          console.log("Listing Details:", listingDetails);
          return buyFromListing({
            contract:  getContract({client: client, chain: defineChain(directListing?.chainId || 1), address: directListing?.marketplaceAddress || ADDRESS_ZERO}),
            listingId: BigInt(directListing.id),
            recipient: account,
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
        
      }}
    >
        <ThemedText
                                                    
                                                    >
                                            Buy Now
                                                    </ThemedText>
    </TransactionButton>
  );
}

async function getListingDetails(listingId: bigint, MARKETPLACE: ThirdwebContract) {
  try {
    const listing = await getListing({
      contract: MARKETPLACE,
      listingId: listingId,
    });
    return listing;
  } catch (error) {
    console.error("Error fetching listing details:", error);
    throw error;
  }
}
