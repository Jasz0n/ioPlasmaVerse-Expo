import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "../ThemedText";
import { Token } from "@/constants/types";

interface PaymentDetailsProps {
  originToken: Token;
  destinationToken: Token;
  amountIn: string;
  amountOut: string;
  quoteError: string | null;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  originToken,
  destinationToken,
  amountIn,
  amountOut,
  quoteError,
}) => {
  return (
    <View style={styles.paymentDetails}>
      <ThemedText style={styles.label}>You Pay</ThemedText>
      {quoteError ? (
        <ThemedText style={styles.errorText}>{quoteError}</ThemedText>
      ) : (
        <View style={styles.tokenRow}>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenInfoContent}>
              <Image
                source={{ uri: originToken.image as string }}
                style={styles.tokenLogo}
                resizeMode="contain"
              />
              <ThemedText style={styles.tokenName}>
                ({originToken.symbol})
              </ThemedText>
            </View>
          </View>
          <View style={styles.tokenAmount}>
            <ThemedText style={styles.tokenAmountText}>
              {parseFloat(amountIn).toFixed(6)} {originToken.symbol}
            </ThemedText>
          </View>
        </View>
      )}

      <ThemedText style={styles.label}>You Receive</ThemedText>
      <View style={styles.tokenRow}>
        <View style={styles.tokenInfo}>
          <View style={styles.tokenInfoContent}>
            <Image
              source={{ uri: destinationToken.image as string }}
              style={styles.tokenLogo}
              resizeMode="contain"
            />
            <ThemedText style={styles.tokenName}>
              ({destinationToken.symbol})
            </ThemedText>
          </View>
        </View>
        <View style={styles.tokenAmount}>
          <ThemedText style={styles.tokenAmountText}>
            {parseFloat(amountOut).toFixed(6)} {destinationToken.symbol}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <ThemedText style={styles.dividerText}>Bridge with ioPlasmaVerse</ThemedText>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
};

export default PaymentDetails;

const styles = StyleSheet.create({
  paymentDetails: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#BBB",
    marginBottom: 6,
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#BBB",
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenInfoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: "#555",
  },
  tokenName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  tokenAmount: {
    alignItems: "flex-end",
  },
  tokenAmountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#BBB",
    fontWeight: "400",
  },
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    marginBottom: 10,
    textAlign: "center",
  },
});