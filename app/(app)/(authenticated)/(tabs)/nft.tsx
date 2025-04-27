import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { chainData } from "@/constants/types";
import { useCurrency } from "@/constants/currency";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import ListingGrid from "@/components/NFT/listingGrid";
import NftGalery from "@/components/NFT/NftGalery";
import Dex from "@/components/dex/plasmadex";

import PlamaBridge from "@/components/bridge/bridge";
import ChainSelectorModal from "@/components/chainSelector.tsx/chainSelector";


type TabType = "Dex" | "NftMarket" | "NftGalery" | "Bridge";
type IconName = "swap-horizontal" | "pricetag-outline" | "image-outline" | "git-compare-outline";

export default function SwapInterface() {
  const { chainId, setChainId } = useCurrency();
  const [tab, setTab] = useState<TabType>("Dex");
  const [chainModalVisible, setChainModalVisible] = useState(false);
  const [tabModalVisible, setTabModalVisible] = useState(false);
  const opacity = useSharedValue(1);

  // Simplified tab change handler


  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const tabs: { id: TabType; label: string; icon: IconName }[] = [
    { id: "Dex", label: "Swap", icon: "swap-horizontal" },
    { id: "NftMarket", label: "NFT Market", icon: "pricetag-outline" },
    { id: "NftGalery", label: "NFT Gallery", icon: "image-outline" },
    { id: "Bridge", label: "Bridge", icon: "git-compare-outline" },
  ];

  const selectedChain = Object.values(chainData).find((chain) => chain.chainId === chainId);

  // Render content based on the current tab
  const renderContent = () => {
    switch (tab) {
      case "Dex":
        return <Dex />;
      case "NftMarket":
        return <ListingGrid />;
      case "NftGalery":
        return <NftGalery/>; 
      case "Bridge":
        return <PlamaBridge/>;
      default:
        return <Dex />;
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<Image source={require("@/assets/images/title.png")} style={styles.headerImage} />}
    >
      {/* Header with Selectors */}
      <ThemedView style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setChainModalVisible(true)}
        >
          {selectedChain?.image ? (
            <Image source={selectedChain.image} style={styles.selectorImage} />
          ) : (
            <ThemedText>?</ThemedText>
          )}
          <ThemedText style={styles.selectorText}>{selectedChain?.name || "Select Chain"}</ThemedText>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setTabModalVisible(true)}
        >
          <Ionicons name={tabs.find((t) => t.id === tab)?.icon} size={20} color="#fff" />
          <ThemedText style={styles.selectorText}>{tabs.find((t) => t.id === tab)?.label}</ThemedText>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      </ThemedView>

      {/* Chain Selection Modal */}
      <ChainSelectorModal
        visible={chainModalVisible}
        onClose={() => setChainModalVisible(false)}
        onSelectChain={(newChainId) => setChainId(newChainId)}
      />
      {/* Tab Selection Modal */}
      <Modal
        visible={tabModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTabModalVisible(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <FlatList
              data={tabs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setTab(item.id);
                    setTabModalVisible(false);
                  }}
                >
                  <Ionicons name={item.icon} size={24} color="#fff" style={styles.modalIcon} />
                  <ThemedText style={styles.modalText}>{item.label}</ThemedText>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setTabModalVisible(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Content */}
      <Animated.View style={animatedStyle}>
        {renderContent()}
      </Animated.View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  selectorImage: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  selectorText: {
    color: "#fff",
    fontSize: 16,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "50%",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  modalIcon: {
    marginRight: 12,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});