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


// Reusable RouteItem component
const RouteItem: React.FC<{
  item: Route;
  onSelect: (route: Route) => void;
}> = ({ item, onSelect }) => {
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

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.routeItem}
        onPress={(e) => {
          e.stopPropagation();
          onSelect(item);
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
                <ThemedText style={styles.tokenSymbol}>{item.originToken.symbol}</ThemedText>
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
                <ThemedText style={styles.tokenSymbol}>{item.destinationToken.symbol}</ThemedText>
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