import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have a themed text component
import { ThemedView } from "@/components/ThemedView"; // Assuming you have a themed view component
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using @expo/vector-icons
import { uploadMobile } from "thirdweb/storage"; // Use uploadMobile for IPFS upload
import { useActiveAccount } from "thirdweb/react";

import DocumentPicker from "react-native-document-picker"; // For picking images and videos
import { client } from "@/constants/thirdweb";

// Interface for media files
interface MediaFile {
  uri: string;
  type: "image" | "video";
  name: string;
  mimeType: string;
}

interface PostData {
  userId: string;
  content: string;
  mediaUrl?: string;
  visibility: string;
  isPinned: boolean;
}

interface Post {
  post_id: number;
  user_id: string;
  content: string;
  media_url: string;
  created_at: string;
  updated_at: string;
  visibility: string;
  is_pinned: boolean;
}

const PostCreateComponent: React.FC = () => {
  const [content, setContent] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const account = useActiveAccount();
  const [posts, setPosts] = useState<Post[]>([]); // Not used in the current implementation

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

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!account) {
      console.error("No account connected.");
      return;
    }

    

    setLoading(true);
    try {
      const mediaUris = await Promise.all(mediaFiles.map((file) => handleUpload(file)));
      const postData: PostData = {
        userId: account.address,
        content,
        mediaUrl: mediaUris[0], // Assuming a single media file; adjust if multiple
        visibility: "public",
        isPinned: false,
      };

      const response = await fetch("https://www.ioplasmaverse.com/api/post/createPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      if (result.success) {
        console.log("Post created successfully:", result.row);
        setContent("");
        setMediaFiles([]);
      } else {
        console.error("Failed to create post:", result.error);
        Alert.alert("Error", "Failed to create post");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      Alert.alert("Error", "Error submitting post");
    } finally {
      setLoading(false);
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
    <ThemedView style={styles.postContainer}>
      <ThemedText style={styles.title}>Create a Post</ThemedText>

      {/* Text Input for Post Content */}
      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor="#A0A0A0"
        value={content}
        onChangeText={setContent}
        style={styles.textField}
        multiline
        numberOfLines={3}
      />

      {/* Controls (Media Buttons and Post Button) */}
      <View style={styles.controls}>
        <View style={styles.mediaButtons}>
          <TouchableOpacity onPress={pickImage} style={styles.mediaButton}>
            <MaterialCommunityIcons name="image" size={24} color="blue" />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickVideo} style={styles.mediaButton}>
            <MaterialCommunityIcons name="video" size={24} color="blue" />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handlePostSubmit}
          disabled={isButtonDisabled()}
          style={[styles.submitButton, isButtonDisabled() && styles.submitButtonDisabled]}
        >
          <ThemedText style={styles.submitButtonText}>{getButtonText()}</ThemedText>
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
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
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
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mediaButtons: {
    flexDirection: "row",
    gap: 10,
  },
  mediaButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
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
  mediaPreview: {
    marginTop: 10,
  },
  mediaPreviewText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
});

export default PostCreateComponent;