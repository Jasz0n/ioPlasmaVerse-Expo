import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/constants/thirdweb"; // Assuming you have a thirdweb client
import { useNavigation } from "@react-navigation/native"; // For navigation
import LikeComponent from "./likePost";
import ReactionComponent from "./postReaction";
import CommentComponent from "./sendComment";
import PostCardComment from "./PostCardComment";
import { UserProfile } from "@/constants/types";
import { resolveScheme } from "thirdweb/storage";

// Interface for props
interface PostProps {
  postId: number;
  userId: string;
  mediaUrl: string;
  content: string;
  createdAt: string;
  contractAddress?: string;
  chainId?: string;
}

const PostCard: React.FC<PostProps> = ({
  postId,
  userId,
  mediaUrl,
  content,
  createdAt,
  contractAddress,
  chainId,
}) => {
  const defaultPlaceholder = "https://avatarfiles.alphacoders.com/161/161002.jpg";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation(); // Hook for navigation
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
      setError(null);
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
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
  

  // Placeholder for edit post action
  const handleEditPost = () => {
    console.log("Edit post clicked for postId:", postId);
    setMenuVisible(false);
    // Implement edit functionality
  };

  // Placeholder for delete post action
  const handleDeletePost = () => {
    console.log("Delete post clicked for postId:", postId);
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

  if (error) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.postCard}>
      {/* Top Section with Profile, Username, Timestamp, and Menu */}
      <View style={styles.topContainer}>
        {/* Profile Section */}
        {userData?.image ? (
            <Image
            source={{
              uri: `${resolveScheme({
                client,
                uri: userData.image,
              })}`,
            }}
            resizeMode="contain"
          />
          ) : (
            <View style={styles.placeholderImage} />
          )}
          <View>
            <ThemedText style={styles.username}>{attributes?.userName || "Unknown user"}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {new Date(createdAt).toLocaleString()}
            </ThemedText>
          </View>

        {/* Menu Button */}
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-vertical" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      {mediaUrl && (
        <Image
        source={{
          uri: `${resolveScheme({
            client,
            uri: mediaUrl,
          })}`,
        }}
        resizeMode="contain"
      />
      )}

      {/* Post Content */}
      <ThemedText style={styles.content}>{content}</ThemedText>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <LikeComponent postId={postId} userId={userId.toLowerCase()} />
        <ReactionComponent postId={postId} userId={userId.toLowerCase()} />
        <CommentComponent postId={postId} userId={userId.toLowerCase()} />
        <PostCardComment
        userImage={userData.image}
          postId={postId}
          userId={userId}
          mediaUrl={mediaUrl}
          content={content}
          createdAt={createdAt}
          contractAddress={contractAddress}
          chainId={chainId}
        />
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
            <TouchableOpacity onPress={handleEditPost} style={styles.menuItem}>
              <ThemedText style={styles.menuText}>Edit Post</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePost} style={styles.menuItem}>
              <ThemedText style={[styles.menuText, styles.deleteText]}>Delete Post</ThemedText>
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
  postCard: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 8,
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
  errorText: {
    fontSize: 14,
    color: "#FF4444",
  },
});

export default PostCard;