import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Modal, FlatList, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { chainData } from "@/constants/types";
import ActionButton from "../ActionButton";

interface ChainSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectChain: (chainId: number) => void;
}

const ChainSelectorModal: React.FC<ChainSelectorModalProps> = ({
  visible,
  onClose,
  onSelectChain,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <FlatList
              data={Object.values(chainData)}
              keyExtractor={(item) => item.chainId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onSelectChain(item.chainId);
                    onClose();
                  }}
                >
                  {item.image && <Image source={item.image} style={styles.modalImage} />}
                  <ThemedText style={styles.modalText}>{item.name}</ThemedText>
                </TouchableOpacity>
              )}
            />
            <ActionButton
              title="Close"
              onPress={() => onClose()}
              accessibilityLabel="Close Chain modal"
            />
          </ThemedView>
        </View>
    </Modal>
  );
};

export default ChainSelectorModal;

const styles = StyleSheet.create({
  modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
      backgroundColor: "#1E1E1E",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: "#333",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        android: {
          elevation: 5,
        },
      }),
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
    color: "#FFF",
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