import React, { useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { client } from "@/constants/thirdweb";
import { ADDRESS_ZERO, defineChain, getContract } from "thirdweb";
import { cancelListing } from "thirdweb/extensions/marketplace";
import {
  TransactionButton,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";
import { useMarketplaceData } from "@/constants/marketProvider";

type Props = {
  account: Account;
  listingId: bigint;
  currentNFT: any;
  price: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
};

export default function CancelListingButton({
  account,
  listingId,
  currentNFT,
  price,
  tokenId,
  contractAddress,
  chainId,
}: Props) {

  const { validListings, validAuctions, ScMarketListing, refetchMarketplace } = useMarketplaceData();

  const directListing = useMemo(
    () =>
      validListings?.find(
        (l: any) =>
          l.assetContractAddress === contractAddress &&
          l.tokenId === tokenId &&
          chainId === chainId
      ),
    [validListings, contractAddress, tokenId, chainId]
  );

  return (
    <ThemedView style={styles.card}>
      {/* NFT Information */}
      <ThemedText style={styles.title}>
        Cancel Listing for {currentNFT.name || "Unknown NFT"}
      </ThemedText>
      <View style={styles.divider} />

      {/* NFT Details */}
      <ThemedText style={styles.label}>Token ID:</ThemedText>
      <ThemedText style={styles.value}>{tokenId}</ThemedText>

      <ThemedText style={styles.label}>Price:</ThemedText>
      <ThemedText style={styles.value}>{price}</ThemedText>

      <ThemedText style={styles.label}>Description:</ThemedText>
      <ThemedText style={styles.value}>
        {currentNFT.description || "No description available"}
      </ThemedText>

      {/* Cancel Button */}
      <View style={styles.divider} />
      <TransactionButton
        transaction={() => {
          return cancelListing({
            contract: getContract({
              client,
              chain: defineChain(chainId),
              address: directListing?.marketplaceAddress || ADDRESS_ZERO,
            }),
            listingId,
          });
        }}
        onTransactionSent={() => {
          Alert.alert("Transaction Sent", "Cancel listing transaction has been sent.");
        }}
        onError={(error) => {
          Alert.alert("Error", "Failed to cancel listing. Please try again.");
          console.error("Error canceling listing:", error);
        }}
        onTransactionConfirmed={async (txResult) => {
          refetchMarketplace(
            getContract({
              client,
              chain: defineChain(chainId),
              address: directListing?.marketplaceAddress || ADDRESS_ZERO,
            }),
            "listing"
          );
          Alert.alert("Success", "Listing canceled successfully!");
        }}
        style={styles.cancelButton}
      >
        <ThemedText style={styles.cancelButtonText}>Cancel Listing</ThemedText>
      </TransactionButton>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    color: "#a8dadc",
    fontWeight: "600",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#2d2d44",
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#a8dadc",
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: "#ff4d4f",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});