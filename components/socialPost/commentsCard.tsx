import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/constants/thirdweb"; // Assuming you have a thirdweb client
import LikeCommentComponent from "./likeComment";
import ReactionCommentComponent from "./commentReaction";
import { UserProfile } from "@/constants/types";
import { resolveScheme } from "thirdweb/storage";
import { isVideoUrl } from "@/hooks/getAmounts";

// Interface for props
interface CommentProps {
  commentId: number;
  postId: number;
  userId: string;
  mediaUrl?: string;
  content: string;
  createdAt: string;
}

const CommentCard: React.FC<CommentProps> = ({
  commentId,
  postId,
  userId,
  mediaUrl,
  content,
  createdAt,
}) => {
  const [userName, setUserName] = useState<string>("Unknown user");
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
  
// Placeholder for fetching user info (you'll need to implement this)
  useEffect(() => {
      if (userId) {
        fetchUserData(userId);
      }
    }, [userId]);
  
    // Fetch user data from API
    const fetchUserData = async (address: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://ioplasmaverse.com/api/user/${address}`);
        if (!response.ok) {
          if (response.status === 404) {
            setUserData(null); // No data found
          } else {
            throw new Error('Failed to fetch user data');
          }
        } else {
          const data: UserProfile = await response.json();
          setUserData(data);
        }
      } catch (err) {
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };
  
  // Placeholder for fetching user info (you'll need to implement this)
  

  

  
  // Placeholder for edit comment action
  const handleEditComment = () => {
    console.log("Edit comment clicked for commentId:", commentId);
    setMenuVisible(false);
    // Implement edit functionality
  };
  

  // Placeholder for delete comment action
  const handleDeleteComment = () => {
    console.log("Delete comment clicked for commentId:", commentId);
    setMenuVisible(false);
    // Implement delete functionality
  };
  
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.commentCard}>
      {/* Profile and Menu Section */}
      <View style={styles.topContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
        
          <View>
            <ThemedText style={styles.username}>{attributes?.userName || "Unknown user"}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {new Date(createdAt).toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {/* Menu Button */}
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-vertical" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>

      {/* Media Content for Comment */}
      {mediaUrl && (
                isVideoUrl(mediaUrl) ? (
                 <View></View>
                ) : (
                  <Image
                    source={{ uri: resolveScheme({ client, uri: mediaUrl }) }}
                    style={styles.media}
                    resizeMode="cover"
                  />
                )
              )}

      {/* Comment Content */}
      <ThemedText style={styles.content}>{content}</ThemedText>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <LikeCommentComponent commentId={commentId} postId={postId} userId={userId} />
        <ReactionCommentComponent commentId={commentId} userId={userId} />
      </View>

      {/* Custom Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <ThemedView style={styles.menuOverlay}>
          <ThemedView style={styles.menuContainer}>
            <TouchableOpacity onPress={handleEditComment} style={styles.menuItem}>
              <ThemedText style={styles.menuText}>Edit comment</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteComment} style={styles.menuItem}>
              <ThemedText style={[styles.menuText, styles.deleteText]}>Delete Comment</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.menuItem}>
              <ThemedText style={styles.menuText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  commentCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderImage: {
    width: "100%",
    height: 1,
    
    backgroundColor: "#555",
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  timestamp: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  menuButton: {
    padding: 8,
  },
  media: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#333",
    borderRadius: 8,
    width: width * 0.6,
    padding: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  menuText: {
    fontSize: 16,
    color: "#fff",
  },
  deleteText: {
    color: "#FF4444",
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
});

export default CommentCard;