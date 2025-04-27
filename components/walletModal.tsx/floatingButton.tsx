import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useModal } from "@/constants/transactionModalProvider";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const FloatingActionButton: React.FC = () => {
const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openModal } = useModal();
  const [menuVisible, setMenuVisible] = useState(false);

  // Adjust initial position for safe area insets
  const adjustedHeight = height - insets.top - insets.bottom;
  const pan = useRef(
    new Animated.ValueXY({ x: width - 80 - insets.right, y: adjustedHeight - 150 })
  ).current;
  const offset = useRef({ x: width - 80 - insets.right, y: adjustedHeight - 150 }).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      console.log("onStartShouldSetPanResponder triggered");
      return true;
    },
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dx: pan.x,
          dy: pan.y,
        },
      ],
      { useNativeDriver: false }
    ),
    onPanResponderGrant: () => {
      console.log("onPanResponderGrant triggered");
      pan.setOffset({
        x: offset.x,
        y: offset.y,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderRelease: (e, gestureState) => {
      console.log("onPanResponderRelease triggered", gestureState);
      offset.x = offset.x + gestureState.dx;
      offset.y = offset.y + gestureState.dy;

      // Ensure the FAB stays within screen bounds, accounting for insets
      offset.x = Math.max(insets.left, Math.min(offset.x, width - 64 - insets.right));
      offset.y = Math.max(insets.top, Math.min(offset.y, height - 64 - insets.bottom));

      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();

      pan.setOffset({
        x: offset.x,
        y: offset.y,
      });
      pan.setValue({ x: 0, y: 0 });
    },
  });

  const handleOpenWalletDetails = () => {
    console.log("Opening Wallet Details Modal");
    setMenuVisible(false);
    openModal({ type: "walletDetails" });
  };

  const handleOpenAskPlasma = () => {
    console.log("Opening Ask Plasma Modal");
    setMenuVisible(false);
    openModal({
      type: "askPlasma",
      
    });
  };

  
  const handleOpenChat = () => {
    router.push("/(app)/(authenticated)/(modal)/(chat)");

  };

  const handleOpenConnect  = () => {
    console.log("Opening Ask Plasma Modal");
    setMenuVisible(false);
    openModal({
      type: "connectWallet",
      
    });
  };

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {menuVisible && (
        <View style={styles.menu}>
          {/* Wallet Details Icon */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenWalletDetails}
          >
            <Ionicons name="wallet-outline" size={24} color="#FFF" />
            <ThemedText style={styles.menuLabel}>Wallet</ThemedText>
          </TouchableOpacity>
          {/* Ask Plasma Icon */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenAskPlasma}
          >
            <Ionicons name="sparkles" size={24} color="#FFF" />
            <ThemedText style={styles.menuLabel}>Ask AI</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenConnect}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
            <ThemedText style={styles.menuLabel}>Connect</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenChat}
          >
            <Ionicons name="text" size={24} color="#FFF" />
            <ThemedText style={styles.menuLabel}>Chat</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              console.log("FAB pressed, menuVisible:", menuVisible);
              setMenuVisible(false);
            }}
          >
            <Ionicons name="text" size={24} color="#FFF" />
            <ThemedText style={styles.menuLabel}>close</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log("FAB pressed, menuVisible:", menuVisible);
          setMenuVisible(!menuVisible);
        }}
      >
        <Ionicons name="menu" size={24} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    zIndex: 9999,
  },
  fab: {
    backgroundColor: "#00C4B4",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00C4B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menu: {
    position: "absolute",
    top: -120, // Position above the FAB
    right: 0,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10000,
    alignItems: "center",
  },
  menuItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  menuLabel: {
    fontSize: 12,
    color: "#FFF",
    marginTop: 4,
    textAlign: "center",
  },
});

export default FloatingActionButton;