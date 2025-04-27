import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { ParallaxScrollView } from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { client } from '@/constants/thirdweb';

import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import PaymentsScreen from '@/components/Token/renterPayments';
import { SocialProfilesList } from '@/components/User/SocialProfileCard';
import { UserData } from '@/components/User/userData';
import { UserSettings } from '@/components/User/userSettings';
import UserWalletManager from '@/components/User/wallet';
import { useActiveAccount } from 'thirdweb/react';

// Define the shape of the user profile data
interface UserProfile {
  name: string;
  shopInfo: string;
  shopLocation: string;
  recieverAddress: string;
  profileImage?: string;
  shopId: string;
}

// Define the possible tabs
type TabType = 'userData' | 'userSettings' | 'userPayments' | 'userWallet' | 'userSocial';

// Define the specific icon names used
type IconName =
  | 'person-outline'
  | 'settings-outline'
  | 'cash-outline'
  | 'wallet-outline'
  | 'share-social-outline';

export default function UserProfileManager() {
  const account = useActiveAccount(); // Hardcoded for testing
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('userData');

  // Animation value for tab content transition
  const opacity = useSharedValue(1);

  // Fetch user data when account address changes
  useEffect(() => {
    if (account) {
      fetchUserData(account.address);
    }
  }, [account]);

  // Fetch user data from API
  const fetchUserData = async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://ioplasmaverse.com/api/user/${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          setUserData(null); // No data found
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        const data: UserProfile = await response.json();
        setUserData(data);
      }
    } catch (err) {
      setUserData(null);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change with animation
  const handleTabChange = (newTab: TabType) => {
    opacity.value = 0; // Fade out
    setTimeout(() => {
      setTab(newTab);
      opacity.value = withTiming(1, { duration: 300 }); // Fade in
    }, 150);
  };

  // Animated style for tab content
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Define the tabs with labels and icons
  const tabs: { id: TabType; label: string; icon: IconName }[] = [
    { id: 'userData', label: 'Profile', icon: 'person-outline' },
    { id: 'userSettings', label: 'Settings', icon: 'settings-outline' },
    { id: 'userPayments', label: 'Payments', icon: 'cash-outline' },
    { id: 'userWallet', label: 'Wallet', icon: 'wallet-outline' },
    { id: 'userSocial', label: 'Social', icon: 'share-social-outline' },
  ];

  // Render logic
  if (!account) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={<Image source={require('@/assets/images/title.png')} style={styles.headerImage} />}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">User Profile</ThemedText>
        </ThemedView>
        <ThemedView style={styles.contentContainer}>
          <ThemedText>Please connect your wallet to view or set up your profile.</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image source={require('@/assets/images/title.png')} style={styles.headerImage} />}
    >
      {/* Title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.title} type="title">User Profile</ThemedText>
      </ThemedView>

      {/* Tab Bar */}
      <ThemedView style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {tabs.map((tabItem) => (
            <TouchableOpacity
              key={tabItem.id}
              style={[styles.tabButton, tab === tabItem.id && styles.tabButtonActive]}
              onPress={() => handleTabChange(tabItem.id)}
              accessibilityLabel={`Switch to ${tabItem.label} tab`}
            >
              <Ionicons
                name={tabItem.icon}
                size={20}
                color={tab === tabItem.id ? '#007AFF' : '#666'}
                style={styles.tabIcon}
              />
              
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Tab Content with Animation */}
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        {tab === 'userSettings' ? (
          <UserSettings userData={userData} />
        ) : tab === 'userData' && userData ? (
          <UserData userData={userData} />
        ) : tab === 'userSocial' ? (
          <SocialProfilesList address={account.address} client={client} />
        
        ) : tab === 'userPayments' ? (
          <PaymentsScreen />
        ) : (
          // No data found
          <ThemedView style={styles.noDataContainer}>
            <ThemedText type="subtitle" style={styles.noDataText}>
              No Profile Data Found
            </ThemedText>
            <ThemedText style={styles.noDataText}>
              It looks like you haven’t set up your profile yet. Click below to get started!
            </ThemedText>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleTabChange('userSettings')}
              accessibilityLabel="Set up profile"
            >
              <ThemedText style={styles.actionButtonText}>Set Up Profile</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </Animated.View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: '100%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#ffff",
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#E6F0FA',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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