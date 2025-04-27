import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { readContract, resolveMethod } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import FollowCard from "./followCard";

// Interface for Hashtag
interface Hashtag {
  hashtag_id: number;
  tag: string;
}

// Interface for User
interface User {
  tokenId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

const HashtagsComponent: React.FC = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false); // Expands Manage Hashtags container
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUser, setUser] = useState<User[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set()); // Track followed users


 

  // Fetch hashtags on component load
  useEffect(() => {
    fetchHashtags();
    fetchFollowingStatus();
  }, [account?.address]);

  const fetchFollowingStatus = useCallback(async () => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/follow/getFollowers/${account?.address}`);
      if (!response.ok) {
        console.error(`Error fetching followers: HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log("Fetched followers data:", data);

      if (Array.isArray(data.followers)) {
        const followingIds: Set<string> = new Set(
          data.followers.map((follower: { follower_user_id: string }) => follower.follower_user_id)
        );
        console.log("Following IDs:", followingIds);
        setFollowing(followingIds);
      } else {
        console.warn("Unexpected followers data format:", data.followers);
      }
    } catch (error) {
      console.error("Error fetching following status:", error);
    }
  }, [account?.address]);

  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://www.ioplasmaverse.com/api/socialPost/hashtags/getHashtags");
      const result = await response.json();
      console.log("Fetched result:", result);
      console.log("Fetched hashtags:", result.hashtags);
      setHashtags(result || []);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
    }
    setLoading(false);
  };

  const handleAddHashtag = async () => {
    if (!newTag) return;
    setLoading(true);
    try {
      const response = await fetch("https://www.ioplasmaverse.com/api/socialPost/hashtags/addHashtag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: newTag }),
      });
      const result = await response.json();
      setHashtags([...hashtags, result]);
      setNewTag("");
    } catch (error) {
      console.error("Error adding hashtag:", error);
    }
    setLoading(false);
  };

  const handleRemoveHashtag = async (id: number) => {
    setLoading(true);
    try {
      await fetch(`https://www.ioplasmaverse.com/api/socialPost/hashtags/removeHashtag/${id}`, { method: "DELETE" });
      setHashtags(hashtags.filter((hashtag) => hashtag.hashtag_id !== id));
    } catch (error) {
      console.error("Error removing hashtag:", error);
    }
    setLoading(false);
  };

  const sendNotification = async (userId: string) => {
    try {
      const notificationData = {
        user_id: userId,
        type: "follow",
        message: `@${account?.address} Followed you.`,
      };

      console.log("Sending notificationData:", notificationData);

      const response = await fetch(`https://www.ioplasmaverse.com/api/sendNotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationData }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Failed to send notification:", errorResponse);
      } else {
        const successResponse = await response.json();
        console.log("Notification sent successfully:", successResponse);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const sendNotificationUnFollow = async (userId: string) => {
    try {
      const notificationData = {
        user_id: userId,
        type: "unFollow",
        message: `@${account?.address} stopped Following you.`,
      };

      console.log("Sending notificationData:", notificationData);

      const response = await fetch(`https://www.ioplasmaverse.com/api/sendNotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationData }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Failed to send notification:", errorResponse);
      } else {
        const successResponse = await response.json();
        console.log("Notification sent successfully:", successResponse);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    const isFollowing = following.has(userId);
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account?.address,
          FollowerId: userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchFollowingStatus();

        if (result.action === "followed") {
          sendNotification(userId);
        } else if (result.action === "unfollowed") {
          sendNotificationUnFollow(userId);
        }
      } else {
        console.error("Failed to toggle follow status:", result.error);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };

  return (
    <ThemedView style={styles.hashtagContainer}>
      {/* Manage Hashtags Header */}
      <TouchableOpacity
        style={[styles.manageContainer, isExpanded && styles.expanded]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <ThemedText style={styles.title}>Manage Hashtags</ThemedText>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#A0A0A0"
        />
      </TouchableOpacity>

      {/* Input for Adding Hashtags */}
      {isExpanded && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter new hashtag"
            placeholderTextColor="#A0A0A0"
            value={newTag}
            onChangeText={setNewTag}
          />
          <TouchableOpacity
            onPress={handleAddHashtag}
            disabled={loading || !newTag}
            style={[styles.addButton, (loading || !newTag) && styles.addButtonDisabled]}
          >
            <ThemedText style={styles.addButtonText}>Add</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Hashtags List */}
      <ScrollView style={styles.tagsContainer} contentContainerStyle={styles.tagsContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : hashtags.length > 0 ? (
          hashtags.map((hashtag) => (
            <View key={hashtag.hashtag_id} style={styles.tag}>
              <ThemedText style={styles.tagText}>{hashtag.tag}</ThemedText>
              {account?.address === "0x515D1BcEf9536075CC6ECe0ff21eCCa044Db9446" && (
                <TouchableOpacity
                  onPress={() => handleRemoveHashtag(hashtag.hashtag_id)}
                  style={styles.removeButton}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#FF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <ThemedText style={styles.emptyText}>No hashtags found.</ThemedText>
        )}
      </ScrollView>

      {/* User List to Follow */}
      <View style={styles.userList}>
        <ThemedText style={styles.sectionTitle}>List to Follow</ThemedText>
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : allUser.length > 0 ? (
          allUser.map((user) => (
            <FollowCard
              key={user.userId}
              userId={user.userId}
              userName={user.userName}
              onFollowToggle={handleFollowToggle}
              isFollowing={following?.has(user.userId.toLowerCase())}
            />
          ))
        ) : (
          <ThemedText style={styles.emptyText}>No users found.</ThemedText>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  hashtagContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 16,
  },
  manageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expanded: {
    backgroundColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: "#555",
  },
  addButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  tagsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  tagsContent: {
    paddingBottom: 8,
  },
  tag: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#fff",
  },
  removeButton: {
    padding: 4,
  },
  userList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#FF4444",
    textAlign: "center",
    marginTop: 12,
  },
});

export default HashtagsComponent;