import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Clipboard } from "react-native";
import { ThemedText } from "@/components/ThemedText";

const { width, height } = Dimensions.get("window");

interface DecodedParam {
  name: string;
  type: string;
  value: string | string[] | DecodedFunctionCall | DecodedFunctionCall[];
}

interface DecodedFunctionCall {
  functionName: string;
  params: DecodedParam[];
  extraDecoded?: DecodedFunctionCall | null;
}

interface DecodedLog {
  eventName: string;
  params: DecodedParam[];
  address: string;
}

interface TransactionDetails {
  transactionHash: string;
  status: string;
  value: string;
  blockHeight: string;
  timestamp: string;
  from: string;
  to: string;
  gasFee: string;
  gasLimit: string;
  gasPrice: string;
  maxGas: string;
  maxGas2: string;
  nonce: number;
  input: string;
  decodedInput: DecodedFunctionCall | null;
  logs: DecodedLog[];
}

interface ExpandedData {
  name: string;
  value: DecodedLog | DecodedParam | string[] | string;
}

interface TransactionModalProps {
  transactionHash: string;
  from: string;
  to?: string;
  chainId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface RenderParamProps {
  param: DecodedParam;
  level?: number;
}

const shortenString = (str: string, front = 10, back = 10) => {
  if (!str) return "";
  return `${str.slice(0, front)}...${str.slice(-back)}`;
};

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  chainId,
  transactionHash,
  from,
  to,
}) => {
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [decodedTransaction, setDecodedTransaction] = useState<DecodedFunctionCall | null>(null);
  const [expandedData, setExpandedData] = useState<ExpandedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatValue = (value: string | string[] | { [key: string]: any } | { type: string; hex: string } | null | undefined, isValueField: boolean = false): string => {
    if (value === null || value === undefined) return "N/A";
  
    if (Array.isArray(value)) {
      return value.map((item) => formatValue(item)).join(", ");
    }
  
    if (typeof value === "object" && value !== null && "_hex" in value) {
      return BigInt(value._hex).toString();
    }
  
    if (typeof value === "object" && value !== null && "type" in value && value.type === "BigNumber" && "hex" in value) {
      return BigInt(value.hex).toString();
    }
  
    if (typeof value === "string" && value.startsWith("0x") && value.length >= 20) {
      return shortenString(value, 10, 10);
    }
  
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
  
    // Handle the transaction value (format: "<amount> <symbol>")
    if (isValueField && typeof value === "string") {
      try {
        // Split the string into amount and symbol (e.g., "12312391381203809283 iotx" -> ["12312391381203809283", "iotx"])
        const [amountStr, symbol] = value.split(" ");
        if (!amountStr || !symbol) {
          throw new Error("Invalid format: Expected '<amount> <symbol>'");
        }
  
        // Convert the amount to a human-readable number
        const amountBigInt = BigInt(amountStr);
        const formattedAmount = Number(amountBigInt) / 1e18; // Divide by 10^18
        const formattedValue = formattedAmount.toFixed(6).replace(/\.?0+$/, ""); // Format to 6 decimals, remove trailing zeros
  
        // Return the formatted amount with the symbol
        return `${formattedValue} ${symbol}`;
      } catch (err) {
        console.error("Error formatting value:", err);
        return value; // Fallback to raw value if conversion fails
      }
    }
  
    return value.toString();
  };

  const fetchTransactionData = async () => {
    if (!transactionHash) {
      setError("Please enter a transaction hash.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formattedHash = transactionHash.startsWith("0x") ? transactionHash : `0x${transactionHash}`;
      const url = `https://www.ioplasmaverse.com/api/getTransaction?transactionHash=${formattedHash}&chainId=${chainId}`;
      console.log("url", url);
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transaction");
      }

      const { transaction } = data;
      if (!transaction) {
        throw new Error("Transaction data not found in API response");
      }

      console.log("transactionData", transaction);
      console.log("transactionData", transaction.decodedInput);
      setDecodedTransaction(transaction.decodedInput || null);
      setTransactionDetails(transaction);
    } catch (err) {
      console.error("❌ Error fetching transaction details:", err);
      setError("Failed to fetch transaction details. Check the hash and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && transactionHash) {
      fetchTransactionData();
    }
  }, [isOpen, transactionHash]);

  const RenderParam: React.FC<RenderParamProps> = ({ param, level = 0 }) => {
    const indentStyle = { marginLeft: level * 20 };

    if (param.name.toLowerCase().includes("calldata") || param.name.toLowerCase().includes("replacementpattern")) {
      return (
        <View style={[styles.paramRow, indentStyle]}>
          <ThemedText style={styles.label}>{param.name}:</ThemedText>
          <View style={styles.calldataContainer}>
            <ThemedText style={styles.value}>
              {param.value.toString().slice(0, 10)}...{param.value.toString().slice(-10)}
            </ThemedText>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => Clipboard.setString(param.value as string)}
            >
              <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (param.type === "bytes[]" && Array.isArray(param.value)) {
      return (
        <View style={[styles.paramRow, indentStyle]}>
          <ThemedText style={styles.label}>{param.name} ({param.type}):</ThemedText>
          <View style={styles.nestedContainer}>
            {(param.value as DecodedFunctionCall[]).map((nestedCall, index) => (
              <View key={index} style={styles.nestedCall}>
                <ThemedText style={styles.functionName}>
                  Call {index + 1}: {nestedCall.functionName}
                </ThemedText>
                {nestedCall.params.map((nestedParam, nestedIndex) => (
                  <RenderParam
                    key={nestedIndex}
                    param={nestedParam}
                    level={level + 1}
                  />
                ))}
                {nestedCall.extraDecoded && (
                  <View style={styles.nestedCall}>
                    <ThemedText style={styles.label}>Extra Data:</ThemedText>
                    <RenderParam
                      param={{
                        name: "extraData",
                        type: "nested",
                        value: nestedCall.extraDecoded,
                      }}
                      level={level + 1}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (typeof param.value === "object" && param.value !== null && "functionName" in param.value) {
      const nestedFunctionCall = param.value as DecodedFunctionCall;
      return (
        <View style={[styles.paramRow, indentStyle]}>
          <ThemedText style={styles.label}>{param.name}:</ThemedText>
          <View style={styles.nestedContainer}>
            <ThemedText style={styles.functionName}>{nestedFunctionCall.functionName}</ThemedText>
            {nestedFunctionCall.params.map((nestedParam, index) => (
              <RenderParam
                key={index}
                param={nestedParam}
                level={level + 1}
              />
            ))}
          </View>
        </View>
      );
    }

    if (Array.isArray(param.value)) {
      return (
        <View style={[styles.paramRow, indentStyle]}>
          <ThemedText style={styles.label}>
            {param.name} ({param.type}):
          </ThemedText>
          <ThemedText style={styles.value}>
            {(param.value as string[]).join(", ")}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={[styles.paramRow, indentStyle]}>
        <ThemedText style={styles.label}>
          {param.name} ({param.type}):
        </ThemedText>
        <ThemedText style={styles.value}>{formatValue(param.value)}</ThemedText>
      </View>
    );
  };

  const renderDecodedInput = () => {
    if (!decodedTransaction?.functionName) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Function Call</ThemedText>
        <View>
        <ThemedText style={styles.functionName}>{decodedTransaction.functionName}</ThemedText>
        </View>
        {decodedTransaction.params?.length > 0 && (
          <View>
            {decodedTransaction.params.map((param: DecodedParam, index: number) => (
              <RenderParam key={index} param={param} level={0} />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTransactionDetails = () => {
    if (!transactionDetails) return null;

    const details = [
      { label: "Transaction Hash", value: transactionDetails.transactionHash },
      { label: "Block Height", value: transactionDetails.blockHeight },
      { label: "Timestamp", value: transactionDetails.timestamp },
      { label: "From", value: from },
      { label: "To", value: to || "N/A" },
      { label: "Value", value: transactionDetails.value || "0" },
      { label: "Gas Fee", value: transactionDetails.gasFee },
      { label: "Max Fee", value: transactionDetails.maxGas },
      { label: "Max Fee 2", value: transactionDetails.maxGas2 },
      { label: "Gas Limit", value: transactionDetails.gasLimit },
      { label: "Gas Price", value: transactionDetails.gasPrice },
      { label: "Nonce", value: transactionDetails.nonce },
      { label: "Chain ID", value: chainId.toString() },
    ];

    const filteredDetails = details.filter(
      (item) =>
        !(
          (item.label === "Max Fee" || item.label === "Max Fee 2") &&
          item.value === "N/A"
        )
    );

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Transaction Details</ThemedText>
        {filteredDetails.map((item, index) => (
          <View key={index} style={styles.row}>
            <ThemedText style={styles.label}>{item.label}:</ThemedText>
            <View style={styles.valueContainer}>
            <ThemedText style={styles.value}>
            {formatValue(item.value.toString(), true)} 
          </ThemedText>
              {typeof item.value === "string" && item.value.startsWith("0x") && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => Clipboard.setString(item.value.toString())}
                >
                  <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLogs = () => {
    if (!transactionDetails?.logs || transactionDetails.logs.length === 0) return null;

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Logs</ThemedText>
        {transactionDetails.logs.map((item: DecodedLog, index: number) => (
          <View key={index} style={styles.logRow}>
            <ThemedText style={styles.label}>{item.eventName}</ThemedText>
            <View style={styles.logDetails}>
              <View style={styles.valueContainer}>
                <ThemedText style={styles.value}>{shortenString(item.address, 6, 6)}</ThemedText>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => Clipboard.setString(item.address)}
                >
                  <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => setExpandedData({ name: `Log: ${item.eventName}`, value: item })}
              >
                <ThemedText style={styles.buttonText}>View</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C4B4" />
                <ThemedText style={styles.loadingText}>Loading transaction details...</ThemedText>
              </View>
            ) : error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : transactionDetails ? (
              <>
                {renderTransactionDetails()}
                {renderDecodedInput()}
                {renderLogs()}
              </>
            ) : (
              <ThemedText style={styles.noDataText}>No transaction details available.</ThemedText>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>

        <Modal
          visible={!!expandedData}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setExpandedData(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {expandedData && (
                  <>
                    <ThemedText style={styles.sectionTitle}>{expandedData.name}</ThemedText>
                    {Array.isArray(expandedData.value) ? (
                      (expandedData.value as string[]).map((item, index) => (
                        <View key={index} style={styles.row}>
                          <ThemedText style={styles.label}>Param {index}:</ThemedText>
                          <ThemedText style={styles.value}>{formatValue(item)}</ThemedText>
                        </View>
                      ))
                    ) : typeof expandedData.value === "object" && expandedData.value !== null ? (
                      "eventName" in expandedData.value ? (
                        (expandedData.value as DecodedLog).params.map((param, index) => (
                          <RenderParam key={index} param={param} level={0} />
                        ))
                      ) : "name" in expandedData.value ? (
                        <RenderParam param={expandedData.value as DecodedParam} level={0} />
                      ) : (
                        <ThemedText style={styles.value}>{formatValue(expandedData.value)}</ThemedText>
                      )
                    ) : (
                      <ThemedText style={styles.value}>{formatValue(expandedData.value)}</ThemedText>
                    )}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setExpandedData(null)}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    width: width,
    height: height,
    padding: 20,
  },
  nestedContainer: {
    marginLeft: 10,
    marginTop: 5,
  },
  nestedCall: {
    marginBottom: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
    paddingLeft: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00C4B4",
    flex: 1,
  },
  valueContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  value: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "left",
  },
  functionName: {
    fontSize: 18,
    paddingHorizontal: 12,

    fontWeight: "600",
    color: "#00C4B4",
    marginBottom: 10,
  },
  paramRow: {
    
    
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  calldataContainer: {
    alignItems: "flex-start",
    flexDirection: "row",

  },
  logRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  logDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#00C4B4",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#00C4B4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00C4B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
  copyButton: {
    backgroundColor: "#333",
    padding: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  copyButtonText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#555",
    padding: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default TransactionModal;