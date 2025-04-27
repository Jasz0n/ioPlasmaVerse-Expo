import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Dimensions, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useActiveAccount } from "thirdweb/react";
import NotificationCard from "./notificationCard";

interface Notification {
  notification_id: number;
  user_id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  contract_address?: string;
  universal_id?: string;
  comment_id?: string;
}

const NOTIFICATIONS_PER_PAGE = 20;
const { width, height } = Dimensions.get("window");

const NotificationFeed: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Start as false, load on demand
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const account = useActiveAccount();

  const notificationIds = useRef<Set<number>>(new Set());

  const fetchNotifications = async (pageNumber: number, reset = false) => {
    if (!account?.address) {
      console.error("Account address is undefined. Cannot fetch notifications.");
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching notifications for page: ${pageNumber}`);
      const response = await fetch(
        `https://www.ioplasmaverse.com/api/user/getNotification/${account.address}?page=${pageNumber}&limit=${NOTIFICATIONS_PER_PAGE}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const newNotifications = data.notifications.filter(
        (notification: Notification) =>
          !notificationIds.current.has(notification.notification_id)
      );
      newNotifications.forEach((notification: Notification) =>
        notificationIds.current.add(notification.notification_id)
      );

      setHasMore(data.hasMore); // Use server-provided hasMore
      setNotifications((prevNotifications) =>
        reset ? newNotifications : [...prevNotifications, ...newNotifications]
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial notifications only when account changes
  useEffect(() => {
    if (account?.address) {
      setPage(1); // Reset page
      notificationIds.current.clear(); // Clear seen IDs
      setNotifications([]); // Clear existing notifications
      fetchNotifications(1, true); // Fetch page 1, reset list
    }
  }, [account]);

  // Load more notifications manually
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#00C4B4" />
          <ThemedText style={styles.loadingText}>
            Loading more notifications...
          </ThemedText>
        </View>
      );
    }
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <ThemedText style={styles.endMessage}>
            No more notifications to display
          </ThemedText>
        </View>
      );
    }
    return (
      <ThemedText style={styles.loadMoreText} onPress={handleLoadMore}>
        Load More
      </ThemedText>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Check out your Notifications</ThemedText>
      {notifications.length === 0 && !loading ? (
        <ThemedText style={styles.noNotifications}>No notifications yet</ThemedText>
      ) : (
        <>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.notification_id.toString()}
              notification={notification}
            />
          ))}
          {renderFooter()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A", // Dark background to match your theme
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    paddingVertical: 16,
  },
  noNotifications: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
    padding: 20,
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
  loadMoreText: {
    fontSize: 16,
    color: "#00C4B4",
    textAlign: "center",
    paddingVertical: 10,
  },
});

export default NotificationFeed;