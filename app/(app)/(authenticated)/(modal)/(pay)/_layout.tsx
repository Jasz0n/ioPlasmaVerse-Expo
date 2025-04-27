import { Tabs, useRouter } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

// Define the specific icon names you're using
type IconName = "image" | "cart" | "information-circle";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Define valid tab routes explicitly
  const tabRoutes = {
    payInfo: "/(tabs)/payInfo/index",
    recieve: "/(tabs)/recieve",
    index: "/(tabs)/index",
  } as const;

  // Custom tab bar icon with animation
  const CustomTabBarIcon = ({ name, color, focused }: { name: IconName; color: string; focused: boolean }) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: withSpring(focused ? 1.2 : 1) }],
    }));

    const iconName = focused ? name : (`${name}-outline` as `${IconName}-outline`);

    return (
      <Animated.View style={animatedStyle}>
        <TabBarIcon name={iconName} color={color} size={28} />
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
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
      
    >
      <Tabs.Screen
        name="recieve"
        options={{
          headerTitle: "Recieve",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="image" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Info",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabBarIcon name="cart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inAppPay/[chainId]/[token]/[amount]/[reciever]/[paymentId]/index"
        options={{
          title: "Pay",
          // Hide the tab from the tab bar
          tabBarButton: () => null,
        }}
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