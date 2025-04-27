import React, { FC, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommentCard from "./commentsCard";
import CommentComponent from "./sendComment";
import ReactionComponent from "./postReaction";
import LikeComponent from "./likePost";
import { resolveScheme } from "thirdweb/storage";
import { client } from "@/constants/thirdweb";
import Video from "react-native-video";
import { isVideoUrl } from "@/hooks/getAmounts";

const { height } = Dimensions.get("window");

interface PostProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  userId: string;
  mediaUrl: string;
  content: string;
  createdAt: string;
  userImage?: string;
}

interface Comment {
  comment_id: number;
  post_id: number;
  user_id: string;
  media_url: string;
  content: string;
  created_at: string;
}

const COMMENTS_PER_PAGE = 20;

const PostCardComment: FC<PostProps> = ({
  isOpen,
  onClose,
  postId,
  userId,
  mediaUrl,
  content,
  createdAt,
  userImage,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const commentsIds = new Set<number>();

  const fetchComments = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.ioplasmaverse.com/api/socialPost/post/${postId}/getComments?page=${pageNumber}&limit=${COMMENTS_PER_PAGE}`
      );
      const data = await response.json();
      const newComments = data.comments.filter(
        (comment: Comment) => !commentsIds.has(comment.comment_id)
      );
      newComments.forEach((comment: Comment) => commentsIds.add(comment.comment_id));
      setComments((prevComments) => [...prevComments, ...newComments]);
      setHasMore(newComments.length >= COMMENTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments(page);
    }
  }, [postId, page]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    setPage((prevPage) => prevPage + 1);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View>
    <CommentCard
      commentId={item.comment_id}
      postId={item.post_id}
      userId={item.user_id}
      mediaUrl={item.media_url || undefined}
      content={item.content}
      createdAt={item.created_at}
    />
    </View>
   
  );

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
      <ThemedView style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.modalContent}>
            {/* Post Card */}
            <ThemedView style={styles.postCard}>
              <View style={styles.topContainer}>
                <View>
                  <ThemedText style={styles.username}>{userId}</ThemedText>
                  <ThemedText style={styles.timestamp}>
                    {new Date(createdAt).toLocaleString()}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => setMenuVisible(true)}
                  style={styles.menuButton}
                >
                  <MaterialCommunityIcons name="dots-vertical" size={18} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              {mediaUrl && (
                isVideoUrl(mediaUrl) ? (
                  <Video
                    source={{ uri: resolveScheme({ client, uri: mediaUrl }) }}
                    style={styles.media}
                    controls={true} // Adds play/pause controls
                    resizeMode="cover"
                    muted={false} // Set to true if you want it muted by default
                    paused={true} // Starts paused; user must press play
                  />
                ) : (
                  <Image
                    source={{ uri: resolveScheme({ client, uri: mediaUrl }) }}
                    style={styles.media}
                    resizeMode="cover"
                  />
                )
              )}

              <ThemedText style={styles.content}>{content}</ThemedText>
              <View style={styles.divider} />
              <View style={styles.actions}>
                <LikeComponent postId={postId} userId={userId} />
                <ReactionComponent postId={postId} userId={userId} />
                <CommentComponent postId={postId} userId={userId} />
              </View>
            </ThemedView>

            {/* Comments Section */}
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.comment_id.toString()}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              style={styles.commentsContainer}
              scrollEnabled={false} // Disable FlatList scrolling, let ScrollView handle it
            />

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "#1A1A1A" },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  modalContent: { flex: 1, padding: 20 },
  postCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  username: { fontSize: 16, fontWeight: "600", color: "#fff" },
  timestamp: { fontSize: 12, color: "#A0A0A0" },
  menuButton: { padding: 8 },
  media: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: { fontSize: 14, color: "#fff", marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#444", marginVertical: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentsContainer: { maxHeight: height * 0.4 }, // Limit FlatList height
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});

export default PostCardComment;