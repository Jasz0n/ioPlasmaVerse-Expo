// app/(tabs)/_layout.tsx
import { Tabs, useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

// Define the specific icon names you're using
type IconName = "image" | "cart" | "compass" | "cube";

interface Props {
  tokenId: string;
  chainId: string;
  contractAddress: string;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chainId, contractAddress, tokenId } = params;

  // Fallback values if params are missing
  const defaultChainId = chainId || "1";
  const defaultContractAddress = contractAddress || "0xDefaultAddress";
  const defaultTokenId = tokenId || "1";

  // Log params for debugging
  useEffect(() => {
    console.log("TabLayout params:", { chainId, contractAddress, tokenId });
  }, [chainId, contractAddress, tokenId]);

  const tabParams = {
    chainId: defaultChainId.toString(),
    contractAddress: defaultContractAddress.toString(),
    tokenId: defaultTokenId.toString(),
  };

  const tabParams2 = {
    chainId: defaultChainId.toString(),
    contractAddress: defaultContractAddress.toString(),
  };

  // Define valid tab routes explicitly
  const tabRoutes = {
    galery: "/(collection)/galery/[chainId]/[contractAddress]",
    market: "/(collection)/market/[chainId]/[contractAddress]",
    explorer: "/(collection)/explorer/[chainId]/[contractAddress]",
  } as const;

  const tabRoutes2 = {
    nft: "/(collection)/nft/[chainId]/[contractAddress]/[tokenId]",
  } as const;

  // Custom tab bar icon with animation
  const CustomTabBarIcon = ({ name, color, focused }: { name: IconName; color: string; focused: boolean }) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: withSpring(focused ? 1.2 : 1) },
      ],
    }));

    // Ensure the name is a valid Ionicons name
    const iconName = focused ? name : (`${name}-outline` as `${IconName}-outline`);

    return (
      <Animated.View style={animatedStyle}>
        <TabBarIcon
          name={iconName}
          color={color}
          size={28}
        />
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#00DDEB",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
      }}
      screenListeners={{
        tabPress: (e) => {
          e.preventDefault();
          const targetRoute = e.target?.split("-")[0];
          if (targetRoute) {
            const routeName = targetRoute.split("/")[0] as keyof typeof tabRoutes;
            const routeName2 = targetRoute.split("/")[0] as keyof typeof tabRoutes2;
            if (tabRoutes[routeName]) {
              router.push({
                pathname: tabRoutes[routeName],
                params: tabParams2,
              });
            } else if (tabRoutes2[routeName2]) {
              router.push({
                pathname: tabRoutes2[routeName2],
                params: tabParams,
              });
            }
          }
        },
      }}
    >
      <Tabs.Screen
        name="galery/[chainId]/[contractAddress]/index"
        options={{
          title: "Galery",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="image" color={color} focused={focused} />
          ),
        }}
        initialParams={tabParams}
      />
      <Tabs.Screen
        name="market/[chainId]/[contractAddress]/index"
        options={{
          title: "Market",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="cart" color={color} focused={focused} />
          ),
        }}
        initialParams={tabParams}
      />
      <Tabs.Screen
        name="explorer/[chainId]/[contractAddress]/index"
        options={{
          title: "Explorer",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="compass" color={color} focused={focused} />
          ),
        }}
        initialParams={tabParams}
      />
      <Tabs.Screen
        name="nft/[chainId]/[contractAddress]/[tokenId]/index"
        options={{
          title: "NFT",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="cube" color={color} focused={focused} />
          ),
        }}
        initialParams={tabParams}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,
    height: Platform.OS === "ios" ? 90 : 70,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
});