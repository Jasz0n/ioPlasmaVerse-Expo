import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { useActiveAccount } from "thirdweb/react";
import { ADDRESS_ZERO } from "thirdweb";

// Interface for props
interface LikeComponentProps {
  postId: number;
  userId: string;
}

// Interface for liked users
interface LikeUser {
  user_id: string;
}

const LikeComponent: React.FC<LikeComponentProps> = ({ postId, userId }) => {
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likedUsers, setLikedUsers] = useState<LikeUser[]>([]);
  const [showLikedUsers, setShowLikedUsers] = useState<boolean>(false);
  const account = useActiveAccount();

  // Determine if the device is mobile based on screen width
  const { width: screenWidth } = Dimensions.get("window");
  const isMobile = screenWidth <= 768;

  // Fetch initial like status and count
  useEffect(() => {
    const fetchLikeData = async () => {

      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/post/getLikesPost/${postId}/${account?.address || ADDRESS_ZERO}`);
      const result = await response.json();
      setLiked(result.likedByUser);
      setLikeCount(result.likeCount);
    };

    fetchLikeData();
  }, [postId, account?.address]);

  // Toggle like status
  const handleLikeToggle = async () => {
    
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/post/likePost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: account?.address, post_id: postId }),
      });
      const result = await response.json();

      if (result.success) {
        const isLiked = result.action === "liked";
        setLiked(isLiked);
        setLikeCount((prevCount) => (isLiked ? prevCount + 1 : prevCount - 1));
        if (isLiked) {
          sendNotification();
        }
      } else {
        console.error("Failed to toggle like status:", result.error);
      }
    } catch (error) {
      console.error("Error toggling like status:", error);
    }
  };

  // Send notification when the post is liked
  const sendNotification = async () => {
    try {
      const notificationData = {
        user_id: userId,
        type: "like",
        message: `@${account?.address} has liked your post #${postId}.`,
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

  // Handle long press to show liked users
  const handleLongPress = async () => {
    console.log("Long press detected, attempting to fetch liked users...");

    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/post/likedUsersPost/${postId}`);
      console.log("Fetch response received:", response);

      if (!response.ok) {
        console.error("Failed to fetch liked users. Status:", response.status);
        setLikedUsers([]);
        return;
      }

      const result = await response.json();
      console.log("Parsed JSON result:", result);

      if (result.events && result.events.length > 0) {
        console.log("Setting liked users:", result.events);
        setLikedUsers(result.events);
      } else {
        console.log("No liked users found, setting to an empty array.");
        setLikedUsers([]);
      }

      setShowLikedUsers(true);
    } catch (error) {
      console.error("Error fetching liked users:", error);
      setLikedUsers([]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Like Button */}
      <TouchableOpacity
        onPress={handleLikeToggle}
        onLongPress={handleLongPress}
        style={styles.likeButton}
      >
        <MaterialCommunityIcons
          name={liked ? "heart" : "heart-outline"}
          size={24}
          color={liked ? "red" : "#A0A0A0"}
        />
        <ThemedText style={styles.likeCount}>{likeCount}</ThemedText>
      </TouchableOpacity>

      {/* Modal to show list of users who liked the post */}
      <Modal
        visible={showLikedUsers}
        animationType="slide"
        onRequestClose={() => setShowLikedUsers(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>Liked by</ThemedText>
          <FlatList
            data={likedUsers}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <ThemedText style={styles.userItem}>{item.user_id}</ThemedText>
            )}
            ListEmptyComponent={<ThemedText style={styles.emptyText}>No likes yet</ThemedText>}
            contentContainerStyle={styles.userList}
          />
          <TouchableOpacity
            onPress={() => setShowLikedUsers(false)}
            style={styles.closeButton}
          >
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  likeCount: {
    marginLeft: 8,
    fontSize: 16,
    color: "#A0A0A0",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  userList: {
    paddingBottom: 20,
  },
  userItem: {
    fontSize: 16,
    color: "#A0A0A0",
    paddingVertical: 5,
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default LikeComponent;