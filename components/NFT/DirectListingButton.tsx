"use client";

import { Address, NFT as NFTType, defineChain, getContract } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { createListing, updateListing } from "thirdweb/extensions/marketplace";
import toast from "react-hot-toast";
import { useMarketplaceData } from "@/constants/marketProvider";
import { useEffect, useState } from "react";
import { client } from "@/constants/thirdweb";
import { router } from "expo-router";
import { ThemedText } from "../ThemedText";




export default function DirectListingButton({
	pricePerToken,
	chainCurrency,
	listingStart,
	listingEnd,
	contractAddress,
	tokenId,
	chainId,
	marketplaceAddress
}: {
	marketplaceAddress: string;
	pricePerToken: string;
	listingStart: string;
	listingEnd: string;
	contractAddress: string;
	chainCurrency:string;
	tokenId: bigint;
	chainId: number;
}) {
	const { validListings, validAuctions, refetchMarketplace } = useMarketplaceData();
	const [listingId, setListingId] = useState<bigint | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const listing = validListings.find(
				(listing: any) =>
					BigInt(listing.tokenId) === tokenId &&
					listing.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()
			);
			if (listing) {
				setListingId(BigInt(listing.id));
			}
		};

		fetchData();
	}, [validListings, contractAddress, tokenId]);
	const MARKETPLACE = getContract({client:client, chain: defineChain(chainId),address:marketplaceAddress})

	const address =
		contractAddress.startsWith("0x") && contractAddress.length === 42
			? (contractAddress as `0x${string}`)
			: null;

	if (!address) {
		return null;
	}

	return (
		<div>
		
				<TransactionButton
					transaction={() => {
						
						 
						return createListing({
							contract: MARKETPLACE,
							assetContractAddress: address,
							tokenId: tokenId,
							pricePerToken: pricePerToken,
							startTimestamp: new Date(listingStart),
							endTimestamp: new Date(listingEnd),
						});
					}}
					onTransactionSent={() => {
						
					}}
					onError={(error) => {
						
					}}
					onTransactionConfirmed={async (txResult) => {
						refetchMarketplace(getContract({client, chain: defineChain(chainId), address: marketplaceAddress}), "listing")
						
						
					}}
				>
					<ThemedText
											
											>
											  List for Sale for {pricePerToken} {chainCurrency}
											</ThemedText>
				</TransactionButton>
		</div>
	);
}
