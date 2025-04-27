import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useContractEvents } from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { transferEvent } from "thirdweb/extensions/erc20";
import {
  ADDRESS_ZERO,
  defineChain,
  getContract,
  NATIVE_TOKEN_ADDRESS,
  toTokens,
} from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { Token } from "@/constants/types";
import TransactionModal from "../transaction/transaction";
import { useCurrency } from "@/constants/currency";
import { useModal } from "@/constants/transactionModalProvider";
import EventCard from "./eventCard";

interface FetchContractDataProps {
  chainId: number;
  WETH9: string;
  tokenA: Token;
  tokenB: Token;
}

const ContractEvents: React.FC<FetchContractDataProps> = ({
  chainId,
  tokenA,
  WETH9,
  tokenB,
}) => {
  /* ------------------------------------------------------------------
   * State
   * ----------------------------------------------------------------*/
  const [selectedToken, setSelectedToken] = useState<Token>(tokenB);
  const { openModal } = useModal();
  const [selectedTransactionHash, setSelectedTransactionHash] =
    useState<string | null>(null);

  /* 
    Pull chainId, WETH9 from your currency or config.
    If the user is on chain X, we might defineChain(chainId).
  */

  /* ------------------------------------------------------------------
   * Query contract events for the selectedToken
   * ----------------------------------------------------------------*/
  const contract = useMemo(() => {
    const address =
      tokenB.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS
        ? WETH9
        : tokenB.contractAddress;
    return getContract({
      client,
      chain: defineChain(chainId),
      address,
    });
  }, [tokenB, chainId, WETH9]);

  const eventsQuery = useContractEvents({
    contract,
    events: [transferEvent()],
    blockRange: 10,
  });

  /* ------------------------------------------------------------------
   * Handlers
   * ----------------------------------------------------------------*/
  // Toggle between tokenA and tokenB
  const toggleToken = () => {
    setSelectedToken((prev) => (prev === tokenA ? tokenB : tokenA));
  };



  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/
  return (
    <ThemedView >
        {!selectedTransactionHash && (

      <ThemedView style={styles.contractEventsCard}>
        <View style={styles.eventsHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contract Events
          </ThemedText>
        </View>

        {/* Live Transfer Events */}
        <View style={styles.eventsBody}>
          <ThemedText style={styles.eventsTitle}>
            Live {tokenB.symbol} transfers
          </ThemedText>

          {eventsQuery.isLoading && (
            <ActivityIndicator style={{ marginTop: 8 }} color="#00C4B4" />
          )}

          {eventsQuery.data?.length === 0 && !eventsQuery.isLoading && (
            <ThemedText style={styles.noEventsText}>
              No recent transfers found.
            </ThemedText>
          )}

          {eventsQuery.data
            ?.slice(-10)
            ?.reverse()
            ?.map((event, i) => {
              const from = shortenAddress(event.args.from);
              const to = shortenAddress(event.args.to);
              const value = toTokens(event.args.value, selectedToken.decimals);
              const shortTxHash = `Tx: ${event.transactionHash.slice(0, 6)}...${event.transactionHash.slice(-6)}`;

              return (
               <EventCard
                       from={from}
                       to={to}
                       value={value}
                       tokenSymbol={selectedToken.symbol}
                       transactionHash={shortTxHash}
                       fullTransactionHash={event.transactionHash}
                       chainId={chainId}
                       onPress={() =>
                         openModal({ type: "transaction", transactionHash: event.transactionHash, from, to, chainId })
                       }
                     />
              );
            })}
        </View>
      </ThemedView>
      )}
      
    </ThemedView>
  );
};

export default ContractEvents;

/* ------------------------------------------------------------------
 * Styles
 * ----------------------------------------------------------------*/
const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 8,
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  /* Swap Details Card */
  swapDetailsCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#fff",
  },
  swapSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  tokenSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenImage: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  tokenAmount: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  tokenPrice: {
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 2,
  },
  swapArrow: {
    fontSize: 18,
    color: "#00C4B4",
    fontWeight: "bold",
  },
  swapValue: {
    marginTop: 12,
    fontSize: 14,
    color: "#00C4B4",
    fontWeight: "600",
  },

  /* Contract Events Card */
  contractEventsCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  eventsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleButton: {
    backgroundColor: "#3A3A3A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#555",
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  eventsBody: {
    marginTop: 10,
  },
  eventsTitle: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 8,
  },
  noEventsText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  eventRow: {
    backgroundColor: "#3A3A3A",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#555",
    marginVertical: 4,
  },
  eventText: {
    fontSize: 14,
    color: "#FFF",
  },
  transactionHash: {
    fontSize: 12,
    color: "#00C4B4",
    marginTop: 4,
  },
});
