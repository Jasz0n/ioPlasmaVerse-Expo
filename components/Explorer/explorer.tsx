"use client";

import React, { FC, useState, ChangeEvent, useCallback, useEffect } from "react";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import {
  ADDRESS_ZERO,
  defineChain,
  getContract,
  prepareContractCall,
  PreparedTransaction,
  readContract,
  resolveMethod,
  ThirdwebContract,
} from "thirdweb";
import { BigNumber } from "ethers";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import {
  claimTo,
  getOwnedTokenIds,
  getAllOwners,
  tokenOfOwnerByIndex,
  ownerOf,
  tokenURI,
} from "thirdweb/extensions/erc721";
import { tokenUri } from "thirdweb/extensions/erc1155";
import { client } from "@/constants/thirdweb";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a ThemedText component
import {
  functionDefinitionsDefault,
  functionDefinitionsErc1155NFTCollection,
  functionDefinitionsErc1155NFTDrop,
  functionDefinitionsErc20TokenDrop,
  functionDefinitionsErc20TokenMint,
  functionDefinitionsERC721Drop,
  functionDefinitionsErc721NFTCollection,
  functionDefinitionsErc721OpenEdition,
  functionDefinitioPredicion,
  functionMarketplace,
  readFunctionsDefault,
  readFunctionsERC1155NFTCollection,
  readFunctionsERC1155NFTDrop,
  readFunctionsERC20Drop,
  readFunctionsERC20Mint,
  readFunctionsERC721NFTCollection,
  readFunctionsERC721NFTDropp,
  readFunctionsERC721OpenEdition,
  readFunctionsMarketplace,
  readFunctionsPrediction,
} from "./functionList";

interface Attribute {
  trait_type: string;
  value: string | number;
}

type FunctionDefinition = {
  inputs: string[];
};

interface ReadFunction {
  inputs: string[];
}

interface ReadFunctions {
  [key: string]: {
    [key: string]: ReadFunction;
  };
}

interface WriteFunctions {
  [category: string]: {
    [functionName: string]: FunctionDefinition;
  };
}

// Custom JSON stringify function to handle BigInt values
const stringifyWithBigInt = (obj: any) => {
  return JSON.stringify(
    obj,
    (key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
};

export const Explorer: FC<{
  contractAddress: string;
  chainId: number;
  type: string;
  abi?: any;
}> = ({ contractAddress, chainId, type, abi }) => {
  const account = useActiveAccount();
  const NETWORK = defineChain(chainId);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [showBaseFile, setShowBaseFile] = useState<boolean>(true);
  const [functionType, setFunctionType] = useState<"read" | "write">("write");
  const [readFunction, setReadFunction] = useState<ReadFunctions | null>(null);
  const [writeFunction, setWriteFunction] = useState<
    Record<string, Record<string, FunctionDefinition>> | null
  >(null);
  const [inputFocused, setInputFocused] = useState<{ [key: string]: boolean }>({}); // Track focused inputs

  const contract: ThirdwebContract = getContract({
    address: contractAddress,
    client,
    chain: NETWORK,
  });

  const handleFunctionChange = (fn: string) => {
    const [contractName, methodName] = fn.split(".");

    const newInputs: { [key: string]: string } = {};

    if (readFunction?.[contractName]?.[methodName]?.inputs) {
      readFunction[contractName][methodName].inputs.forEach((input: string) => {
        newInputs[input] = "";
      });
    }

    setFunctionInputs(newInputs);
    setTransactionError(null);
    setOutput(null);
    setSelectedFunction(fn);
  };

  const handleInputChange = (name: string, value: string) => {
    setFunctionInputs({ ...functionInputs, [name]: value });
  };

  useEffect(() => {
    if (!abi || abi.length === 0) {
      handleSelectFunctions();
      return;
    }

    const read: ReadFunctions = { OtherFunctions: {} };
    const write: WriteFunctions = { OtherFunctions: {} };

    abi.forEach((item: any) => {
      if (item.type === "function") {
        const functionDef: FunctionDefinition = {
          inputs: (item.inputs || []).map((input: any) => input.name || input.type),
        };

        if (item.stateMutability === "view" || item.stateMutability === "pure") {
          read.OtherFunctions[item.name] = functionDef;
        } else if (
          item.stateMutability === "nonpayable" ||
          item.stateMutability === "payable"
        ) {
          write.OtherFunctions[item.name] = functionDef;
        }
      }
    });

    setReadFunction(read);
    setWriteFunction(write);
  }, [abi]);

  const handleSelectFunctions = useCallback(() => {
    try {
      switch (type) {
        case "DropERC721":
          setReadFunction(readFunctionsERC721NFTDropp);
          setWriteFunction(functionDefinitionsERC721Drop);
          break;
        case "TokenERC721":
          setReadFunction(readFunctionsERC721NFTCollection);
          setWriteFunction(functionDefinitionsErc721NFTCollection);
          break;
        case "OpenEditionERC721":
          setReadFunction(readFunctionsERC721OpenEdition);
          setWriteFunction(functionDefinitionsErc721OpenEdition);
          break;
        case "DropERC1155":
          setReadFunction(readFunctionsERC1155NFTDrop);
          setWriteFunction(functionDefinitionsErc1155NFTDrop);
          break;
        case "TokenERC1155":
          setReadFunction(readFunctionsERC1155NFTCollection);
          setWriteFunction(functionDefinitionsErc1155NFTCollection);
          break;
        case "TokenERC20":
          setReadFunction(readFunctionsERC20Mint);
          setWriteFunction(functionDefinitionsErc20TokenMint);
          break;
        case "DropERC20":
          setReadFunction(readFunctionsERC20Drop);
          setWriteFunction(functionDefinitionsErc20TokenDrop);
          break;
        case "marketplace":
          setReadFunction(readFunctionsMarketplace);
          setWriteFunction(functionMarketplace);
          break;
        case "DefaultNFT":
          setReadFunction(readFunctionsDefault);
          setWriteFunction(functionDefinitionsDefault);
          break;
        case "prediction":
          setReadFunction(readFunctionsPrediction);
          setWriteFunction(functionDefinitioPredicion);
          break;
        default:
          throw new Error("Unsupported contract type");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setTransactionError(error.message);
      } else {
        setTransactionError(String(error));
      }
    }
  }, [type]);

  useEffect(() => {
    handleSelectFunctions();
  }, [handleSelectFunctions]);

  const handleRunFunctionCustom = async () => {
    try {
      let result;
      switch (selectedFunction) {
        case "OtherFunctions.getOwnedTokenIds":
          result = await getOwnedTokenIds({
            contract,
            owner: functionInputs.owner,
          });
          break;
        case "ERC721.ownerOf":
          result = await ownerOf({
            contract,
            tokenId: BigInt(functionInputs.tokenId),
          });
          break;
        case "ERC721.tokenURI":
          result = await tokenURI({
            contract,
            tokenId: BigInt(functionInputs.tokenURI),
          });
          break;
        case "ERC1155.uri":
          result = await tokenUri({
            contract,
            tokenId: BigInt(functionInputs.uri),
          });
          break;
        case "OtherFunctions.getAllOwners":
          result = await getAllOwners({
            contract,
            start: Number(functionInputs.start),
            count: Number(functionInputs.count),
          });
          break;
        case "OtherFunctions.tokenOfOwnerByIndex":
          result = await tokenOfOwnerByIndex({
            contract,
            owner: functionInputs.ownerAddress,
            index: BigInt(functionInputs.index),
          });
          break;
        default:
          throw new Error("Function not supported");
      }
      setOutput(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setTransactionError(error.message);
      } else {
        setTransactionError(String(error));
      }
    }
  };

  const handleRunFunction = useCallback(async () => {
    if (!selectedFunction) return;

    try {
      let result;
      switch (selectedFunction) {
        case "getOwnedTokenIds":
          result = await getOwnedTokenIds({
            contract,
            owner: functionInputs.owner,
          });
          break;
        case "getAllOwners":
          result = await getAllOwners({
            contract,
            start: Number(functionInputs.start),
            count: Number(functionInputs.count),
          });
          break;
        case "tokenOfOwnerByIndex":
          result = await tokenOfOwnerByIndex({
            contract,
            owner: functionInputs.ownerAddress,
            index: BigInt(functionInputs.index),
          });
          break;
        default:
          const [extension, fnName] = selectedFunction.split(".");
          if (readFunction && readFunction[extension] && readFunction[extension][fnName]) {
            const { inputs } = readFunction[extension][fnName];
            const params = inputs.map((input: string) => functionInputs[input]);
            result = await readContract({
              contract,
              method: resolveMethod(fnName),
              params,
            });
          } else {
            throw new Error("Function not found");
          }
          break;
      }
      setOutput(processOutput(result));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedFunction, functionInputs, contract, readFunction]);

  const processOutput = (output: any) => {
    if (typeof output === "bigint") {
      return output.toString();
    } else if (output instanceof BigNumber) {
      return output.toString();
    } else if (Array.isArray(output)) {
      return output.map((item) =>
        typeof item === "bigint" || item instanceof BigNumber ? item.toString() : item
      );
    } else if (typeof output === "object" && output !== null) {
      const processed: { [key: string]: any } = {};
      for (const key in output) {
        processed[key] =
          typeof output[key] === "bigint" || output[key] instanceof BigNumber
            ? output[key].toString()
            : output[key];
      }
      return processed;
    } else {
      return output;
    }
  };

  const prepareTransaction = async (): Promise<PreparedTransaction<any>> => {
    if (!selectedFunction || !account) throw new Error("Account or function not selected");

    const [contractName, methodName] = selectedFunction.split(".");
    if (writeFunction && writeFunction[contractName] && writeFunction[contractName][methodName]) {
      const functionDefinition = writeFunction[contractName][methodName];
      const { inputs } = functionDefinition;

      const params = inputs.map((input: string) => {
        if (!functionInputs[input]) throw new Error(`Missing input: ${input}`);
        return input === "tokenId"
          ? BigNumber.from(functionInputs[input])
          : functionInputs[input];
      });

      const resolvedMethod = await resolveMethod(methodName);
      const transaction = await prepareContractCall({
        contract,
        method: resolvedMethod,
        params,
      });

      return transaction;
    } else {
      throw new Error("Unsupported function");
    }
  };

  const handleTransactionSent = () => {
    console.log("Transaction sent");
  };

  const handleTransactionConfirmed = () => {
    console.log("Transaction confirmed");
  };

  const handleTransactionError = (error: Error) => {
    console.error(error);
    setTransactionError(error.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left Panel */}
        <View style={styles.leftPanel}>
          <View style={styles.tabButtons}>
            <TouchableOpacity
              onPress={() => setFunctionType("write")}
              style={[
                styles.tabButton,
                functionType === "write" && styles.tabButtonActive,
              ]}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.tabButtonText,
                  functionType === "write" && styles.tabButtonTextActive,
                ]}
              >
                ✏️
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFunctionType("read")}
              style={[
                styles.tabButton,
                functionType === "read" && styles.tabButtonActive,
              ]}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.tabButtonText,
                  functionType === "read" && styles.tabButtonTextActive,
                ]}
              >
                👁️
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.functionList}>
            {functionType === "read" && readFunction && (
              <View>
                <ThemedText style={styles.sectionTitle}>Function Explorer - Read</ThemedText>
                {Object.keys(readFunction).map((extension) => (
                  <View key={extension} style={styles.functionGroup}>
                    <ThemedText style={styles.groupTitle}>{extension}</ThemedText>
                    {Object.keys(readFunction[extension]).map((fn) => (
                      <TouchableOpacity
                        key={fn}
                        style={styles.functionButton}
                        onPress={() => handleFunctionChange(`${extension}.${fn}`)}
                        activeOpacity={0.8}
                      >
                        <ThemedText style={styles.functionButtonText}>{fn}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {functionType === "write" && writeFunction && (
              <View>
                <ThemedText style={styles.sectionTitle}>Function Explorer - Write</ThemedText>
                {Object.keys(writeFunction).map((contractName) => (
                  <View key={contractName} style={styles.functionGroup}>
                    <ThemedText style={styles.groupTitle}>{contractName}</ThemedText>
                    {Object.keys(writeFunction[contractName]).map((fn) => (
                      <TouchableOpacity
                        key={fn}
                        style={styles.functionButton}
                        onPress={() => handleFunctionChange(`${contractName}.${fn}`)}
                        activeOpacity={0.8}
                      >
                        <ThemedText style={styles.functionButtonText}>{fn}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right Panel */}
        <View style={styles.rightPanel}>
          {selectedFunction ? (
            <View style={styles.rightPanelContent}>
              <ThemedText style={styles.selectedFunctionTitle}>{selectedFunction}</ThemedText>
              <ScrollView style={styles.inputContainer}>
                {functionType === "read" &&
                selectedFunction.split(".").length === 2 &&
                readFunction?.[selectedFunction.split(".")[0]]?.[
                  selectedFunction.split(".")[1]
                ]?.inputs ? (
                  readFunction[selectedFunction.split(".")[0]]?.[
                    selectedFunction.split(".")[1]
                  ]?.inputs.map((input, index) => (
                    <TextInput
                      key={index}
                      style={[
                        styles.input,
                        inputFocused[input] && styles.inputFocused,
                      ]}
                      placeholder={input}
                      placeholderTextColor="#A0A0A0"
                      onChangeText={(value) => handleInputChange(input, value)}
                      value={functionInputs[input]}
                      onFocus={() => setInputFocused({ ...inputFocused, [input]: true })}
                      onBlur={() => setInputFocused({ ...inputFocused, [input]: false })}
                    />
                  ))
                ) : (
                  functionType === "write" &&
                  selectedFunction.split(".").length === 2 &&
                  writeFunction?.[selectedFunction.split(".")[0]]?.[
                    selectedFunction.split(".")[1]
                  ]?.inputs?.map((input, index) => (
                    <TextInput
                      key={index}
                      style={[
                        styles.input,
                        inputFocused[input] && styles.inputFocused,
                      ]}
                      placeholder={input}
                      placeholderTextColor="#A0A0A0"
                      onChangeText={(value) => handleInputChange(input, value)}
                      value={functionInputs[input]}
                      onFocus={() => setInputFocused({ ...inputFocused, [input]: true })}
                      onBlur={() => setInputFocused({ ...inputFocused, [input]: false })}
                    />
                  ))
                )}

                {/* Transaction Buttons */}
                {functionType === "write" && selectedFunction === "ERC721ClaimPhasesV2.claimTo" ? (
                  <TransactionButton
                    transaction={() =>
                      claimTo({
                        contract,
                        to: functionInputs.toAddress || ADDRESS_ZERO,
                        quantity: BigInt(functionInputs.quantity),
                      })
                    }
                    onTransactionConfirmed={() => {
                      Alert.alert("Success", "NFT Claimed!");
                      setFunctionInputs({});
                    }}
                    style={styles.transactionButton}
                  >
                    <ThemedText style={styles.buttonText}>Claim NFT</ThemedText>
                  </TransactionButton>
                ) : functionType === "write" ? (
                  <TransactionButton
                    transaction={prepareTransaction}
                    onTransactionSent={handleTransactionSent}
                    onTransactionConfirmed={handleTransactionConfirmed}
                    onError={handleTransactionError}
                    style={styles.transactionButton}
                  >
                    <ThemedText style={styles.buttonText}>Run</ThemedText>
                  </TransactionButton>
                ) : (
                  <View>
                    {[
                      "OtherFunctions.getOwnedTokenIds",
                      "OtherFunctions.getAllOwners",
                      "OtherFunctions.tokenOfOwnerByIndex",
                    ].includes(selectedFunction) ? (
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleRunFunctionCustom}
                        activeOpacity={0.8}
                      >
                        <ThemedText style={styles.buttonText}>Run</ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleRunFunction}
                        activeOpacity={0.8}
                      >
                        <ThemedText style={styles.buttonText}>Run</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Output */}
                {output && (
                  <View style={styles.outputContainer}>
                    <ThemedText style={styles.outputText}>
                      {stringifyWithBigInt(output)}
                    </ThemedText>
                  </View>
                )}

                {/* Error */}
                {transactionError && (
                  <ThemedText style={styles.errorText}>{transactionError}</ThemedText>
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyRightPanel}>
              <ThemedText style={styles.emptyText}>
                Select a function to interact with the contract
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Dark background to match your theme
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 1,
    backgroundColor: "#2A2A2A", // Slightly lighter background for contrast
    borderRightWidth: 1,
    borderRightColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rightPanel: {
    flex: 2,
    padding: 16,
  },
  rightPanelContent: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyRightPanel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
  },
  tabButtons: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  tabButtonActive: {
    backgroundColor: "#28a745", // Match your primary action color
    borderColor: "#28a745",
  },
  tabButtonText: {
    fontSize: 20, // Larger for emoji icons
    color: "#A0A0A0",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  functionList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    padding: 16,
  },
  functionGroup: {
    padding: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 12,
  },
  functionButton: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  functionButtonText: {
    fontSize: 16,
    color: "#f5f5f5",
  },
  selectedFunctionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#333",
    color: "#f5f5f5",
    fontSize: 16,
  },
  inputFocused: {
    borderColor: "#28a745", // Highlight focused input
  },
  button: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  transactionButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  outputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  outputText: {
    fontSize: 14,
    color: "#f5f5f5",
    fontFamily: "monospace",
  },
  errorText: {
    fontSize: 14,
    color: "#ff5555", // Red for errors
    marginTop: 16,
  },
});