import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { client } from "@/constants/thirdweb";
import { useNavigation } from "@react-navigation/native";
import LikeComponent from "./likePost";
import ReactionComponent from "./postReaction";
import CommentComponent from "./sendComment";
import PostCardComment from "./PostCardComment";
import { UserProfile } from "@/constants/types";
import { resolveScheme } from "thirdweb/storage";
import { useModal } from "@/constants/transactionModalProvider";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { isVideoUrl } from "@/hooks/getAmounts";

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [isContentTruncated, setIsContentTruncated] = useState(false);
  const navigation = useNavigation();
  const { openModal } = useModal();

  // Animation for press effect
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const fetchUserData = async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/user/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      const data: UserProfile = await response.json();
      setUserData(data);
    } catch (err) {
      setUserData(null);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = () => {
    console.log("Edit post clicked for postId:", postId);
    setMenuVisible(false);
  };

  const handleDeletePost = () => {
    console.log("Delete post clicked for postId:", postId);
    setMenuVisible(false);
  };
  const resolvedMediaUrl = resolveScheme({ client, uri: mediaUrl });

  const handleMorePress = () => {
    openModal({
      type: "postCardComment",
      userImage: userData?.image || "",
      postId: postId,
      userId: userId,
      mediaUrl: resolvedMediaUrl,
      content: content,
      createdAt: createdAt,
      contractAddress: contractAddress || "",
      chainId: chainId || "",
    });
  };

  const onTextLayout = (e: any) => {
    setIsContentTruncated(e.nativeEvent.lines.length > 2);
  };
  

  if (isLoading) {
    return (
      <ThemedView >
        <ThemedText >Loading...</ThemedText>
      </ThemedView>
    );
  }

  


  return (
    <ThemedView style={styles.postCard}>
      <View style={styles.header}>
        <Image source={{ uri: userData?.image || defaultPlaceholder }} style={styles.profileImage} />
        <View style={styles.userInfo}>
          <ThemedText style={styles.username}>{userData?.userName || "Unknown User"}</ThemedText>
          <ThemedText style={styles.timestamp}>{new Date(createdAt).toLocaleString()}</ThemedText>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color="#AAA" />
        </TouchableOpacity>
      </View>

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

      <View style={styles.contentContainer}>
        <ThemedText style={styles.content} numberOfLines={2}>{content}</ThemedText>
        <Pressable onPress={handleMorePress}>
          <ThemedText style={styles.moreButton}>...more</ThemedText>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <LikeComponent postId={postId} userId={userId} />
        <ReactionComponent postId={postId} userId={userId} />
        <CommentComponent postId={postId} userId={userId} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  timestamp: {
    fontSize: 12,
    color: "#AAA",
  },
  media: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  content: {
    fontSize: 14,
    color: "#FFF",
    flex: 1,
  },
  moreButton: {
    color: "#00CED1",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});

export default PostCard;