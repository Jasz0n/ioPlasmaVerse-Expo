import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Clipboard, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { resolveScheme } from "thirdweb/storage";
import { client } from "@/constants/thirdweb";
import { Ionicons } from '@expo/vector-icons';

interface BalanceCardProps {
  userData: {
    name: string;
    shop_info: string;
    shop_location: string;
    reciever_address: string; // Fixed typo
    profile_image?: string;
  };
}

export function UserData({ userData }: BalanceCardProps) {
  // Function to truncate the address for display
  const truncateAddress = (address: string, startLen: number = 6, endLen: number = 4) => {
    if (address.length <= startLen + endLen) return address;
    return `${address.slice(0, startLen)}...${address.slice(-endLen)}`;
  };

  // Function to copy the address to clipboard
  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", "Receiver address has been copied to clipboard.");
  };

  return (
    <ThemedView style={styles.profileCard}>
      <ThemedText type="subtitle" style={styles.title}>
        Profile Details
      </ThemedText>

      {/* Profile Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>Name:</ThemedText>
          <ThemedText style={styles.value}>{userData.name}</ThemedText>
        </View>
       
        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>Shop Location:</ThemedText>
          <ThemedText style={styles.value}>{userData.shop_location}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>Receiver Address:</ThemedText>
          {userData && userData.reciever_address && (
          <View style={styles.addressContainer}>
           
            <ThemedText style={styles.value}>
              {truncateAddress(userData.reciever_address)}
            </ThemedText>
            <TouchableOpacity
              onPress={() => copyToClipboard(userData.reciever_address)}
              accessibilityLabel="Copy receiver address"
            >
              <Ionicons name="copy-outline" size={18} color="#007AFF" style={styles.copyIcon} />
            </TouchableOpacity>
            
          </View>
          )}
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>Shop Info:</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>{userData.shop_info}</ThemedText>
        </View>
      </View>

      {/* Profile Image (Membership Card Style) */}
      {userData.profile_image && (
        <View style={styles.imageContainer}>
          <Image
            style={styles.profileImage}
            source={{
              uri: `${resolveScheme({
                client,
                uri: userData.profile_image.toString() || "",
              })}`,
            }}
            resizeMode="contain"
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#1A1A1A', // Dark background to match the dApp theme
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333', // Subtle border for depth
  },
  title: {
    color: '#fff', // White text for contrast
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#A0A0A0', // Light gray for labels
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#fff', // White for values
    flex: 1,
    textAlign: 'right',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyIcon: {
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  profileImage: {
    width: 200, // Reduced size for better fit
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555', // Subtle border around the image
    backgroundColor: '#000', // Black background for the image
  },
});