import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useActiveAccount } from "thirdweb/react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ADDRESS_ZERO } from "thirdweb";

// Interface for props
interface ReactionComponentProps {
  commentId: number;
  userId: string;
}

// Interface for reaction users
interface ReactionUser {
  user_id: string;
  reaction_type?: string;
}

// Define a type for the icon names used in reactionsList
type ReactionIconName = "heart" | "emoticon-happy" | "star" | "thumb-down" | "rocket";

// Interface for a reaction item in reactionsList
interface ReactionItem {
  type: string;
  icon: ReactionIconName; // Use the specific type for icon names
  color: string;
}

// List of reactions with icons
const reactionsList: ReactionItem[] = [
  { type: "love", icon: "heart", color: "red" },
  { type: "happy", icon: "emoticon-happy", color: "yellow" },
  { type: "star", icon: "star", color: "red" },
  { type: "thumbsDown", icon: "thumb-down", color: "gray" },
  { type: "rocket", icon: "rocket", color: "red" },
];

const ReactionCommentComponent: React.FC<ReactionComponentProps> = ({ commentId, userId }) => {
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [reactionUsers, setReactionUsers] = useState<ReactionUser[]>([]);
  const [selectedReactionType, setSelectedReactionType] = useState<string | null>(null);
  const [showReactionUsers, setShowReactionUsers] = useState<boolean>(false);
  const [showReactionsPicker, setShowReactionsPicker] = useState<boolean>(false);
  const account = useActiveAccount();

  // Determine if the device is mobile based on screen width
  const { width: screenWidth } = Dimensions.get("window");
  const isMobile = screenWidth <= 768;

  // Fetch reaction data on mount
  useEffect(() => {
    const fetchReactionData = async () => {
      const response = await fetch(`/api/getReactionsComment/${commentId}/${account?.address || ADDRESS_ZERO}`);
      const result = await response.json();
      setReaction(result.userReaction);
      setReactionCounts(result.reactionCounts || {});
    };

    fetchReactionData();
  }, [commentId, account?.address]);

  // Handle reaction selection
  const handleReactionSelect = async (selectedReaction: string) => {
    
    setShowReactionsPicker(false);
    const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/comment/reactComment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: account?.address, comment_id: commentId, reaction_type: selectedReaction }),
    });
    const result = await response.json();

    if (result.success) {
      fetchUpdatedReactions();
      sendNotification(selectedReaction);
    } else {
      console.error("Failed to add or remove reaction:", result.error);
    }
  };

  // Send notification
  const sendNotification = async (selectedReactionType: string) => {
    try {
      const notificationData = {
        user_id: userId,
        type: selectedReactionType,
        message: `@${account?.address} made a reaction on your comment #${commentId}.`,
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

  // Fetch updated reactions
  const fetchUpdatedReactions = async () => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/comment/getReactionsComment/${commentId}/${account?.address || ADDRESS_ZERO}`);
      const result = await response.json();
      setReaction(result.userReaction);
      setReactionCounts(result.reactionCounts || {});
    } catch (error) {
      console.error("Error fetching updated reactions:", error);
    }
  };

  // Handle long press to show reaction users
  const handleLongPress = async () => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/comment/reactionUsersComment/${commentId}`);
      if (!response.ok) {
        console.error("Failed to fetch users who reacted. Status:", response.status);
        setReactionUsers([]);
        return;
      }

      const result = await response.json();
      console.log("Fetched reaction users:", result.events);

      const validReactionUsers = result.events.filter((user: ReactionUser) => {
        if (!user.reaction_type) {
          console.warn("User with undefined reaction_type:", user);
          return false;
        }
        return true;
      });

      setReactionUsers(validReactionUsers);
      setShowReactionUsers(true);
    } catch (error) {
      console.error("Error fetching users who reacted:", error);
      setReactionUsers([]);
    }
  };

  // Get the current reaction icon
  const getCurrentReactionIcon = () => {
    const selectedReaction = reactionsList.find((r) => r.type === reaction);
    return selectedReaction ? (
      <MaterialCommunityIcons name={selectedReaction.icon} size={24} color={selectedReaction.color} />
    ) : (
      <MaterialCommunityIcons name="heart" size={24} color="gray" />
    );
  };

  // Calculate total reaction count
  const totalReactionCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  // Filter reaction users based on selected reaction type
  const filteredReactionUsers = selectedReactionType
    ? reactionUsers.filter((user) => user.reaction_type === selectedReactionType)
    : reactionUsers;

  // Handle reaction selection for filtering users
  const handleReactSelectionMap = (reactionType: string) => {
    console.log("Selected reaction type:", reactionType);
    setSelectedReactionType(reactionType);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Reaction Button */}
      <TouchableOpacity
        onPress={() => setShowReactionsPicker(!showReactionsPicker)}
        onLongPress={handleLongPress}
        style={styles.reactionButton}
      >
        {getCurrentReactionIcon()}
        <ThemedText style={styles.reactionCount}>{totalReactionCount}</ThemedText>
      </TouchableOpacity>

      {/* Reactions Picker */}
      {showReactionsPicker && (
        <View style={styles.reactionsPicker}>
          {reactionsList.map((reactionOption) => (
            <TouchableOpacity
              key={reactionOption.type}
              onPress={() => handleReactionSelect(reactionOption.type)}
              style={styles.reactionIcon}
            >
              <MaterialCommunityIcons name={reactionOption.icon} size={24} color={reactionOption.color} />
              <ThemedText style={styles.reactionCount}>
                {reactionCounts[reactionOption.type] || 0}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reaction Users Modal */}
      <Modal
        visible={showReactionUsers}
        animationType="slide"
        onRequestClose={() => setShowReactionUsers(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>Reactions by</ThemedText>
          <View style={styles.reactionsFilter}>
            {reactionsList.map((reactionOption) => (
              <TouchableOpacity
                key={reactionOption.type}
                onPress={() => handleReactSelectionMap(reactionOption.type)}
                style={styles.reactionIcon}
              >
                <MaterialCommunityIcons name={reactionOption.icon} size={24} color={reactionOption.color} />
                <ThemedText style={styles.reactionCount}>
                  {reactionCounts[reactionOption.type] || 0}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredReactionUsers}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <ThemedText style={styles.userItem}>{item.user_id}</ThemedText>
            )}
            ListEmptyComponent={<ThemedText style={styles.emptyText}>No users for this reaction</ThemedText>}
            contentContainerStyle={styles.userList}
          />
          <TouchableOpacity
            onPress={() => setShowReactionUsers(false)}
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
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  reactionCount: {
    marginLeft: 8,
    fontSize: 16,
    color: "#A0A0A0",
  },
  reactionsPicker: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
  },
  reactionIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 5,
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
  reactionsFilter: {
    flexDirection: "row",
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

export default ReactionCommentComponent;