import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { defineChain, getRpcClient, ThirdwebClient } from "thirdweb";
import { eth_getBalance } from "thirdweb/rpc"; // Correct import for eth_getBalance
import { Token } from "@/constants/types";

interface BalanceCardProps {
  token: Token;
  address: string;
  client: ThirdwebClient;
  chainId: number;
}

export function BalanceCardNative({ token, address, client, chainId }: BalanceCardProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance when component mounts or props change
  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rpcRequest = getRpcClient({ client, chain: defineChain(chainId) });
        const balanceWei = await eth_getBalance(rpcRequest, { address });
        // Convert Wei to Ether (assuming token is ETH-based; adjust for other tokens)
        const balanceEther = (Number(balanceWei) / 1e18).toFixed(4);
        setBalance(balanceEther);
      } catch (err) {
        setError("Failed to fetch balance");
        console.error(err);
        setBalance("-");
      } finally {
        setIsLoading(false);
      }
    };

    if (address && client && chainId) {
      fetchBalance();
    }
  }, [address, client, chainId]);

  return (
    <ThemedView style={styles.card}>
      <View style={styles.contentContainer}>
        
        <View style={styles.tableContainer}>
          <ThemedText type="defaultSemiBold" style={styles.tokenName}>
            {token.name}
          </ThemedText>
          <ThemedText type="default" style={styles.balanceText}>
            {isLoading ? "Loading..." : balance || "-"} {token.symbol || ""}
          </ThemedText>
          {error && (
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#fff", // Assuming light theme; adjust for dark mode if needed
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  tableContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  tokenName: {
    fontSize: 18,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "red",
    marginTop: 4,
  },
});