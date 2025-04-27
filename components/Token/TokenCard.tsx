import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Token } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";

interface TokenCardProps {
  token: Token & { priceChange24h?: string };
  onPress?: () => void;
  onFavoriteToggle?: (token: Token, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onPress,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isFav, setIsFav] = useState(isFavorite);

  const imageSource = typeof token.image === "string" ? { uri: token.image } : token.image;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const toggleFavorite = () => {
    setIsFav(!isFav);
    if (onFavoriteToggle) {
      onFavoriteToggle(token, !isFav);
    }
  };

  const isHotToken =
    (token.volume && parseFloat(token.volume) > 10000000) ||
    (token.marketCup && parseFloat(token.marketCup) > 1000000000);

  const priceChange = token.priceChange24h ? parseFloat(token.priceChange24h) : null;
  const isPriceUp = priceChange && priceChange > 0;

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image source={imageSource} style={styles.tokenImage} resizeMode="contain" />
            ) : (
              <View style={[styles.tokenImage, styles.placeholderImage]} />
            )}
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Ionicons
              name={isFav ? "star" : "star-outline"}
              size={20}
              color={isFav ? "#FFD700" : "#BBB"}
            />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.tokenName}>
          {token.name} ({token.symbol})
        </ThemedText>

        <View style={styles.detailsContainer}>
          {token.price && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Price:</ThemedText>
              <View style={styles.priceContainer}>
                <ThemedText style={styles.detailValue}>
                  ${parseFloat(token.price).toFixed(6)}
                </ThemedText>
                {priceChange !== null && (
                  <Ionicons
                    name={isPriceUp ? "caret-up" : "caret-down"}
                    size={14}
                    color={isPriceUp ? "#00C4B4" : "#FF6B6B"}
                    style={styles.priceTrendIcon}
                  />
                )}
              </View>
            </View>
          )}
          {token.balance && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Balance:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {parseFloat(token.balance).toFixed(4)} {token.symbol}
              </ThemedText>
            </View>
          )}
          {token.value && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Value:</ThemedText>
              <ThemedText style={styles.detailValue}>
                ${parseFloat(token.value).toFixed(2)}
              </ThemedText>
            </View>
          )}
          {token.totalSupply && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Total Supply:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {parseFloat(token.totalSupply).toLocaleString()}
              </ThemedText>
            </View>
          )}
          {token.volume && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>24h Volume:</ThemedText>
              <ThemedText style={styles.detailValue}>
                ${parseFloat(token.volume).toLocaleString()}
              </ThemedText>
            </View>
          )}
          {token.marketCup && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Market Cap:</ThemedText>
              <ThemedText style={styles.detailValue}>
                ${parseFloat(token.marketCup).toLocaleString()}
              </ThemedText>
            </View>
          )}
          {token.totalReverse && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Liquidity:</ThemedText>
              <ThemedText style={styles.detailValue}>
                ${parseFloat(token.totalReverse).toLocaleString()}
              </ThemedText>
            </View>
          )}
          {token.coinGeckoId && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>CoinGecko ID:</ThemedText>
              <ThemedText style={styles.detailValue}>{token.coinGeckoId}</ThemedText>
            </View>
          )}
          {token.topPools && token.topPools.length > 0 && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Top Pools:</ThemedText>
              <ThemedText style={styles.detailValue}>{token.topPools.join(", ")}</ThemedText>
            </View>
          )}
        </View>

        {isHotToken && (
          <View style={styles.hotBadge}>
            <ThemedText style={styles.hotBadgeText}>🔥 Hot</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    padding: 12,
    marginRight: 12,
    width: 250,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  touchable: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  imageContainer: {
    alignItems: "center",
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderImage: {
    backgroundColor: "#555",
  },
  favoriteButton: {
    padding: 4,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#BBB",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    color: "#FFF",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceTrendIcon: {
    marginLeft: 4,
  },
  hotBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default TokenCard;