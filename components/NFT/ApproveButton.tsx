/**
 * ApprovalButton Component
 * ------------------------
 * This component handles setting approval for an operator on an ERC-721 contract.
 * 
 * @param {string} contractAddress - The NFT contract that requires approval
 * @param {Address} address - The operator address that will be approved
 * @param {number} chainId - The blockchain network ID
 * 
 * Functionality:
 *  - Calls `setApprovalForAll` to allow an operator to manage all user NFTs.
 *  - Displays toast notifications for transaction status.
 */

import { TransactionButton } from "thirdweb/react";
import { setApprovalForAll } from "thirdweb/extensions/erc721";
import { Address, defineChain, getContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "../ThemedText";


export default function ApprovalButton({
  contractAddress,
  chainId,
  marketplaceAddress
}: {
  contractAddress: string;
  chainId: number;
  marketplaceAddress: string;
}) {
    // ✅ Initialize the NFT contract instance

  const Contract = getContract({
    address: contractAddress,
    client,
    chain: defineChain(chainId),
  });

    return (
      <TransactionButton
        transaction={() => {
          
           
          return setApprovalForAll({
            contract: Contract,
            operator: marketplaceAddress,
            approved: true,
          });
        }}
        onTransactionSent={() => {
          
        }}
        onError={(error) => {
         
        }}
        onTransactionConfirmed={(txResult) => {
          
        }}
      >
        <ThemedText
                        
                        >
                          Approve
                        </ThemedText>
        
      </TransactionButton>
    );
  }