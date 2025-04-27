import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useSocialProfiles } from "thirdweb/react";
import { ThirdwebClient } from "thirdweb";
import { resolveScheme } from "thirdweb/storage";
import { SocialProfile } from "thirdweb/social";
import { ThemedView } from "../ThemedView";

interface SocialProfileCardProps {
  address: string | undefined;
  client: ThirdwebClient;
}

export function SocialProfilesList({
  client,
  address,
}: SocialProfileCardProps) {
  const profiles = useSocialProfiles({
    client,
    address,
  });

  if (profiles.isLoading) {
    return <ThemedText type="default" style={styles.loadingText}>Loading...</ThemedText>;
  }

  return profiles.data?.length ? (
    profiles.data?.map((profile) => (
      <SocialProfileCard
        profile={profile}
        client={client}
        key={profile.type + profile.name}
      />
    ))
  ) : (
    <ThemedText type="default" style={styles.noProfilesText}>
      No social profiles found
    </ThemedText>
  );
}

export function SocialProfileCard({
  profile,
  client,
}: {
  profile: SocialProfile | undefined;
  client: ThirdwebClient;
}) {
  if (!profile) return null;

  return (
    <ThemedView style={styles.card}>
      <View style={styles.contentContainer}>
        {profile.avatar && (
          <Image
            source={{ uri: resolveScheme({ client, uri: profile.avatar }) }}
            style={styles.avatar}
          />
        )}
        <View style={styles.tableContainer}>
          <ThemedText type="defaultSemiBold" style={styles.profileName}>
            {profile.name}
          </ThemedText>
          <ThemedText type="default" style={styles.profileBio}>
            {profile.bio || "-"}
          </ThemedText>
          <ThemedText type="subtext" style={styles.profileType}>
            {profile.type}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', // Match BalanceCardErc20 background
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333', // Subtle border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#555', // Subtle border to match token image in BalanceCardErc20
  },
  tableContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4, // Add spacing between text elements
  },
  profileName: {
    fontSize: 16, // Match BalanceCardErc20 tokenName
    color: '#fff', // White text for primary elements
  },
  profileBio: {
    fontSize: 14, // Match BalanceCardErc20 contractAddress
    color: '#A0A0A0', // Light gray for secondary text
  },
  profileType: {
    fontSize: 14, // Match BalanceCardErc20 balanceText
    color: '#A0A0A0', // Light gray for secondary text
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0A0', // Light gray for loading state
    textAlign: 'center',
    marginVertical: 16,
  },
  noProfilesText: {
    fontSize: 16,
    color: '#A0A0A0', // Light gray for empty state
    textAlign: 'center',
    marginVertical: 16,
  },
});