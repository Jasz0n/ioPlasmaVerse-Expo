import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { useActiveAccount } from "thirdweb/react";
import { ADDRESS_ZERO } from "thirdweb";

// Interface for props
interface ReactionComponentProps {
  postId: number;
  userId: string;
}

// Interface for reaction users
interface ReactionUser {
  user_id: string;
  reaction_type: string;
}

// Define a type for the allowed MaterialCommunityIcons names used in this component
type ReactionIconName =
  | "heart"
  | "heart-outline"
  | "emoticon-happy-outline"
  | "star"
  | "thumb-down-outline"
  | "rocket-outline";

// Interface for reaction options
interface ReactionOption {
  type: string;
  icon: ReactionIconName;
  color: string;
}

// Define the reactions list with typed icon names
const reactionsList: ReactionOption[] = [
  { type: "love", icon: "heart", color: "red" },
  { type: "happy", icon: "emoticon-happy-outline", color: "yellow" },
  { type: "star", icon: "star", color: "red" },
  { type: "thumbsDown", icon: "thumb-down-outline", color: "gray" },
  { type: "rocket", icon: "rocket-outline", color: "red" },
];

const ReactionComponent: React.FC<ReactionComponentProps> = ({ postId, userId }) => {
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [reactionUsers, setReactionUsers] = useState<ReactionUser[]>([]);
  const [selectedReactionType, setSelectedReactionType] = useState<string | null>(null);
  const [showReactionUsers, setShowReactionUsers] = useState<boolean>(false);
  const [showReactionsPicker, setShowReactionsPicker] = useState<boolean>(false);
  const account = useActiveAccount();

  // Fetch initial reaction data
  useEffect(() => {
    const fetchReactionData = async () => {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/reaction/getReactionsPost/${postId}/${account?.address || ADDRESS_ZERO}`);
      const result = await response.json();
      setReaction(result.userReaction);
      setReactionCounts(result.reactionCounts || {});
    };

    fetchReactionData();
  }, [postId, account?.address]);

  // Handle reaction selection
  const handleReactionSelect = async (selectedReaction: string) => {
    setShowReactionsPicker(false);
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/reaction/reactPost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: account?.address,
          post_id: postId,
          reaction_type: selectedReaction,
        }),
      });
      const result = await response.json();

      if (result.success) {
        fetchUpdatedReactions();
        sendNotification(selectedReaction);
      } else {
        console.error("Failed to add or remove reaction:", result.error);
      }
    } catch (error) {
      console.error("Error adding or removing reaction:", error);
    }
  };

  // Fetch updated reactions from the server
  const fetchUpdatedReactions = async () => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/reaction/getReactionsPost/${postId}/${account?.address || ADDRESS_ZERO}`);
      const result = await response.json();
      setReaction(result.userReaction); // Update user’s current reaction
      setReactionCounts(result.reactionCounts || {}); // Update reaction counts
    } catch (error) {
      console.error("Error fetching updated reactions:", error);
    }
  };

  // Handle long press to view users who reacted
  const handleLongPress = async () => {
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/socialPost/reaction/reactionUsersPost/${postId}`);
      if (!response.ok) {
        console.error("Failed to fetch users who reacted. Status:", response.status);
        setReactionUsers([]);
        return;
      }

      const result = await response.json();
      if (result.events && result.events.length > 0) {
        console.log("Setting reaction users:", result.events);
        setReactionUsers(result.events);
      } else {
        console.log("No users found who reacted, setting empty array.");
        setReactionUsers([]);
      }

      setShowReactionUsers(true);
    } catch (error) {
      console.error("Error fetching users who reacted:", error);
      setReactionUsers([]);
    }
  };

  // Send notification when a reaction is added
  const sendNotification = async (selectedReactionType: string) => {
    try {
      const notificationData = {
        user_id: userId,
        type: selectedReactionType,
        message: `@${account?.address.toLowerCase()} reacted on your post #${postId}.`,
      };

      console.log("Sending notificationData:", notificationData);

      const response = await fetch(`/api/sendNotification`, {
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

  // Filter reaction users based on selected reaction type
  const filteredReactionUsers = selectedReactionType
    ? reactionUsers.filter((user) => user.reaction_type === selectedReactionType)
    : reactionUsers;

  // Handle reaction type selection in the modal
  const handleReactSelectionMap = (reactionType: string) => {
    console.log("Selected reaction type:", reactionType);
    setSelectedReactionType(reactionType);
  };

  // Render the currently selected reaction icon, or default to heart if no reaction is selected
  const getCurrentReactionIcon = (): ReactionIconName => {
    const selectedReaction = reactionsList.find((r) => r.type === reaction);
    return selectedReaction ? selectedReaction.icon : "heart-outline";
  };

  // Calculate total reaction count
  const totalReactionCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <ThemedView style={styles.container}>
      {/* Reaction Button */}
      <TouchableOpacity
        onPress={() => setShowReactionsPicker(!showReactionsPicker)}
        onLongPress={handleLongPress}
        style={styles.reactionButton}
      >
        <MaterialCommunityIcons
          name={getCurrentReactionIcon()}
          size={24}
          color={reaction ? reactionsList.find((r) => r.type === reaction)?.color : "#A0A0A0"}
        />
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
              <MaterialCommunityIcons
                name={reactionOption.icon}
                size={24}
                color={reactionOption.color}
              />
              <ThemedText style={styles.reactionCount}>
                {reactionCounts[reactionOption.type] || 0}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modal to show users who reacted */}
      <Modal
        visible={showReactionUsers}
        animationType="slide"
        onRequestClose={() => setShowReactionUsers(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>Reactions by</ThemedText>

          {/* Reaction Type Filters */}
          <View style={styles.reactionFilters}>
            {reactionsList.map((reactionOption) => (
              <TouchableOpacity
                key={reactionOption.type}
                onPress={() => handleReactSelectionMap(reactionOption.type)}
                style={[
                  styles.reactionFilterButton,
                  selectedReactionType === reactionOption.type && styles.reactionFilterButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={reactionOption.icon}
                  size={20}
                  color={reactionOption.color}
                />
                <ThemedText style={styles.reactionCount}>
                  {reactionCounts[reactionOption.type] || 0}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* List of Users */}
          <FlatList
            data={filteredReactionUsers}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <ThemedText style={styles.userItem}>{item.user_id}</ThemedText>
            )}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>No users for this reaction</ThemedText>
            }
            contentContainerStyle={styles.userList}
          />

          {/* Close Button */}
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
    justifyContent: "space-around",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
  },
  reactionIcon: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
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
  reactionFilters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  reactionFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  reactionFilterButtonActive: {
    backgroundColor: "#555",
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

export default ReactionComponent;