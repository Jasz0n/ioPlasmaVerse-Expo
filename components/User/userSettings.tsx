import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Switch } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { client } from "@/constants/thirdweb";
import { uploadMobile } from "thirdweb/storage";
import DocumentPicker from 'react-native-document-picker';
import { SocialUrl } from "@/constants/types";
import { useUser } from "@/constants/UserProvider";
import { useActiveAccount } from "thirdweb/react";

interface UserProfile {
  name: string;
  info: string;
  location: string;
  receiverAddress: string; // Corrected spelling to match standard convention
  profileImage?: string;
  userId: string;
  isUser: boolean;
  socialUrls?: SocialUrl[];
}

interface BalanceCardProps {
  userData: UserProfile | null;
}

export function UserSettings({ userData }: BalanceCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { expoPushToken } = useUser(); // Get push token from context
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [socialUrls, setSocialUrls] = useState<SocialUrl[]>([
    { name: "Website", url: "" },
    { name: "Telegram", url: "" },
    { name: "X", url: "" },
    { name: "Discord", url: "" },
  ]);
  const [additionalSocialUrls, setAdditionalSocialUrls] = useState<SocialUrl[]>([]);
  const account = useActiveAccount();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [editedData, setEditedData] = useState<UserProfile>({
    name: userData?.name || '',
    info: userData?.info || '',
    location: userData?.location || '',
    receiverAddress: userData?.receiverAddress || account?.address || "",
    userId: userData?.userId || account?.address || "",
    isUser: userData?.isUser ?? true,
    profileImage: userData?.profileImage || undefined,
    socialUrls: userData?.socialUrls || [],
  });

  const toggleNotifications = (value: boolean) => {
    setIsNotificationsEnabled(value);
  };
 
  useEffect(() => {
    if (userData?.profileImage) {
      setProfileImage(userData.profileImage);
    }
    if (userData?.socialUrls && userData.socialUrls.length > 0) {
      const updatedSocialUrls = socialUrls.map((social) => {
        const userSocial = userData.socialUrls?.find((s) => s.name === social.name);
        return userSocial ? { ...social, url: userSocial.url } : social;
      });
      setSocialUrls(updatedSocialUrls);

      const additional = userData.socialUrls.filter(
        (s) => !["Website", "Telegram", "X", "Discord"].includes(s.name)
      );
      setAdditionalSocialUrls(additional);
    }
  }, [userData]);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs (they'll be filtered out)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle changes to social URLs
  const handleSocialUrlChange = (index: number, field: 'name' | 'url', value: string) => {
    if (index < socialUrls.length) {
      const updatedSocialUrls = [...socialUrls];
      updatedSocialUrls[index] = { ...updatedSocialUrls[index], [field]: value };
      setSocialUrls(updatedSocialUrls);
    } else {
      const additionalIndex = index - socialUrls.length;
      const updatedAdditionalSocialUrls = [...additionalSocialUrls];
      updatedAdditionalSocialUrls[additionalIndex] = {
        ...updatedAdditionalSocialUrls[additionalIndex],
        [field]: value,
      };
      setAdditionalSocialUrls(updatedAdditionalSocialUrls);
    }
  };

  // Add a new custom social URL input
  const addSocialUrlInput = () => {
    setAdditionalSocialUrls([...additionalSocialUrls, { name: "", url: "" }]);
  };

  // Save user data to the API
  const saveUserData = async () => {
    if (!account) {
      Alert.alert('Error', 'Account address is missing.');
      return;
    }
    if (!editedData.name || !editedData.info) {
      Alert.alert('Error', `${editedData.isUser ? 'User' : 'Shop'} name and info are required.`);
      return;
    }

    // Validate social URLs
    const allSocialUrls = [
      ...socialUrls.filter((social) => social.url.trim() !== ""),
      ...additionalSocialUrls.filter((social) => social.name.trim() !== "" && social.url.trim() !== ""),
    ];

    for (const social of allSocialUrls) {
      if (!isValidUrl(social.url)) {
        Alert.alert('Error', `Invalid URL for ${social.name}: ${social.url}`);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editedData, profileImage, socialUrls: allSocialUrls }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user data');
      }

      const data = await response.json();
      Alert.alert('Success', data.message || 'Profile saved successfully!');
    } catch (err) {
      setError((err as Error).message);
      Alert.alert('Error', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pick image from gallery and upload to IPFS
  const pickImage = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      const upload = await uploadMobile({
        client,
        files: [
          {
            name: res[0].name || 'profile_image',
            uri: res[0].uri,
            type: res[0].type || 'image/jpeg',
          },
        ],
        uploadWithoutDirectory: true,
      });
      const ipfsUri = upload[0];
      setProfileImage(ipfsUri);
      setEditedData({ ...editedData, profileImage: ipfsUri });
      
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        Alert.alert('Error', 'Failed to upload image to IPFS');
        console.error('IPFS upload error:', err);
      }
    }
  };
 

 

  return (
    <ThemedView style={styles.profileCard}>
      <ThemedText type="subtitle" style={styles.title}>
        {userData ? 'Edit Your Profile' : 'Set Up Your Profile'}
      </ThemedText>

      {/* Switch for User/Shop Toggle */}
      <View style={styles.switchContainer}>
        <ThemedText style={styles.switchLabel}>Shop</ThemedText>
        <Switch
          onValueChange={(value) => setEditedData({ ...editedData, isUser: value })}
          trackColor={{ false: '#444', true: '#fff' }}
          thumbColor={editedData.isUser ? '#007AFF' : '#666'}
          ios_backgroundColor="#444"
          style={styles.switch}
          accessibilityLabel="Toggle between User and Shop"
        />
        <ThemedText style={styles.switchLabel}>User</ThemedText>
      </View>

      {/* Form Fields */}
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEditedData({ ...editedData, name: text })}
        placeholder={editedData.isUser ? "User Name (e.g., John Doe)" : "Shop Name (e.g., John's Store)"}
        placeholderTextColor="#A0A0A0"
        value={editedData.name}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEditedData({ ...editedData, info: text })}
        placeholder={editedData.isUser ? "User Info (e.g., Developer)" : "Shop Info (e.g., Coffee shop in NYC)"}
        placeholderTextColor="#A0A0A0"
        multiline
        value={editedData.info}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEditedData({ ...editedData, location: text })}
        placeholder={editedData.isUser ? "Location (e.g., NYC)" : "Shop Location (e.g., 123 Main St, NYC)"}
        placeholderTextColor="#A0A0A0"
        value={editedData.location}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEditedData({ ...editedData, receiverAddress: text })}
        placeholder="Receiver Address (e.g., 0x123...)"
        placeholderTextColor="#A0A0A0"
        value={editedData.receiverAddress}
      />

      {/* Image Upload */}
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <ThemedText style={styles.imageButtonText}>
          {profileImage ? 'Change Image' : 'Upload Profile Image'}
        </ThemedText>
      </TouchableOpacity>
      {profileImage && (
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      )}

      {/* Social Links Section */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Social Links
      </ThemedText>
      {socialUrls.map((url, index) => (
        <View key={index} style={styles.inputGroup}>
          <ThemedText style={styles.label}>{url.name}</ThemedText>
          <TextInput
            style={styles.input}
            value={url.url}
            onChangeText={(value) => handleSocialUrlChange(index, 'url', value)}
            placeholder={`Enter ${url.name} URL`}
            placeholderTextColor="#A0A0A0"
          />
        </View>
      ))}
      {additionalSocialUrls.map((url, index) => (
        <View key={index + socialUrls.length} style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={url.name}
            onChangeText={(value) => handleSocialUrlChange(index + socialUrls.length, 'name', value)}
            placeholder="Enter Social Platform Name"
            placeholderTextColor="#A0A0A0"
          />
          <TextInput
            style={styles.input}
            value={url.url}
            onChangeText={(value) => handleSocialUrlChange(index + socialUrls.length, 'url', value)}
            placeholder="Enter Social Platform URL"
            placeholderTextColor="#A0A0A0"
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addSocialUrlInput}>
        <ThemedText style={styles.addButtonText}>Add More URLs</ThemedText>
      </TouchableOpacity>


      <View style={styles.switchContainer}>
        <ThemedText style={styles.label}>Enable Notifications</ThemedText>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={toggleNotifications}
        />
      </View>
      {/* Save Button */}
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={saveUserData}
        disabled={isLoading}
      >
        <ThemedText style={styles.actionButtonText}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </ThemedText>
      </TouchableOpacity>

      {/* Error Message */}
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#fff',
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    fontSize: 16,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555',
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#000',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});