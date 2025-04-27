type FunctionDefinition = {
    inputs: string[];
  };

export const functionDefinitionsERC721Drop: Record<string, Record<string, FunctionDefinition>> = {
    ERC721: {
      approve: { inputs: ["to", "tokenId"] },
      safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
      safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
      transferFrom: { inputs: ["from", "to", "tokenId"] },
    },
    ERC721Burnable: {
      burn: { inputs: ["tokenId"] },
    },
    ERC721LazyMintable: {
      lazyMint: { inputs: ["amount", "baseURI", "extraData"] },
    },
    ERC721Revealable: {
      reveal: { inputs: ["identifier", "key"] },
    },
    ERC721ClaimPhasesV2: {
      claim: { inputs: ["receiver", "quantity", "currency", "pricePerToken", "allowlistProof", "data"] },
      claimTo: { inputs: ["toAddress", "quantity"] },
      setClaimConditions: { inputs: ["phases"] },
    },
    Royalty: {
      setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
      setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
    },
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
    Ownable: {
      setOwner: { inputs: ["newOwner"] },
    },
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      freezeBatchBaseURI: { inputs: ["index"] },
      multicall: { inputs: ["data"] },
      setFlatPlatformFeeInfo: { inputs: ["PlatformFeeRecipient", "Flat Fee"] },
      setMaxTotalSupply: { inputs: ["MaxTotalSupply"]  },
      setPlatformFeeType: { inputs: ["FeeType"]  },
      updateBatchBaseURI: { inputs: ["index", "uri"]  },
  
  
  
    },
  };
  
  
export const functionDefinitionsErc721OpenEdition: Record<string, Record<string, FunctionDefinition>> = {
    ERC721: {
      approve: { inputs: ["to", "tokenId"] },
      safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
      safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
      transferFrom: { inputs: ["from", "to", "tokenId"] },
    },
    ERC721Burnable: {
      burn: { inputs: ["tokenId"] },
    },
    ERC721ClaimPhasesV2: {
      claim: { inputs: ["receiver", "quantity", "currency", "pricePerToken", "allowlistProof", "data"] },
      claimTo: { inputs: ["toAddress", "quantity"] },
      setClaimConditions: { inputs: ["phases"] },
    },
    ERC721UpdatableMetadata: {
      freezeMetadata: { inputs: [""] },
      setTokenURI: { inputs: ["tokenId", "uri"] },
    },
    Royalty: {
      setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
      setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
    },
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
    Ownable: {
      setOwner: { inputs: ["newOwner"] },
    },
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      initialize: { inputs: ["DefautAdmin","Name","Symbol","contractURI","TrustedForwarders","SaleRecipien","RoyaltyRecipien","RoyaltyBPS","PlattformFeeInBPS","PlattformFeeRecipion"] },
  
  
    },
  };
  
  export const functionDefinitionsErc721NFTCollection: Record<string, Record<string, FunctionDefinition>> = {
    ERC721: {
      approve: { inputs: ["to", "tokenId"] },
      safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
      safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
      transferFrom: { inputs: ["from", "to", "tokenId"] },
    },
    ERC721Burnable: {
      burn: { inputs: ["tokenId"] },
    },
    ERC721Mintable: {
      mintTo: { inputs: ["to", "URI"] },
    },
    ERC721BatchMintable: {
      multicall: { inputs: ["data"] },
    },
    ERC721SignatureMintV1: {
      mintWithSignature: { inputs: ["Req", "Signature"] },
    },
    ERC721SharedMetadata: {
    setSharedMetadata: { inputs: [""] },
    },
    Royalty: {
      setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
      setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
    },
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
    Ownable: {
      setOwner: { inputs: ["newOwner"] },
    },
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      initialize: { inputs: ["DefautAdmin","Name","Symbol","contractURI","TrustedForwarders","SaleRecipien","RoyaltyRecipien","RoyaltyBPS","PlattformFeeInBPS","PlattformFeeRecipion"] },
      multicall: { inputs: ["data"] },
    },
  };
  
  export const functionDefinitionsErc1155NFTCollection: Record<string, Record<string, FunctionDefinition>> = {
    ERC1155: {
      safeBatchTransferFrom: { inputs: ["from", "to", "Ids[]","Values[]","Data"] },
      safeTransferFrom: { inputs: ["from", "to", "id","value", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
    },
    ERC1155Burnable: {
      burn: { inputs: ["Account","Ids[]","Values[]"] },
      burnBatch: { inputs: ["Account","Id","Value"] },
  
    },
    ERC1155Mintable: {
      mintTo: { inputs: ["tokenId", "URI","Amount"] },
    },
    ERC1155BatchMintable: {
      multicall: { inputs: ["data"] },
    },
    ERC1155SignatureMintV1: {
      mintWithSignature: { inputs: ["Req", "Signature"] },
    },
    ERC1155UpdatableMetadata: {
      freezeMetadata: { inputs: [""] },
      setTokenURI: { inputs: ["tokenId", "uri"] },
    },
    Royalty: {
      setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
      setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
    },
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
    Ownable: {
      setOwner: { inputs: ["newOwner"] },
    },
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      initialize: { inputs: ["DefautAdmin","Name","Symbol","contractURI","TrustedForwarders","SaleRecipien","RoyaltyRecipien","RoyaltyBPS","PlattformFeeInBPS","PlattformFeeRecipion"] },
      setFlatPlatformFeeInfo: { inputs: ["PlatformFeeRecipient","FlatFee"] },   
      setPlatformFeeType: { inputs: ["FeeType"] },
    },
  };
  
  export const functionDefinitionsErc1155NFTDrop: Record<string, Record<string, FunctionDefinition>> = {
    ERC1155: {
      safeBatchTransferFrom: { inputs: ["from", "to", "Ids[]","Values[]","Data"] },
      safeTransferFrom: { inputs: ["from", "to", "id","value", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
    },
    
    ERC1155LazyMintableV2: {
      lazyMint: { inputs: ["amount", "baseURI", "extraData"] },
    },
    
    ERC1155ClaimPhasesV2: {
      claim: { inputs: ["receiver","tokenId", "quantity", "currency", "pricePerToken", "allowlistProof", "data"] },
      setClaimConditions: { inputs: ["tokenId","phases"] },
    },
    Royalty: {
      setDefaultRoyaltyInfo: { inputs: ["royaltyRecipient", "royaltyBps"] },
      setRoyaltyInfoForToken: { inputs: ["tokenId", "royaltyRecipient", "royaltyBps"] },
    },
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
    Ownable: {
      setOwner: { inputs: ["newOwner"] },
    },
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      burnBatch: { inputs: ["Account","Ids[]","values[]"] },
      freezeBatchBaseURI: { inputs: ["index"] },
      multicall: { inputs: ["data"] },
      setFlatPlatformFeeInfo: { inputs: ["PlatformFeeRecipient", "Flat Fee"] },
      setMaxTotalSupply: { inputs: ["MaxTotalSupply"]  },
      setPlatformFeeType: { inputs: ["FeeType"]  },
      updateBatchBaseURI: { inputs: ["index", "uri"]  },
    },
  };
  
 export const functionDefinitionsErc20TokenMint: Record<string, Record<string, FunctionDefinition>> = {
    ERC20: {
      approve: { inputs: ["Spender","Values"] },
      transfer: { inputs: ["To", "Value"] },
      transferFrom: { inputs: ["From", "to","Value"] },
    },
    ERC20Burnable: {
      burn: { inputs: ["amount"] },
      burnFrom: { inputs: ["account","amount"] },
  
    },
    
    ERC20Mintable: {
      mintTo: { inputs: ["to", "amount"] },
    },
    
    ERC20Permit: {
      permit: { inputs: ["owner","spender", "value", "Deadline", "v", "r", "s"] },
    },
   
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
   
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      decreaseAllowance: { inputs: ["Spemder","SubtractedValue"] },
      delegate: { inputs: ["delegate"] },
      delegateBySig: { inputs: ["delegate","Npnce","Expiry","v","R","S"] },
      increaseAllowance: { inputs: ["Spender", "Added Value"] },
      
    },
  };
  export const functionDefinitionsErc20TokenDrop: Record<string, Record<string, FunctionDefinition>> = {
    ERC20: {
      approve: { inputs: ["Spender","Values"] },
      transfer: { inputs: ["To", "Value"] },
      transferFrom: { inputs: ["From", "to","Value"] },
    },
    ERC20Burnable: {
      burn: { inputs: ["amount"] },
      burnFrom: { inputs: ["account","amount"] },
  
    },
    
    ERC20ClaimPhasesV2: {
      claim: { inputs: ["to", "amount","curreny","pricePerToken","AllowlistProof","data"] },
    },
    
    ERC20Permit: {
      permit: { inputs: ["owner","spender", "value", "Deadline", "v", "r", "s"] },
    },
   
    PlatformFee: {
      setPlatformFeeInfo: { inputs: ["platformFeeRecipient", "platformFeeBps"] },
    },
    PrimarySale: {
      setPrimarySaleRecipient: { inputs: ["saleRecipient"] },
    },
    Permissions: {
      grantRole: { inputs: ["role","saleRecipient"] },
      renounceRole: { inputs: ["role","saleRecipient"] },
      revokeRole: { inputs: ["role","saleRecipient"] },
  
    },
   
    ContractMetadata: {
      setContractURI: { inputs: ["uri"] },
    },
    OtherFunctions: {
      decreaseAllowance: { inputs: ["Spemder","SubtractedValue"] },
      delegate: { inputs: ["delegate"] },
      delegateBySig: { inputs: ["delegate","Npnce","Expiry","v","R","S"] },
      increaseAllowance: { inputs: ["Spender", "Added Value"] },
      Multicall: { inputs: ["data"] },
      setFlatPlatformFeeInfo: { inputs: ["PlattFormFeeRecipient", "FlatFee"] },
      Max: { inputs: ["MaxTotalSupply"] },
      setPlatformFeeType: { inputs: ["FeeType"] },
      
    },
  };
  
  export const functionDefinitionsDefault: Record<string, Record<string, FunctionDefinition>> = {
    ERC721: {
      approve: { inputs: ["to", "tokenId"] },
      safeTransferFrom: { inputs: ["from", "to", "tokenId"] },
      safeTransferFromWithData: { inputs: ["from", "to", "tokenId", "data"] },
      setApprovalForAll: { inputs: ["operator"] },
      transferFrom: { inputs: ["from", "to", "tokenId"] },

    },
    };

    export const functionDefinitioPredicion: Record<string, Record<string, FunctionDefinition>> = {
      PredictionMarket: {
        addAdmin: { inputs: ["Admin"] },
        claimWinnings: { inputs: ["marketId"] },
        createMarket: { inputs: ["Question", "OptionA", "OptionB", "Duration", "Allocated Funds"] },
        resolveMarket: { inputs: ["marketId", "outcome"] },
        removeAdmin: { inputs: ["Admin"] },
        setContractURI: { inputs: ["uri"] },
        claimUnclaimedRewards: { inputs: ["marketId"] },
        multicall: { inputs: ["data"] },
        setOwner: { inputs: ["address"] },

      },
      };


    interface ReadFunction {
        inputs: string[];
      }
      
      interface ReadFunctions {
        [key: string]: {
          [key: string]: ReadFunction;
        };
      }
      
      export const readFunctionsERC721NFTDropp: ReadFunctions = {
        ERC721: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          ownerOf: { inputs: ["tokenId"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
          tokenURI: { inputs: ["tokenId"] },
        },
        ERC721Supply: {
          totalSupply: { inputs: [] },
        },
        ERC721Revealable: {
          encryptDecrypt: { inputs: ["Data", "Key"] },
        },
        Royalty: {
          getDefaultRoyaltyInfo: { inputs: [] },
          getDefaultRoyaltyToken: { inputs: ["tokenId"] },
          royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
          supportsInterface: { inputs: ["InterfaceId"] },
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Ownable: {
          owner: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          batchFrozen: { inputs: ["Key"] },
          claimCondition: { inputs: [] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          encryptedData: { inputs: ["Key"] },
          getActiveClaimConditionId: { inputs: [] },
          getBaseURICount: { inputs: [] },
          getBatchIdAtIndex: { inputs: ["Index"] },
          getClaimConditionById: { inputs: ["ConditionId"] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          getRevealURI: { inputs: ["BatchId", "Key"] },
          getSupplyClaimedByWallet: { inputs: ["ConditionId", "Claimer"] },
          hasRoleWithSwitch: { inputs: ["Role", "Account"] },
          isEncryptedBatch: { inputs: ["BatchId"] },
          maxTotalSupply: { inputs: [] },
          nextTokenIdToClaim: { inputs: [] },
          nextTokenIdToMint: { inputs: [] },
          totalMinted: { inputs: [] },
          totalMintedByCondition: { inputs: ["ConditionId", "Claimer", "Quantity", "Currency", "PricePerToken", "AllowListProof"] },
          getOwnedTokenIds: { inputs: ["owner"] },
          getAllOwners: { inputs: ["start", "count"] },
          tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
        },
      };
      
     export const readFunctionsERC721OpenEdition: ReadFunctions = {
        ERC721: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          ownerOf: { inputs: ["tokenId"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
          tokenURI: { inputs: ["tokenId"] },
        },
        ERC721Supply: {
          totalSupply: { inputs: [] },
        },
        ERC721AQueryable: {
          explicitOwnershipOf: { inputs: ["tokenId"] },
          supportsInterface: { inputs: ["InterfaceId"] },
          tokensOfOwner: { inputs: ["Owner"] },
          tokensOfOwnerIn: { inputs: ["Owner","start","stop"] },
        },
        ERC721SharedMetadata: {
          sharedMetadata: { inputs: [] },
        },
        Royalty: {
          getDefaultRoyaltyInfo: { inputs: [] },
          getDefaultRoyaltyToken: { inputs: ["tokenId"] },
          royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
          supportsInterface: { inputs: ["InterfaceId"] },
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Ownable: {
          owner: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          claimCondition: { inputs: [] },
          getActiveClaimConditionId: { inputs: [] },
          getClaimConditionById: { inputs: ["ConditionId"] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          getRevealURI: { inputs: ["BatchId", "Key"] },
          getSupplyClaimedByWallet: { inputs: ["ConditionId", "Claimer"] },
          hasRoleWithSwitch: { inputs: ["Role", "Account"] },
          nextTokenIdToClaim: { inputs: [] },
          nextTokenIdToMint: { inputs: [] },
          totalMinted: { inputs: [] },
          startTokenId: { inputs: [] },
          verifyClaim: { inputs: ["ConditionId", "Claimer", "Quantity", "Currency", "PricePerToken", "AllowListProof"] },
          getOwnedTokenIds: { inputs: ["owner"] },
          getAllOwners: { inputs: ["start", "count"] },
          tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
        },
      };
    export const readFunctionsERC1155NFTCollection: ReadFunctions = {
        ERC1155: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          uri: { inputs: ["id"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
        },
        ERC1155Supply: {
          totalSupply: { inputs: [] },
        },
        ERC1155Enumerable: {
          nextTokenIdToMint: { inputs: [] },
        },
       
        Royalty: {
          getDefaultRoyaltyInfo: { inputs: [] },
          getDefaultRoyaltyToken: { inputs: ["tokenId"] },
          royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
          supportsInterface: { inputs: ["InterfaceId"] },
      
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Ownable: {
          owner: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          batchFrozen: { inputs: ["key"] },
          claimCondition: { inputs: ["key"] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          getActiveClaimConditionId: { inputs: ["tokenId"] },
          getBaseURICount: { inputs: [] },
          getBatchIdAtIndex: { inputs: ["index"] },
          getClaimConditionById: { inputs: ["index","ConditionId"] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          getSupplyClaimedByWallet: { inputs: ["tokenId","ConditionId","Claimer"] },
          hasRoleWithSwitch: { inputs: ["Role","Account"] },
          maxTotalSupply: { inputs: ["key"] },
          saleRecipient: { inputs: ["key"] },
          verifyClaim: { inputs: ["ConditionId","Claimer","tokenId","Quantity","currency","pricePerToken","allowListProof"] },
      
        },
      };
    export const readFunctionsERC1155NFTDrop: ReadFunctions = {
        ERC1155: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          uri: { inputs: ["id"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
        },
        ERC1155Supply: {
          totalSupply: { inputs: [] },
        },
        ERC1155Enumerable: {
          nextTokenIdToMint: { inputs: [] },
        },
       
        Royalty: {
          getDefaultRoyaltyInfo: { inputs: [] },
          getDefaultRoyaltyToken: { inputs: ["tokenId"] },
          royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
          supportsInterface: { inputs: ["InterfaceId"] },
      
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Ownable: {
          owner: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          batchFrozen: { inputs: ["key"] },
          claimCondition: { inputs: ["key"] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          getActiveClaimConditionId: { inputs: ["tokenId"] },
          getBaseURICount: { inputs: [] },
          getBatchIdAtIndex: { inputs: ["index"] },
          getClaimConditionById: { inputs: ["index","ConditionId"] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          getSupplyClaimedByWallet: { inputs: ["tokenId","ConditionId","Claimer"] },
          hasRoleWithSwitch: { inputs: ["Role","Account"] },
          maxTotalSupply: { inputs: ["key"] },
          saleRecipient: { inputs: ["key"] },
          verifyClaim: { inputs: ["ConditionId","Claimer","tokenId","Quantity","currency","pricePerToken","allowListProof"] },
      
        },
      };

      
      export const readFunctionsPrediction: ReadFunctions = {
        ERC721: {
          admins: { inputs: ["address"] },
          contractType: { inputs: [] },
          contractURI: { inputs: [] },
          contractVersion: { inputs: [] },
          getAdminList: { inputs: [] },
          getSharesBalance: { inputs: ["marketId", "user"] },
          getMarketInfo: { inputs: ["marketId"] },
          marketCount: { inputs: [] },
          feeReceiver: { inputs: [] },
          markets: { inputs: ["key"] },
          owner: { inputs: [] },          
          rewardToken: { inputs: [] },

        },
        
      };

     export const readFunctionsERC721NFTCollection: ReadFunctions = {
        ERC721: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          ownerOf: { inputs: ["tokenId"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
          tokenURI: { inputs: ["tokenId"] },
        },
        ERC721Supply: {
          totalSupply: { inputs: [] },
        },
        ERC721Enumerable: {
          tokenByIndex: { inputs: ["index"] },
          tokenOfOwnerByIndex: { inputs: ["owner","index"] },
        },
        ERC721SignatureMintV1: {
          verify: { inputs: ["req","Signuture"] },
        },
        Royalty: {
          getDefaultRoyaltyInfo: { inputs: [] },
          getDefaultRoyaltyToken: { inputs: ["tokenId"] },
          royaltyInfo: { inputs: ["tokenId", "SalePrice"] },
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Ownable: {
          owner: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          eip712Domain: { inputs: [] },
          nextTokenIdToMint: { inputs: [] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          uriFrozen: { inputs: [] },
          getOwnedTokenIds: { inputs: ["owner"] },
          getAllOwners: { inputs: ["start", "count"] },
          tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
        },
      };
      
      export const readFunctionsDefault: ReadFunctions = {
        ERC721: {
          balanceOf: { inputs: ["Owner"] },
          getApproved: { inputs: ["tokenId"] },
          isApprovedForAll: { inputs: ["Owner", "Operator"] },
          ownerOf: { inputs: ["tokenId"] },
          name: { inputs: [] },
          symbol: { inputs: [] },
          tokenURI: { inputs: ["tokenId"] },
        },
        ERC721Supply: {
          totalSupply: { inputs: [] },
          
        },
        OtherFunctions: {
          getOwnedTokenIds: { inputs: ["owner"] },
          getAllOwners: { inputs: ["start", "count"] },
          tokenOfOwnerByIndex: { inputs: ["ownerAddress", "index"] },
        },
      };
      export const readFunctionsERC20Drop: ReadFunctions = {
        ERC20: {
          allowance: { inputs: ["Owner","Spender"] },
          balanceOf: { inputs: ["Owner"] },
          totalSupply: { inputs: [] },
          decimals: { inputs: [] },
          name: { inputs: [] },
          symbol: { inputs: [] },
        },
        ERC20SignatureMintable: {
          verify: { inputs: ["Req","Signature"] },
        },
        ERC20Permit: {
          DOMAIN_SEPARATOR: { inputs: [] },
          nonces: { inputs: ["owner"] },
      
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          CLOCK_MODE: { inputs: [] },
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          checkpoints: { inputs: ["Account","Pos"] },
          clock: { inputs: [] },
          vlaimCondition: { inputs: [] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          delegates: { inputs: ["Account"] },
          eip712Domain: { inputs: [] },
          getActiveClaimConditionId: { inputs: [] },
          getClaimConditionById: { inputs: ["conditionId"] },
          getPlatformFeeType: { inputs: [] },
          getFlatPlatformFeeInfo: { inputs: [] },
          getSupplyClaimedByWallet: { inputs: ["Account"] },
          getPastTotalSupply: { inputs: ["ConditionId","Claimer"] },
          getPastVotes: { inputs: ["Account","Timepoint"] },
          getVotes: { inputs: ["Account"] },
          hasRoleWithSwitch: { inputs: ["Role","Account"] },
          maxTotalSupply: { inputs: [] },
          numCheckpoints: { inputs: ["Account"] },
          verifyClaim: { inputs: ["ConditionId","Claimer","Quantity","Currency","pricePerToken","AllowlistProof"] },
      
        },
      };
      
      
    export const readFunctionsERC20Mint: ReadFunctions = {
        ERC20: {
          allowance: { inputs: ["Owner","Spender"] },
          balanceOf: { inputs: ["Owner"] },
          totalSupply: { inputs: [] },
          decimals: { inputs: [] },
          name: { inputs: [] },
          symbol: { inputs: [] },
        },
        ERC20SignatureMintable: {
          verify: { inputs: ["Req","Signature"] },
        },
        ERC20Permit: {
          DOMAIN_SEPARATOR: { inputs: [] },
          nonces: { inputs: ["owner"] },
      
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
        },
        PrimarySale: {
          primarySaleRecipient: { inputs: [] },
        },
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoleMemberCount: { inputs: ["Role"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          CLOCK_MODE: { inputs: [] },
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          checkpoints: { inputs: ["Account","Pos"] },
          clock: { inputs: [] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          delegates: { inputs: ["Account"] },
          eip712Domain: { inputs: [] },
          getPastTotalSupply: { inputs: ["TimePoint"] },
          getPastVotes: { inputs: ["Account","Timepoint"] },
          getVotes: { inputs: ["Account"] },
          numCheckpoints: { inputs: ["Account"] },
          supportsInterface: { inputs: ["InterfaceId"] },
        },
      };


      export const readFunctionsMarketplace: ReadFunctions = {
        Listing: {
          getAllListings: { inputs: ["startId","endId"] },
          getAllValidListings: { inputs: ["startId", "endId"] },
          getListing: { inputs: ["listingId"] },
          currencyPriceForListing: { inputs: ["listingId", "currency"] },
          isBuyerApprovedForListing: { inputs: ["listingId", "buyer"] },
          isCurrencyApprovedForListing: { inputs: ["listingId", "currency"] },
          totalListings: { inputs: [] },
          
        },
        Auction: {
          getAllAuctions: { inputs: ["startId","endId"] },
          getAllValidAuctions: { inputs: ["startId", "endId"] },
          getAuction: { inputs: ["auctionId"] },
          getWinningBid: { inputs: ["auctionId"] },
          isAuctionExpired: { inputs: ["auctionId", "buyer"] },
          isNewWinningBid: { inputs: ["auctionId", "Bid Amount"] },
          totalAuctions: { inputs: [] },        },
       
        Offers: {
          getAllOffers: { inputs: ["startId","endId"] },
          getAllValidOffers: { inputs: ["startId","endId"] },
          getOffer: { inputs: ["offerId"] },
          totalOffers: { inputs: [] },
      
        },
        PlatformFee: {
          getPlatformFeeInfo: { inputs: [] },
          getPlatformFeeType: { inputs: [] },
          getFlatPlatformFeeInfo: { inputs: [] },
        },
        
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          hasRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          getRoleMember: { inputs: ["Role", "Index"] },
          getRoyaltyEngineAddress: { inputs: ["Role"] },
          getRoleMemberCount: { inputs: ["Role","account"] },
          hasRoleWithSwitch: { inputs: ["Role","account"] },
        },
        ContractMetadata: {
          contractURI: { inputs: [] },
        },
        Gasless: {
          isTrustedForwarder: { inputs: ["Forwarder"] },
        },
        OtherFunctions: {
          DEFAULT_ADMIN_ROLE: { inputs: [] },
          checkpoints: { inputs: ["Account","Pos"] },
          clock: { inputs: [] },
          contractType: { inputs: [] },
          contractVersion: { inputs: [] },
          defaultExtensions: { inputs: [] },
          getAllExtensions: { inputs: [] },
          getExtension: { inputs: ["extensionName"] },
          getImplementationForFunction: { inputs: ["functionSelecter"] },
          getMetadataForFunction: { inputs: ["functionSelecter"] },
          
        },
      };


      export const functionMarketplace: ReadFunctions = {
        Listing: {
          buyFromListing: { inputs: ["listingId", "buyFor", "quantity", "currency", "expectedTotalPrice"] },
          cancelListing: { inputs: ["listingId"] },
          createListing: { inputs: ["assetContract: 0x..., tokenId: 0, quantity: 0, currency: 0x.., pricePerToken: 0, startTimestamp: 0, endTimestamp: 0, reserved: true "] },
          updateListing: { inputs: ["assetContract: 0x..., tokenId: 0, quantity: 0, currency: 0x.., pricePerToken: 0, startTimestamp: 0, endTimestamp: 0, reserved: true "] },
          approveBuyerForListing: { inputs: ["listingId", "buyFor"] },
          approveCurrencyForListing: { inputs: ["listingId", "currency", "price"] },
          
        },
        Auction: {
          bidInAuction: { inputs: ["auctionId","BidAmount"] },
          cancelAuction: { inputs: ["auctionId"] },
          createAuction: { inputs: [" assetContract: 0x..., tokenId: 0, quantity: 0, currency: 0x..., minimumBidAmount: 0, buyoutBidAmount: 0, timeBufferInSeconds: 0, bidBufferBps: 0, startTimestamp: 0, endTimestamp: 0"] },
          collectAuctionPayout: { inputs: ["auctionId"] },
          collectAuctionTokens: { inputs: ["auctionId"] },
        },
       
        Offers: {
          acceptOffer: { inputs: ["offerId"] },
          cancelOffer: { inputs: ["offerId"] },
          makeOffer: { inputs: ["assetContract: 0x..., tokenId: 0, quantity: 0, currency: 0x..., totalPrice: 0, expirationTimestamp: 0"] },
          
        },
        PlatformFee: {
          setFlatPlatformFeeInfo: { inputs: ["Reciep", "flatFee"] },
          setPlatformFeeInfo: { inputs: ["Reciep", "bps"] },
          setPlatformFeeType: { inputs: ["feeType"] },
        },
        
        Permissions: {
          getRoleAdmin: { inputs: ["Role"] },
          revokeRole: { inputs: ["Role", "Account"] },
          renounceRole: { inputs: ["Role", "Account"] },
          grantRole: { inputs: ["Role", "Account"] },
        },
        PermissionsEnumerable: {
          setRoyaltyEngine: { inputs: ["address"] },
          getRoyalty: { inputs: ["tokenAddress", "tokenId", "value"] },
          getRoleMemberCount: { inputs: ["Role","account"] },
          hasRoleWithSwitch: { inputs: ["Role","account"] },
        },
        ContractMetadata: {
          setContractURI: { inputs: ["uri"] },
        },
       
        OtherFunctions: {
          _disableFunctionInExtension: { inputs: ["extensionName","functionSelecter"] },
          addExtension: { inputs: ["turple"] },
          disableFunctionInExtension: { inputs: ["extensionName","functionSelecter"] },
          enableFunctionInExtension: { inputs: ["extensionName","turple"] },
          multicall: { inputs: ["data"] },
          removeExtension: { inputs: ["extensionName"] },
          replaceExtension: { inputs: ["turple"] },
         
        },
      };