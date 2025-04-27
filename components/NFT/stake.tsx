import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { defineChain, getContract, prepareContractCall } from "thirdweb";
import { ethers } from "ethers";
import { client } from "@/constants/thirdweb";

/**
 * Stake Component - Allows users to stake their NFT into the StarCrazy staking contract on IoTeX.
 *
 * - **Users must approve the staking contract to transfer their NFT.**
 * - **Once staked, the NFT is held in the contract until the user withdraws it.**
 * - **Uses the `approveAndCall` function to approve and transfer the NFT in a single step.**
 */

export default function Stake({ tokenId }: { tokenId: string }) {
  const account = useActiveAccount();

  return (
    <ThemedView style={styles.stakeContainer}>
      {/* ✅ Information for the User */}
      <ThemedView style={styles.infoBox}>
        <ThemedText style={styles.title}>Stake Your NFT</ThemedText>
        <ThemedText style={styles.infoText}>
          By staking your NFT, you are{" "}
          <ThemedText style={styles.boldText}>transferring ownership temporarily</ThemedText>{" "}
          to the staking contract. Your NFT will be locked in the{" "}
          <ThemedText style={styles.boldText}>StarCrazy Staking Contract</ThemedText>{" "}
          until you manually{" "}
          <ThemedText style={styles.boldText}>withdraw it</ThemedText>.
        </ThemedText>
        <View style={styles.list}>
          <ThemedText style={styles.listItem}>
            ✅ Your NFT is securely held in the staking contract.
          </ThemedText>
          <ThemedText style={styles.listItem}>
            ✅ You cannot transfer or sell the NFT while it's staked.
          </ThemedText>
          <ThemedText style={styles.listItem}>
            ✅ You must withdraw the NFT to regain ownership.
          </ThemedText>
        </View>
        <ThemedText style={styles.warningText}>
          Once staked, your NFT remains locked until you decide to withdraw it.
        </ThemedText>
      </ThemedView>

      {/* ✅ Staking Button */}
      <TransactionButton
        transaction={() => {
          const extraData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"],
            [1, tokenId]
          ) as `0x${string}`;

          return prepareContractCall({
            contract: getContract({
              client,
              chain: defineChain(4689), // IoTeX Mainnet (StarCrazy runs on IoTeX)
              address: "0xec0cd5c1d61943a195bca7b381dc60f9f545a540", // StarCrazy NFT contract
            }),
            method: "function approveAndCall(address _spender, uint256 _tokenId, bytes _extraData)",
            params: [
              "0xdae9c3b046171c0f5f8b295655b1bcb92c245938", // Staking contract address
              BigInt(tokenId), // The ID of the NFT being staked
              extraData, // Encoded staking flag
            ],
            gas: 500000n, // Gas limit for staking transaction
            type: "eip1559", // Uses Ethereum's EIP-1559 transaction type
            maxFeePerGas: 1000000000000n, // Max gas fee per unit (1 Qwei)
            maxPriorityFeePerGas: 1000000000000n, // Priority fee (miner tip, also 1 Qwei)
          });
        }}
        onTransactionSent={() => {
          console.log("Staking transaction sent");
          Alert.alert("Transaction Sent", "Staking transaction has been sent.");
        }}
        onError={(error) => {
          console.error("Staking failed with error:", error);
          Alert.alert("Staking Failed", error.message);
        }}
        onTransactionConfirmed={async (txResult) => {
          console.log("Staking confirmed:", txResult);
          Alert.alert("Success", "NFT has been staked successfully!");
          // Optionally, refresh UI to show updated staking status
        }}
        style={styles.stakeButton}
      >
        <ThemedText style={styles.stakeButtonText}>Stake NFT</ThemedText>
      </TransactionButton>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  stakeContainer: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 500,
    width: "100%",
    marginHorizontal: "auto",
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#f5f5f5",
    textAlign: "center",
    marginBottom: 12,
  },
  boldText: {
    fontWeight: "700",
    color: "#fff",
  },
  list: {
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    color: "#f5f5f5",
    marginVertical: 4,
    textAlign: "center",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  stakeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  stakeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});