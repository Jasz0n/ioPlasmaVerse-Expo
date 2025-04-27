import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Image,
  ImageSourcePropType,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { Token } from "@/constants/types";

interface FetchContractDataProps {
  amountIn: string;
  amountOut: string;
  amountBridge: string;
  tokenA: Token;
  tokenB: Token;
  tokenBridge: Token;
  direction: string;
}

const PayDetails: React.FC<FetchContractDataProps> = ({
  amountIn,
  amountOut,
  amountBridge,
  tokenBridge,
  direction,
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

  // Display the approximate cost in USD (prefer tokenB if it's the "buy" token)
  const approximateValue = swapValueInUsdB || swapValueInUsdA;

  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/
  return (
    <ThemedView style={styles.container}>
      {/* Top Section: Swap Details */}
      <ThemedView >
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Pay Details
        </ThemedText>

        {/* Swap Summary Row */}
        <View style={styles.swapSummaryRow}>
          {/* Token A */}
          <View style={styles.tokenSection}>
            {tokenA.image && typeof tokenA.image === "string" ? (
              <Image
                source={{ uri: tokenA.image }}
                style={styles.tokenImage}
                resizeMode="contain"
              />
            ) : (
              <Image source={tokenA.image as ImageSourcePropType} style={styles.tokenImage} />
            )}
            <ThemedText style={styles.tokenName}>
              {tokenA.symbol}
            </ThemedText>
            <ThemedText style={styles.tokenAmount}>
              {parseFloat(amountIn).toFixed(6)}
            </ThemedText>
          </View>

          {/* Arrow */}
          <ThemedText style={styles.swapArrow}>→</ThemedText>

          {/* Token Bridge (if 2Step) */}
          {direction === "2Step" && (
            <>
              <View style={styles.tokenSection}>
                {tokenBridge.image && typeof tokenBridge.image === "string" ? (
                  <Image
                    source={{ uri: tokenBridge.image }}
                    style={styles.tokenImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image source={tokenBridge.image as ImageSourcePropType} style={styles.tokenImage} />
                )}
                <ThemedText style={styles.tokenName}>
                  {tokenBridge.symbol}
                </ThemedText>
                <ThemedText style={styles.tokenAmount}>
                  {parseFloat(amountBridge).toFixed(6)}
                </ThemedText>
              </View>
              <ThemedText style={styles.swapArrow}>→</ThemedText>
            </>
          )}

          {/* Token B */}
          <View style={styles.tokenSection}>
            {tokenB.image && typeof tokenB.image === "string" ? (
              <Image
                source={{ uri: tokenB.image }}
                style={styles.tokenImage}
                resizeMode="contain"
              />
            ) : (
              <Image source={tokenB.image as ImageSourcePropType} style={styles.tokenImage} />
            )}
            <ThemedText style={styles.tokenName}>
              {tokenB.symbol}
            </ThemedText>
            <ThemedText style={styles.tokenAmount}>
              {parseFloat(amountOut).toFixed(6)}
            </ThemedText>
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

export default PayDetails;

/* ------------------------------------------------------------------
 * Styles
 * ----------------------------------------------------------------*/
const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 8,
    padding: 16,
   
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
    marginBottom: 12,
    textAlign: "center",
  },
  swapSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  tokenSection: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  tokenImage: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  tokenAmount: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "400",
  },
  swapArrow: {
    fontSize: 20,
    color: "#00C4B4",
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  swapValue: {
    marginTop: 12,
    fontSize: 14,
    color: "#00C4B4",
    fontWeight: "600",
    textAlign: "center",
  },
});