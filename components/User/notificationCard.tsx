import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a ThemedText component
import { useActiveAccount } from "thirdweb/react";
import { ModalData, useModal } from "@/constants/transactionModalProvider";

// Placeholder for UserCard (convert this separately if needed)
const UserCard = ({ onClose, ownerAddress }: { onClose: () => void; ownerAddress: string }) => (
  <Modal visible={true} animationType="slide" transparent={false}>
    <View style={styles.modalContainer}>
      <ThemedText style={styles.modalTitle}>User Profile</ThemedText>
      <ThemedText>Owner Address: {ownerAddress}</ThemedText>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
      </TouchableOpacity>
    </View>
  </Modal>
);

interface NotificationProps {
  notification: {
    notification_id: number;
    user_id: string;
    type: string;
    message: string;
    created_at: string;
    is_read: boolean;
    comment_id?: string;
    universal_id?: string;
    contract_address?: string;
  };
}

const NotificationCard: React.FC<NotificationProps> = ({ notification }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [mentionId, setMentionId] = useState<string>("");
  const account = useActiveAccount();
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined);
  const { openModal } = useModal();

  const extractMentionedUser = (message: string): string | null => {
    const match = message.match(/@([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleNotivicationData = useCallback(
    async (message: string) => {
      try {
        if (notification.type === "likePost") {
        } else if (notification.type === "BuyNft") {
        }
      } catch (error) {
        console.error("Error handling notification data:", error);
      }
    },
    [notification.type, openModal]
  );

  const handleFetchUserData = useCallback(
    async (message: string) => {
      try {
        const mention = extractMentionedUser(message);
        if (!mention) return;

        console.log("Extracted mention:", mention);
        setMentionId(mention);

        // Placeholder for fetchUserProfile and fetchUserName
        // Replace with actual API calls or contract reads if needed
        // await Promise.all([
        //   fetchUserProfile(mention.toString(), AppMint),
        //   fetchUserName(mention.toString(), ChattApp),
        // ]);
        setUserName(mention); // Mocked for now
        setOwnedNftsProfile({ image: null }); // Mocked for now
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (notification) {
      handleFetchUserData(notification.message);
    }
  }, [notification, handleFetchUserData]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleNotivicationData(notification.message)}
      activeOpacity={0.8}
    >
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={() => setModalOpen(true)}>
        
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: notification.is_read ? "#555" : "#007AFF" }]}>
              <ThemedText style={styles.badgeText}>{notification.type}</ThemedText>
            </View>
            <ThemedText style={styles.timestamp}>
              {new Date(notification.created_at).toLocaleString()}
            </ThemedText>
          </View>
          <ThemedText style={styles.content}>
            {notification.message.replace(
              `@${mentionId}`,
              `@${userName || mentionId}`
            )}
          </ThemedText>
        </View>
      </View>

      {modalOpen && (
        <UserCard onClose={() => setModalOpen(false)} ownerAddress={mentionId} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  topContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  content: {
    fontSize: 14,
    color: "#f5f5f5",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 24,
    color: "#a8dadc",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default NotificationCard;