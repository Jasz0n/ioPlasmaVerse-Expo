// components/SaveNFTContract.tsx
import React, { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { client } from "@/constants/thirdweb";
import { uploadMobile } from "thirdweb/storage";
import DocumentPicker from 'react-native-document-picker';

type SocialUrls = {
  x?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  github?: string;
};

export type NftContract = {
  address: string;
  chainId: number;
  type: "ERC1155" | "ERC721" | "Marketplace" | "ERC20";
  typeBase: "DefaultNFT";
  title?: string;
  description?: string;
  thumbnailUrl: string;
  explorer?: string;
  social_urls?: SocialUrls;
};

type SocialUrlInput = {
  name: string;
  url: string;
};

export function SaveNFTContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [contractData, setContractData] = useState<NftContract>({
    address: "",
    chainId: 0,
    type: "ERC721", // Default value
    typeBase: "DefaultNFT",
    thumbnailUrl: "",
  });
  const [socialUrls, setSocialUrls] = useState<SocialUrlInput[]>([
    { name: "Website", url: "" },
    { name: "Telegram", url: "" },
    { name: "X", url: "" },
    { name: "Discord", url: "" },
    { name: "Github", url: "" },
  ]);
  const [additionalSocialUrls, setAdditionalSocialUrls] = useState<SocialUrlInput[]>([]);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
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
            name: res[0].name || 'thumbnail_image',
            uri: res[0].uri,
            type: res[0].type || 'image/jpeg',
          },
        ],
        uploadWithoutDirectory: true,
      });
      const ipfsUri = upload[0];
      setThumbnailUrl(ipfsUri);
      setContractData({ ...contractData, thumbnailUrl: ipfsUri });
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        Alert.alert('Error', 'Failed to upload image to IPFS');
        console.error('IPFS upload error:', err);
      }
    }
  };

  // Save NFT contract data to the API
  const saveContractData = async () => {
    // Validation
    if (!contractData.address) {
      Alert.alert('Error', 'Contract address is required.');
      return;
    }
    if (!contractData.chainId) {
      Alert.alert('Error', 'Chain ID is required.');
      return;
    }

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

    const social_urls: SocialUrls = {};
    allSocialUrls.forEach((social) => {
      social_urls[social.name.toLowerCase() as keyof SocialUrls] = social.url;
    });

    const payload: NftContract = {
      ...contractData,
      social_urls: Object.keys(social_urls).length > 0 ? social_urls : undefined,
    };

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://www.ioplasmaverse.com/api/nft/saveContract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save NFT contract');
      }

      const data = await response.json();
      Alert.alert('Success', data.message || 'NFT contract saved successfully!');
      // Reset form after success (optional)
      setContractData({ address: "", chainId: 0, type: "ERC721", typeBase: "DefaultNFT", thumbnailUrl: "" });
      setThumbnailUrl(null);
      setSocialUrls(socialUrls.map((social) => ({ ...social, url: "" })));
      setAdditionalSocialUrls([]);
    } catch (err) {
      setError((err as Error).message);
      Alert.alert('Error', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Save NFT Contract
      </ThemedText>

      {/* Form Fields */}
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, address: text })}
        placeholder="Contract Address (e.g., 0x123...)"
        placeholderTextColor="#A0A0A0"
        value={contractData.address}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, chainId: parseInt(text) || 0 })}
        placeholder="Chain ID (e.g., 4689)"
        placeholderTextColor="#A0A0A0"
        keyboardType="numeric"
        value={contractData.chainId.toString()}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, title: text })}
        placeholder="Title (e.g., MachinFi - NFT)"
        placeholderTextColor="#A0A0A0"
        value={contractData.title}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, description: text })}
        placeholder="Description"
        placeholderTextColor="#A0A0A0"
        multiline
        value={contractData.description}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, explorer: text })}
        placeholder="Explorer URL (e.g., https://iotexscan.io/...)"
        placeholderTextColor="#A0A0A0"
        value={contractData.explorer}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setContractData({ ...contractData, type: text as any })}
        placeholder="Type (ERC1155, ERC721, Marketplace, ERC20)"
        placeholderTextColor="#A0A0A0"
        value={contractData.type}
      />

      {/* Image Upload */}
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <ThemedText style={styles.imageButtonText}>
          {thumbnailUrl ? 'Change Thumbnail' : 'Upload Thumbnail'}
        </ThemedText>
      </TouchableOpacity>
      {thumbnailUrl && (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
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

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={saveContractData}
        disabled={isLoading}
      >
        <ThemedText style={styles.actionButtonText}>
          {isLoading ? 'Saving...' : 'Save NFT Contract'}
        </ThemedText>
      </TouchableOpacity>

      {/* Error Message */}
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  thumbnailImage: {
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