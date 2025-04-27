import React from "react";
import {
  View,
  Text,
  StyleSheet,
 TouchableOpacity,
  Image,
  Linking
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NftContract } from "./saveContract";

interface ContractCardProps {
  contractAddresse: string;
  chainId: number;
  onPress: () => void;
  contract: NftContract;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contractAddresse,
  chainId,
  onPress,
  contract
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Thumbnail or Banner */}
      <ThemedView style={styles.thumbnailContainer}>
        <Image
          source={{ uri: contract.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </ThemedView>

      {/* Contract Details */}
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {contract.title || "Unnamed Collection"}
        </ThemedText>
        <ThemedText style={styles.description} numberOfLines={2}>
          {contract.description || "No description available."}
        </ThemedText>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <ThemedText style={styles.statsLabel}>Valid Total Supply</ThemedText>
            <ThemedText style={styles.statsValue}>N/A</ThemedText>
          </View>
          <View style={styles.statsItem}>
            <ThemedText style={styles.statsLabel}>Unique Owners</ThemedText>
            <ThemedText style={styles.statsValue}>N/A</ThemedText>
          </View>
          <View style={styles.statsItem}>
            <ThemedText style={styles.statsLabel}>Total Supply</ThemedText>
            <ThemedText style={styles.statsValue}>1000</ThemedText>
          </View>
        </View>

        {/* Social Icons Row */}
        <View style={styles.socialIconsContainer}>
          {contract.social_urls?.x && (
            <TouchableOpacity onPress={() => Linking.openURL(contract.social_urls?.x || "")}>
              <FontAwesome5 name="twitter" style={styles.socialIcon} />
            </TouchableOpacity>
          )}
          {contract.social_urls?.telegram && (
            <TouchableOpacity onPress={() => Linking.openURL(contract.social_urls?.telegram || "")}>
              <FontAwesome5 name="telegram" style={styles.socialIcon} />
            </TouchableOpacity>
          )}
          {contract.social_urls?.discord && (
            <TouchableOpacity onPress={() => Linking.openURL(contract.social_urls?.discord || "")}>
              <FontAwesome5 name="discord" style={styles.socialIcon} />
            </TouchableOpacity>
          )}
          {contract.social_urls?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(contract.social_urls?.website || "")}>
              <FontAwesome5 name="globe" style={styles.socialIcon} />
            </TouchableOpacity>
          )}
          {contract.social_urls?.github && (
            <TouchableOpacity onPress={() => Linking.openURL(contract.social_urls?.github || "")}>
              <FontAwesome5 name="github" style={styles.socialIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    backgroundColor: "#2C2C2C",
    overflow: "hidden",
    marginBottom: 16,
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  statsItem: {
    alignItems: "center",
    flex: 1,
  },
  statsLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  statsValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  socialIconsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  socialIcon: {
    fontSize: 20,
    color: "#fff",
    marginRight: 16,
  },
});
