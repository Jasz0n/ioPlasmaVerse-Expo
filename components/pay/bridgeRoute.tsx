import React, { useCallback, useEffect, useState } from "react";

import { Token, UNISWAP_CONTRACTS2 } from "@/constants/types";
import { ThemedText } from "../ThemedText";
import {
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type Route = {
  originToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
  destinationToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
};

// Reusable RouteItem componen
const RouteItem: React.FC<{
  item: Route;
  amountA: string;
  amountB: string;
  direction: string;
  succes: string;
  onSelect: (boolean: boolean) => void;
}> = ({ item, amountA, amountB, direction, onSelect, succes }) => {
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

  const originChainName = Object.entries(UNISWAP_CONTRACTS2).find(
    ([_, data]) => data.chainId === item.originToken.chainId
  )?.[0] || "Unknown";
  const destinationChainName = Object.entries(UNISWAP_CONTRACTS2).find(
    ([_, data]) => data.chainId === item.destinationToken.chainId
  )?.[0] || "Unknown";
  const fallbackImage = "https://via.placeholder.com/32/1E1E1E/FFFFFF?text=?";
  const styles = StyleSheet.create({
    routeList: {
      marginBottom: 12,
    },
    title: {
      fontSize: 16, // Match SwapDetails sectionTitle
      fontWeight: "600",
      color: "#FFF", // Match modal primary text
      textAlign: "center",
      marginBottom: 8,
    },
    routeItem: {
      marginBottom: 10,
    },
    routeCard: {
      backgroundColor: succes === "success" ? "rgba(46, 204, 113, 0.2)" : succes === "error" ? "#FF6B6B" : "#252525", // Dynamic background
      borderRadius: 8, // Match SwapDetails
      padding: 12,
      borderWidth: 1,
      borderColor: "#BBB", // Match PayInterFace and SwapDetails border
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2, // Match modal shadow
          shadowRadius: 3,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    tokenPair: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center", // Center the tokens like SwapDetails
      marginBottom: 6,
    },
    tokenContainer: {
      flexDirection: "column", // Stack vertically like SwapDetails
      alignItems: "center", // Center items like SwapDetails
      marginHorizontal: 8, // Match SwapDetails tokenSection
    },
    tokenLogo: {
      width: 32, // Match SwapDetails tokenImage
      height: 32,
      borderRadius: 16,
      marginBottom: 4, // Space below image like SwapDetails
      borderWidth: 1,
      borderColor: "#BBB", // Match PayInterFace and SwapDetails border
    },
    tokenSymbol: {
      fontSize: 14, // Match SwapDetails tokenName
      fontWeight: "500",
      color: "#FFF", // Match modal primary text
      marginBottom: 2, // Match SwapDetails spacing
    },
    tokenChain: {
      fontSize: 14, // Match SwapDetails tokenAmount
      color: "#BBB", // Match modal secondary text
      fontWeight: "400",
    },
    arrow: {
      fontSize: 20, // Match SwapDetails swapArrow
      color: "#FFF", // Match SwapDetails for better contrast
      fontWeight: "bold",
      marginHorizontal: 4, // Match SwapDetails
    },
    routeDescription: {
      fontSize: 13, // Match modal secondary text
      color: "#BBB", // Match modal secondary text
      textAlign: "center",
      opacity: 0.8,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
  });
  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.routeItem}
        onPress={(e) => {
          e.stopPropagation();
          onSelect(true);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityLabel={`Select route ${item.originToken.symbol} to ${item.destinationToken.symbol}`}
      >
        <View style={styles.routeCard}>
                  <View style={styles.tokenPair}>
                    <View style={styles.tokenContainer}>
                      <Image
                        source={{ uri: item.originToken.iconUri || fallbackImage }}
                        style={styles.tokenLogo}
                        resizeMode="contain"
                      />
                      <View>
                        <ThemedText style={styles.tokenSymbol}>{item.originToken.symbol}  {parseFloat(amountA).toFixed(6)}</ThemedText>
                        <ThemedText style={styles.tokenChain}>{originChainName}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.arrow}>→</ThemedText>
                    <View style={styles.tokenContainer}>
                      <Image
                        source={{ uri: item.destinationToken.iconUri || fallbackImage }}
                        style={styles.tokenLogo}
                        resizeMode="contain"
                      />
                      <View>
                        <ThemedText style={styles.tokenSymbol}>{item.destinationToken.symbol}  {parseFloat(amountB).toFixed(6)}</ThemedText>
                        <ThemedText style={styles.tokenChain}>{destinationChainName}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={styles.routeDescription}>
                    {item.originToken.name} to {item.destinationToken.name}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        };
        
        
        const styles = StyleSheet.create({
            
          
          routeList: {
            marginBottom: 12,
          },
          routeItem: {
            marginBottom: 10,
          },
          routeCard: {
            backgroundColor: "#2A2A2A",
            borderRadius: 10,
            padding: 10,
            borderWidth: 0.5,
            borderColor: "#444",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
              android: {
                elevation: 2,
              },
            }),
          },
          tokenPair: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          },
          tokenContainer: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          },
          tokenLogo: {
            width: 28,
            height: 28,
            borderRadius: 14,
            marginRight: 8,
            borderWidth: 0.5,
            borderColor: "#555",
          },
          tokenSymbol: {
            fontSize: 15,
            fontWeight: "600",
            color: "#FFF",
          },
          tokenChain: {
            fontSize: 11,
            color: "#BBB",
            marginTop: 2,
          },
          arrow: {
            fontSize: 14,
            color: "#00C4B4",
            marginHorizontal: 8,
            fontWeight: "600",
          },
          routeDescription: {
            fontSize: 11,
            color: "#BBB",
            textAlign: "center",
            opacity: 0.8,
          },
          pagination: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
          },
        });
        
        export default RouteItem;