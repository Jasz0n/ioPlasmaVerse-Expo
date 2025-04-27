import React, { FC, useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import PostCard from "./postCard";
import PostCreateComponent from "./sendPost";

interface Post {
  post_id: number;
  user_id: string;
  media_url: string;
  content: string;
  created_at: string;
  contractAddress?: string;
  chainId?: string;
}

const POSTS_PER_PAGE = 20;
const { width, height } = Dimensions.get("window");

const PostFeed: FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const postIds = useRef<Set<number>>(new Set());

  const fetchPosts = async (pageNumber: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      console.log("post");
      const response = await fetch(
        `https://ioplasmaverse.com/api/getPost?page=${pageNumber}&limit=${POSTS_PER_PAGE}`
      );
      const data = await response.json();
      console.log("postdata", data);

      const newPosts = data.posts.filter(
        (post: Post) => !postIds.current.has(post.post_id)
      );
      newPosts.forEach((post: Post) => postIds.current.add(post.post_id));

      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#00C4B4" />
          <ThemedText style={styles.loadingText}>Loading more posts...</ThemedText>
        </View>
      );
    }
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <ThemedText style={styles.endMessage}>No more posts to display</ThemedText>
        </View>
      );
    }
    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <PostCreateComponent />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {posts.map((item) => (
        <PostCard
          key={item.post_id.toString()}
          postId={item.post_id || 0}
          userId={item.user_id || ""}
          mediaUrl={item.media_url || ""}
          content={item.content || ""}
          createdAt={item.created_at || ""}
          contractAddress={item.contractAddress || ""}
          chainId={item.chainId || ""}
        />
      ))}
      {renderFooter()}
      {/* Optional: Trigger load more when reaching the bottom */}
      <View style={styles.loadMoreTrigger} onLayout={handleLoadMore} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#a8dadc",
    marginTop: 8,
  },
  endMessage: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
  },
  loadMoreTrigger: {
    height: 20, // Small height to trigger load more when in view
  },
});

export default PostFeed;