import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

// Utility function to format the amount
const formatAmount = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";

  // If the number is 0, return it as is
  if (num === 0) return "0";

  // If the number is greater than 1, round to 3 decimal places
  if (num >= 1) return num.toFixed(3);

  // For very small numbers (e.g., 0.00003540539), show 3 significant digits after the last leading zero
  const str = num.toFixed(10); // Convert to string with high precision to avoid scientific notation
  const match = str.match(/0\.0*([1-9]\d{0,2})/); // Match the first non-zero digit and up to 3 digits after
  if (match) {
    const significantDigits = match[1];
    const leadingZeros = str.indexOf(significantDigits) - 2; // Number of leading zeros after "0."
    return `0.${"0".repeat(leadingZeros)}${significantDigits}`;
  }

  // Fallback: round to 3 decimal places
  return num.toFixed(3);
};

interface EventCardProps {
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  transactionHash: string;
  fullTransactionHash: string;
  chainId: number;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  from,
  to,
  value,
  tokenSymbol,
  transactionHash,
  onPress,
}) => {
  // Format the amount
  const formattedValue = formatAmount(value);

  // Animations for card appearance
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const cardStyle = useAnimatedStyle(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardTranslateY.value = withSpring(0);
    return {
      opacity: cardOpacity.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  // Tap animation
  const scale = useSharedValue(1);
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  

  return (
      <Animated.View style={[styles.card, cardStyle, pressStyle]} >
        <TouchableOpacity
                onPress={(e) => {
                  onPress();
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
                accessibilityLabel={`Select transaction`}
              >
        <View style={styles.eventContent}>
          <Ionicons name="wallet-outline" size={20} color="#00E5D5" style={styles.icon} />
          <View style={styles.eventDetails}>
            <ThemedText style={styles.eventText}>
              <ThemedText style={styles.walletAddress}>{from}</ThemedText> sent{" "}
              <ThemedText type="defaultSemiBold" style={styles.amount}>
                {formattedValue} {tokenSymbol}
              </ThemedText>{" "}
              to <ThemedText style={styles.walletAddress}>{to}</ThemedText>
            </ThemedText>
          </View>
        </View>
        <View style={styles.transactionRow}>
          <Ionicons name="link-outline" size={16} color="#00E5D5" style={styles.icon} />
          <ThemedText style={styles.transactionHash}>{transactionHash}</ThemedText>
        </View>
        </TouchableOpacity>
      </Animated.View>
  );
};

export default EventCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(58, 58, 58, 0.8)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 213, 0.2)", // Subtle gradient-like border
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  eventContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDetails: {
    flex: 1,
  },
  eventText: {
    fontSize: 16,
    color: "#FFF",
    lineHeight: 26,
  },
  walletAddress: {
    color: "#FFF", // Explicitly set to white to match your dApp's theme
    fontWeight: "600",
  },
  amount: {
    color: "#00E5D5",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  icon: {
    marginRight: 12,
  },
  transactionHash: {
    fontSize: 14,
    color: "#00E5D5",
    fontWeight: "500",
  },
});
