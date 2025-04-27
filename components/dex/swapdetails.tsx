import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { Token } from "@/constants/types";


interface FetchContractDataProps {
  amountIn: string;
  amountOut: string;
  tokenA: Token;
  tokenB: Token;
}

const SwapDetails2: React.FC<FetchContractDataProps> = ({
  amountIn,
  amountOut,
  tokenA,
  tokenB,
}) => {
 
  /* ------------------------------------------------------------------
   * Derive any extra data (e.g., approximate USD values)
   * ----------------------------------------------------------------*/
  const tokenAPrice = tokenA.price ? parseFloat(tokenA.price) : 0;
  const tokenBPrice = tokenB.price ? parseFloat(tokenB.price) : 0;

  // Approx value in USD
  const swapValueInUsdA = tokenAPrice * parseFloat(amountIn || "0");
  const swapValueInUsdB = tokenBPrice * parseFloat(amountOut || "0");

  // You can choose which one to display or show both
  // For example, if tokenB is the "buy" token, you might display the approximate cost in USD
  const approximateValue = swapValueInUsdB || swapValueInUsdA;

  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/
  return (
    <ThemedView style={styles.container}>
      {/* Top Section: Swap Details */}

      <ThemedView style={styles.swapDetailsCard}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Swap Details
        </ThemedText>

        {/* Swap Summary Row */}
        <View style={styles.swapSummaryRow}>
          {/* Token A */}
          <View style={styles.tokenSection}>
            {tokenA.image && typeof tokenA.image === "string" && (
              <Image
                source={{ uri: tokenA.image }}
                style={styles.tokenImage}
                resizeMode="contain"
              />
            )}
            <View>
              <ThemedText style={styles.tokenAmount}>
                {amountIn} {tokenA.symbol}
              </ThemedText>
              {/* If you want to show the price, you can do so here */}
              {!!tokenA.price && (
                <ThemedText style={styles.tokenPrice}>
                  1 {tokenA.symbol} = ${parseFloat(tokenA.price).toFixed(2)}
                </ThemedText>
              )}
            </View>
          </View>

          <ThemedText style={styles.swapArrow}>→</ThemedText>

          {/* Token B */}
          <View style={styles.tokenSection}>
            {tokenB.image && typeof tokenB.image === "string" && (
              <Image
                source={{ uri: tokenB.image }}
                style={styles.tokenImage}
                resizeMode="contain"
              />
            )}
            <View>
              <ThemedText style={styles.tokenAmount}>
                {amountOut} {tokenB.symbol}
              </ThemedText>
              {!!tokenB.price && (
                <ThemedText style={styles.tokenPrice}>
                  1 {tokenB.symbol} = ${parseFloat(tokenB.price).toFixed(2)}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Approx USD Value */}
        {!!approximateValue && (
          <ThemedText style={styles.swapValue}>
            ≈ ${approximateValue.toFixed(2)}
          </ThemedText>
        )}
      </ThemedView>        
    </ThemedView>
  );
};

export default SwapDetails2;

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
