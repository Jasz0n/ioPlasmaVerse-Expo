import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { ThemedText } from "../ThemedText";
import { ADDRESS_ZERO, defineChain, getContract, readContract } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { symbol } from "thirdweb/dist/types/extensions/common/__generated__/IContractMetadata/read/symbol";
import { Token } from "@/constants/types";

interface CoinGeckoChartProps {
  symbol: string;
  Token: Token;
  poolAddress?: string[];
}

const CoinGeckoChart: React.FC<CoinGeckoChartProps> = ({
  
  symbol,
  Token,
  poolAddress,
}) => {
  const NETWORK = defineChain(Token.chainId);
  const [loading, setLoading] = useState(false);

  const chartUrl = `https://www.geckoterminal.com/de/${symbol || "base"}/pools/${Token.topPools ? Token.topPools[0]: poolAddress }?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=15m`;

  return (
    <View style={styles.container}>
      
        <WebView
          source={{ uri: chartUrl }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00C4B4" />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
          }}
        />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: "100%",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#a8dadc",
  },
  errorText: {
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "center",
    padding: 16,
  },
  noDataText: {
    fontSize: 14,
    color: "#f5f5f5",
    textAlign: "center",
    padding: 16,
  },
});

export default CoinGeckoChart;