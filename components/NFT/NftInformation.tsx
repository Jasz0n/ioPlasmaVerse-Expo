import React, { FC, useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { TransactionButton, useActiveAccount, useReadContract, useSendAndConfirmTransaction } from "thirdweb/react";
import { Address, ADDRESS_ZERO, defineChain, getContract, getRpcClient, NATIVE_TOKEN_ADDRESS, prepareContractCall, readContract, sendTransaction } from "thirdweb";

import { bidInAuction } from "thirdweb/extensions/marketplace";
import { EnglishAuction, DirectListing, ScListing, useMarketplaceData } from "@/constants/marketProvider";
import { client } from "@/constants/thirdweb";
import BuyListingButton from "./buyListingButton";
import ApprovalButtonERC20 from "./ApproveErc20";
import BuyListingButtonErc20 from "./erc20Buybutton";


const MARKETPLACE_CONTRACT_ADDRESS = "0xa800ca984790ad1be4d7d84a06ada8bb43ddb082";
type BuyingStep = "approval" | "confirm" | "approvalNative";

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
  marketplaceAddress?: string;
  nativeCurrency?: string;
};

export const NftInformation: FC<INFTCardProps> = ({
  contractAddress,
  nativeCurrency,
  tokenId,
  chainId,
  marketplaceAddress,
}) => {
  const account = useActiveAccount();
  const [bidAmount, setBidAmount] = useState<string>("");
  const [fetchStatus, setFetchStatus] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [buyingStep, setBuyingStep] = useState<BuyingStep>("approval");
  const [isTokenApproved, setIsTokenApproved] = useState(false);

  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { validListings, validAuctions, ScMarketListing, refetchMarketplace } = useMarketplaceData();

  const auctionListing = useMemo(
    () =>
      validAuctions?.find(
        (l): l is EnglishAuction =>
          l.assetContractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === BigInt(tokenId) &&
          chainId === chainId
      ),
    [validAuctions, contractAddress, tokenId, chainId]
  );

  const SCListing = useMemo(
    () =>
      ScMarketListing?.find(
        (l): l is ScListing =>
          l.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === tokenId
      ),
    [ScMarketListing, contractAddress, tokenId]
  );

  const directListing = useMemo(
    () =>
      validListings?.find(
        (l): l is DirectListing =>
          l.assetContractAddress.toLowerCase() === contractAddress.toLowerCase() &&
          BigInt(l.tokenId) === tokenId &&
          chainId === chainId
      ),
    [validListings, contractAddress, tokenId, chainId]
  );

  const formatRemainingTime = (timestamp: bigint) => {
    const remainingTimeInSeconds = Number(timestamp) - Math.floor(Date.now() / 1000);
    if (remainingTimeInSeconds <= 0) return "Expired";

    const days = Math.floor(remainingTimeInSeconds / (24 * 60 * 60));
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;

    const hours = Math.floor((remainingTimeInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
    const seconds = remainingTimeInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  const address = marketplaceAddress as `0x${string}`;

  useEffect(() => {
    if (
      (directListing && directListing.currencyContractAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()) ||
      (auctionListing && auctionListing.currencyContractAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase())
    ) {
      const contract = getContract({
        address: directListing?.currencyContractAddress || auctionListing?.currencyContractAddress || contractAddress,
        client,
        chain: defineChain(chainId),
      });

      const checkApprovalErc20 = async () => {
        const ERC20Approval = await readContract({
          contract,
          method: "function allowance(address owner, address spender) view returns (uint256)",
          params: [account?.address || ADDRESS_ZERO, address],
        });
        try {
          if (ERC20Approval && account && directListing) {
            setIsTokenApproved(BigInt(ERC20Approval) >= BigInt(directListing.pricePerToken));
          }
        } catch (error) {
          console.error("Error fetching ERC20 approval Depinny:", error);
        }
      };

      checkApprovalErc20();
    }
  }, [account, directListing, auctionListing, address]);

  const handleSetApproval2 = async (price: string) => {
    const tokenContract = getContract({
      address: "0x17df9fbfc1cdab0f90eddc318c4f6fcada730cf2",
      client,
      chain: defineChain(chainId),
    });

    setIsApproving(true);

    try {
      const tx = await prepareContractCall({
        contract: tokenContract,
        method: "function approve(address spender, uint256 value) returns (bool)",
        params: ["0xa800ca984790ad1be4d7d84a06ada8bb43ddb082", 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
        gas: 500000n,
        gasPrice: 1000000000000n,
      });

      await mutateTransaction(tx);
      setBuyingStep("confirm");
      setIsApproving(false);
    } catch (err) {
      console.error("Error during approval:", err);
      setIsApproving(false);
    }
  };

  const buyNFT = async (tokenId: string, price: string) => {
    if (!account) return;
    try {
      setFetchStatus(`Processing purchase for Token ID ${tokenId}...`);
      const rpcClient = getRpcClient({ client, chain: defineChain(chainId) });

      const marketContract = getContract({
        address: MARKETPLACE_CONTRACT_ADDRESS,
        client: client,
        chain: defineChain(chainId),
      });

      const tx = await prepareContractCall({
        contract: marketContract,
        method: "function buySaleAliana(uint256 _tokenId)",
        params: [BigInt(tokenId)],
      });

      const { transactionHash } = await sendTransaction({ account, transaction: tx });

      console.log(`Successfully purchased Token ID ${tokenId}. TxHash: ${transactionHash}`);
      setFetchStatus(`Successfully purchased Token ID ${tokenId}.`);
      setBuyingStep("approval");
    } catch (error) {
      console.error(`Failed to buy Token ID ${tokenId}:`, error);
      setFetchStatus(`Failed to buy Token ID ${tokenId}.`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {directListing || auctionListing || SCListing ? (
        <ThemedView style={styles.priceContainer}>
          <ThemedText style={styles.label}>Price</ThemedText>
          <ThemedText style={styles.priceValue}>
            {directListing && (
              <>
                {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                  <>
                    {directListing.pricePerToken} {nativeCurrency}
                    {"\n"}Currency Contract Address: {directListing.currencyContractAddress}
                    {"\n"}Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}
                    {"\n"}End Time: {formatRemainingTime(BigInt(directListing.endTimeInSeconds))}
                  </>
                ) : directListing.currencyContractAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                  <>
                    {directListing.pricePerToken} {directListing.currencySymbol}
                    {"\n"}Currency Contract Address: {directListing.currencyContractAddress}
                    {"\n"}Start Time: {new Date(Number(directListing.startTimeInSeconds) * 1000).toLocaleString()}
                    {"\n"}End Time: {formatRemainingTime(BigInt(directListing.endTimeInSeconds))}
                  </>
                ) : (
                  "Currency not supported"
                )}
              </>
            )}
            {auctionListing && (
              <>
                {auctionListing.minimumBidCurrencyValue}
                {"\n"}Buy Direct for: {auctionListing.buyoutCurrencyValue}
                {"\n"}Currency Contract Address: {auctionListing.currencyContractAddress}
                {"\n"}Start Time: {new Date(Number(auctionListing.startTimeInSeconds) * 1000).toLocaleString()}
                {"\n"}End Time: {formatRemainingTime(BigInt(auctionListing.endTimeInSeconds))}
              </>
            )}
          </ThemedText>
          {SCListing && (
            <ThemedText style={styles.priceValue}>
              We are routing this buy from the SC Marketplace
              {"\n"}Buy Direct for: {SCListing.price} GFT
              {"\n"}Currency Contract Address: 0x17df9fbfc1cdab0f90eddc318c4f6fcada730cf2
            </ThemedText>
          )}
          {SCListing && (
            <View>
              {buyingStep === "approval" && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleSetApproval2(SCListing.price)}
                >
                  <ThemedText style={styles.buttonText}>Approve Now</ThemedText>
                </TouchableOpacity>
              )}
              {buyingStep === "confirm" && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => buyNFT(tokenId.toString(), SCListing.price)}
                >
                  <ThemedText style={styles.buttonText}>Buy Now</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
          {auctionListing && (
            <>
              <ThemedText style={[styles.label, { marginTop: 12 }]}>Bids starting from</ThemedText>
              <ThemedText style={styles.priceValue}>
                {auctionListing.minimumBidCurrencyValue} {nativeCurrency || ""}
              </ThemedText>
              <ThemedText style={[styles.label, { marginTop: 12 }]}>Create Bid</ThemedText>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder="Enter bid amount"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
              <TransactionButton
                transaction={() => {
                  if (!account) throw new Error("No account");
                  if (!auctionListing) throw new Error("No valid listing found for this NFT");

                  return bidInAuction({
                    contract: getContract({
                      client,
                      chain: defineChain(auctionListing.chainId),
                      address: auctionListing.marketplaceAddress,
                    }),
                    auctionId: BigInt(auctionListing.id),
                    bidAmount: bidAmount,
                  });
                }}
                onTransactionSent={() => {
                  console.log("Transaction sent");
                  Alert.alert("Placing bid...");
                }}
                onError={(error) => {
                  console.error("Transaction failed with error:", error);
                  Alert.alert("Bid Failed!", error.message);
                }}
                onTransactionConfirmed={async (txResult) => {
                  console.log("Transaction confirmed with result:", txResult);
                  refetchMarketplace(
                    getContract({
                      client,
                      chain: defineChain(auctionListing.chainId),
                      address: auctionListing.marketplaceAddress,
                    }),
                    "auction"
                  );
                  Alert.alert("Success", "Bid Placed Successfully!");
                }}
                style={styles.transactionButton}
              >
                <ThemedText style={styles.transactionButtonText}>Place Bid Now</ThemedText>
              </TransactionButton>
            </>
          )}
          <View style={styles.buttonContainer}>
            {directListing && (
              <>
                {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                  <BuyListingButton
                    directListing={directListing}
                    nativeCurrency={nativeCurrency}
                  />
                ) : !isTokenApproved && directListing.currencyContractAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                  <ApprovalButtonERC20
                    amount={directListing.pricePerToken.toString()}
                    address={address}
                    chainId={chainId}
                    currencyAddress={directListing.currencyContractAddress}
                    onApproved={() => setIsTokenApproved(true)}
                  />
                ) : (
                  isTokenApproved &&
                  directListing.currencyContractAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
                  account && (
                    <BuyListingButtonErc20
                      directListing={directListing}
                      account={account.address as `0x${string}`}
                    />
                  )
                )}
              </>
            )}
            {auctionListing && (
              <BuyListingButton
                directListing={directListing || undefined}
                auctionListing={auctionListing}
              />
            )}
          </View>
        </ThemedView>
      ) : (
        <ThemedView style={styles.priceContainer}>
          <ThemedText style={styles.label}>Price</ThemedText>
          <ThemedText style={styles.priceValue}>Not for sale</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  priceContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  label: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  transactionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 16,
  },
});