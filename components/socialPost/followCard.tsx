import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { useNavigation } from "@react-navigation/native"; // For navigation

// Interface for props
interface FollowCardProps {
  userId: string;
  userName: string;
  onFollowToggle: (userId: string) => void;
  isFollowing: boolean;
}

const FollowCard: React.FC<FollowCardProps> = ({ userId, userName, onFollowToggle, isFollowing }) => {
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const navigation = useNavigation(); // Hook for navigation

  // Placeholder for fetching user profile image (you'll need to implement this)
  

  // Navigate to the user's profile screen
  

  return (
    <ThemedView style={styles.followCard}>
      {/* Profile Image */}
      {ownedNftsProfile?.image ? (
        <Image
          source={{ uri: ownedNftsProfile.image }}
          style={styles.profileImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage} />
      )}

      {/* User Info */}
      <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>{userName}</ThemedText>
        <TouchableOpacity
          onPress={() => onFollowToggle(userId)}
          style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButtonActive]}
        >
          <ThemedText style={styles.followButtonText}>
            {isFollowing ? "Unfollow" : "Follow"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  followCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#555",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  followButton: {
    backgroundColor: "#555",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  followButtonActive: {
    backgroundColor: "#007AFF",
  },
  unfollowButton: {
    backgroundColor: "#FF4444",
  },
  followButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});

export default FollowCard;