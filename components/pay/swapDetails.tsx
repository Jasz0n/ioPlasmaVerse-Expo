import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { Token } from "@/constants/types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface FetchContractDataProps {
  amountIn: string;
  amountOut: string;
  path: any[]; // Array of { token: Token } objects
  direction: string;
  onSelect: (boolean: boolean) => void;
  succes: string; 
}

const SwapDetails: React.FC<FetchContractDataProps> = ({
  amountIn,
  amountOut,
  path,
  direction, onSelect, succes

}) => {
   const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
  
    const handlePressIn = () => {
      scale.value = withTiming(0.95, { duration: 100 });
    };
  
    const handlePressOut = () => {
      scale.value = withTiming(1, { duration: 100 });
    };
  /* ------------------------------------------------------------------
   * Derive approximate USD value using the last token's price
   * ----------------------------------------------------------------*/
  const lastToken = path[path.length - 1]?.token; // Last token in the path
  const lastTokenPrice = lastToken?.price ? parseFloat(lastToken.price) : 0;
  const approximateValue = lastTokenPrice * parseFloat(amountOut || "0");
  const styles = StyleSheet.create({
    container: {
      gap: 4,
      marginBottom: 8,
      paddingTop:15,
    },
    swapDetailsCard: {
      backgroundColor: succes === "success" ? "rgba(46, 204, 113, 0.2)" : succes === "error" ? "#FF6B6B" : "#252525",      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: "#BBB", // Match PayInterFace border
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      color: "#FFF", // Match modal primary text
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
      marginHorizontal: 4,
    },
    tokenImage: {
      width: 32,
      height: 32,
      marginBottom: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#BBB", // Match PayInterFace border
    },
    tokenName: {
      fontSize: 14,
      color: "#FFF", // Match modal primary text
      fontWeight: "500",
      marginBottom: 2,
    },
    tokenAmount: {
      fontSize: 14,
      color: "#BBB", // Match modal secondary text
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
    tokenPrice: {
      fontSize: 10,
      color: "#A0A0A0",
      marginTop: 2,
    },
  });

  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/
  return (
    <Animated.View style={[animatedStyle]}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onSelect(true);
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
            accessibilityLabel={`Select route`}
          >
    <ThemedView style={styles.container}>
      {/* Top Section: Swap Details */}
      <ThemedView style={styles.swapDetailsCard}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
           {direction === "2Step" ? "First Step: Swap Route" : "Swap Route" }
        </ThemedText>
        
        {/* Swap Summary Row */}
        <View style={styles.swapSummaryRow}>
          {path.map((item: { token: Token }, index: number) => {
            const token = item.token;
            const isFirstToken = index === 0;
            const isLastToken = index === path.length - 1;
            const showAmount = isFirstToken || isLastToken;
            const amount = isFirstToken ? amountIn : isLastToken ? amountOut : null;

            return (
              <React.Fragment key={token.contractAddress}>
                {/* Token Section */}
                <View style={styles.tokenSection}>
                  {token.image && typeof token.image === "string" ? (
                    <Image
                      source={{ uri: token.image }}
                      style={styles.tokenImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image
                      source={token.image as ImageSourcePropType}
                      style={styles.tokenImage}
                    />
                  )}
                  <ThemedText style={styles.tokenName}>
                    {token.symbol}
                  </ThemedText>
                  {showAmount && (
                    <ThemedText style={styles.tokenAmount}>
                      {parseFloat(amount!).toFixed(6)}
                    </ThemedText>
                  )}
                   {!!token.price && (
                                  <ThemedText style={styles.tokenPrice}>
                                    1 {token.symbol} = ${parseFloat(token.price).toFixed(4)}
                                  </ThemedText>
                                )}
                </View>

                {/* Arrow (if not the last token) */}
                {!isLastToken && (
                  <ThemedText style={styles.swapArrow}>→</ThemedText>
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Approx USD Value */}
        {!!approximateValue && (
          <ThemedText style={styles.swapValue}>
            ≈ ${approximateValue.toFixed(2)}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
    </TouchableOpacity>
        </Animated.View>
  );
};

export default SwapDetails;

/* ------------------------------------------------------------------
 * Styles
 * ----------------------------------------------------------------*/
