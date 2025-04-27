"use client";
/**
 * ApprovalButtonERC20 Component
 * -----------------------------
 * This component allows a user to approve an ERC-20 token for spending by a specific address.
 *
 * @param {string} currencyAddress - The ERC-20 contract address
 * @param {string} amount - The amount of tokens to approve
 * @param {number} chainId - The blockchain network ID
 * @param {string} address - The spender address (who can use the tokens)
 * @param {() => void} onApproved - Callback function executed after approval
 *
 * Features:
 *  - Uses `approve()` from the ERC20 extension.
 *  - Displays toast notifications for transaction status.
 *  - Handles errors gracefully and logs them for debugging.
 */

import { TransactionButton } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import toast from "react-hot-toast";
import { Address, defineChain, getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";



export default function ApprovalButtonERC20({
  amount,
  chainId,
  address,
  currencyAddress,
  	onApproved
}: {
  currencyAddress: string;
  amount: string;
  chainId: number;
  address: string;
  onApproved: () => void;}) {
 
    /**
   * Handles the approval transaction.
   * Calls the ERC20 `approve` function to allow the spender to use the specified amount of tokens.
   */
  const handleApproval = async () => {
    

    try {
      const transaction = await approve({
      contract: getContract({
      client,
      chain: defineChain(chainId),
      address: currencyAddress,
     }),
        spender: address,
        amount,
      });
      return transaction;
    } catch (error) {
      throw error;
    }
  };

  return (
    <TransactionButton
      transaction={handleApproval}
      onTransactionSent={() => {
        console.log("Transaction sent...");
        
      }}
      onError={(error) => {
        console.error("Approval Failed:", error);
        
      }}
      onTransactionConfirmed={(txResult) => {
        console.log("Transaction confirmed:", txResult);
        
        onApproved();
      }}
    >
      <ThemedText
                              
                              >
                                Approve
                              </ThemedText>
    </TransactionButton>
  );
}
