import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { uploadMobile } from "thirdweb/storage"; // Use uploadMobile for IPFS upload
import { useActiveAccount } from "thirdweb/react";

import DocumentPicker from "react-native-document-picker"; // For picking images and videos
import { client } from "@/constants/thirdweb";

// Interface for props
interface CommentProps {
  postId: number;
  userId: string;
}

// Interface for media files
interface MediaFile {
  uri: string;
  type: "image" | "video";
  name: string;
  mimeType: string;
}

interface CommentData {
  content: string;
  mediaUrl?: string;
  post_id: number;
  user_id: string;
}

const CommentComponent: React.FC<CommentProps> = ({ postId, userId }) => {
  const [content, setContent] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const account = useActiveAccount();

  // Handle picking an image
  const pickImage = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      setMediaFiles([
        ...mediaFiles,
        {
          uri: res[0].uri,
          type: "image",
          name: res[0].name || `image_${Date.now()}`,
          mimeType: res[0].type || "image/jpeg",
        },
      ]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User cancelled the image picker");
      } else {
        Alert.alert("Error", "Failed to pick image");
        console.error("Image pick error:", err);
      }
    }
  };

  // Handle picking a video
  const pickVideo = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
      });
      setMediaFiles([
        ...mediaFiles,
        {
          uri: res[0].uri,
          type: "video",
          name: res[0].name || `video_${Date.now()}`,
          mimeType: res[0].type || "video/mp4",
        },
      ]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User cancelled the video picker");
      } else {
        Alert.alert("Error", "Failed to pick video");
        console.error("Video pick error:", err);
      }
    }
  };

  // Handle uploading media to Thirdweb storage using uploadMobile
  const handleUpload = async (file: MediaFile) => {
    try {
      const upload = await uploadMobile({
        client,
        files: [
          {
            name: file.name,
            uri: file.uri,
            type: file.mimeType,
          },
        ],
        uploadWithoutDirectory: true,
      });
      const ipfsUri = upload[0];
      return ipfsUri;
    } catch (error) {
      console.error("Error uploading media to IPFS:", error);
      throw error;
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    
    setLoading(true);
    try {
      const mediaUris = await Promise.all(mediaFiles.map((file) => handleUpload(file)));
      const commentData: CommentData = {
        content,
        mediaUrl: mediaUris[0], // Assuming a single media file; adjust if multiple
        post_id: postId,
        user_id: account?.address || "",
      };

      const response = await fetch("https://www.ioplasmaverse.com/api/comment/createComment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      const result = await response.json();
      if (result.success) {
        console.log("Comment created successfully:", result.comment);
        setContent("");
        setMediaFiles([]);
        sendNotification();
      } else {
        console.error("Failed to create comment:", result.error);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to submit comment");
    } finally {
      setLoading(false);
    }
  };

  // Send notification when the comment is created
  const sendNotification = async () => {
    try {
      const notificationData = {
        user_id: userId,
        type: "comment",
        message: `@${account?.address} made a comment on your post #${postId}.`,
      };

      console.log("Sending notificationData:", notificationData);

      const response = await fetch("https://www.ioplasmaverse.com/api/sendNotification", {
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

  // Determine button text based on state
  const getButtonText = () => {
    if (!account) return "Connect Wallet";
  };

  // Determine if the button should be disabled
  const isButtonDisabled = () => {
    return loading || (!content && mediaFiles.length === 0);
  };

  return (
    <ThemedView>
      {/* Button to Open Comment Modal */}
      <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.commentButton}>
        <MaterialCommunityIcons name="comment-outline" size={24} color="#A0A0A0" />
      </TouchableOpacity>

      {/* Modal for Adding a Comment */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedText style={styles.modalTitle}>Add a Comment</ThemedText>

          {/* Text Input for Comment Content */}
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor="#A0A0A0"
            value={content}
            onChangeText={setContent}
            style={styles.textField}
            multiline
            numberOfLines={3}
          />

          {/* Media Buttons */}
          <View style={styles.mediaButtons}>
            <TouchableOpacity onPress={pickImage} style={styles.mediaButton}>
              <MaterialCommunityIcons name="image" size={24} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={styles.mediaButton}>
              <MaterialCommunityIcons name="video" size={24} color="blue" />
            </TouchableOpacity>
          </View>

          {/* Display Selected Media */}
          {mediaFiles.length > 0 && (
            <View style={styles.mediaPreview}>
              <ThemedText style={styles.mediaPreviewText}>
                {mediaFiles.length} media file(s) selected
              </ThemedText>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleCommentSubmit}
            disabled={isButtonDisabled()}
            style={[
              styles.submitButton,
              isButtonDisabled() && styles.submitButtonDisabled,
            ]}
          >
            <ThemedText style={styles.submitButtonText}>{getButtonText()}</ThemedText>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setIsModalOpen(false)}
            style={styles.closeButton}
          >
            <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  commentButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 20,
  },
  textField: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    textAlignVertical: "top",
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  mediaButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  mediaPreview: {
    marginBottom: 20,
  },
  mediaPreviewText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default CommentComponent;