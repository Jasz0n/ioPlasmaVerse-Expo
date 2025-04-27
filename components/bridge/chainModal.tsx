import React, { FC, useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useActiveAccount } from "thirdweb/react";
import { sendAndConfirmTransaction, prepareTransaction, defineChain } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { chainData } from "@/constants/types";

interface chainModal {
    isOpen: boolean;
    onClose: () => void;
    setChainId: React.Dispatch<React.SetStateAction<number>>;
    
  }
const ChainModal: FC<chainModal> = ({
  isOpen,
  onClose,
  setChainId,
  
}) => {
  

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
                        <ThemedView style={styles.modalContent}>
                          <FlatList
                            data={Object.values(chainData)}
                            keyExtractor={(item) => item.chainId.toString()}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                  setChainId(item.chainId);
                                  onClose();
                                }}
                              >
                                {item.image && <Image source={item.image} style={styles.modalImage} />}
                                <ThemedText style={styles.modalText}>{item.name}</ThemedText>
                              </TouchableOpacity>
                            )}
                          />
                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => onClose()}
                          >
                            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1A1A1A",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#BBB",
    marginBottom: 10,
    textAlign: "center",
  },
  chainList: {
    maxHeight: 180,
    marginBottom: 12,
  },
  chainItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#444",
  },
  chainItemText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "500",
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
  }
});

export default ChainModal;