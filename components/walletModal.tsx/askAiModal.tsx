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
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useActiveAccount } from "thirdweb/react";
import { sendAndConfirmTransaction, prepareTransaction, defineChain } from "thirdweb";
import { client } from "@/constants/thirdweb";
import { createSession, queryContract, handleUserMessage, executeCommand } from "./scrip.mjs"; // Adjust the import path

const { width, height } = Dimensions.get("window");

interface AskPlasmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: number;
  contractAddress: string;
  abi?: any;
}

const AskPlasmaModal: FC<AskPlasmaModalProps> = ({
  isOpen,
  onClose,
  chainId,
  contractAddress,
  abi,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const account = useActiveAccount();
  const walletAddress = account?.address;
  const messagesRef = useRef<ScrollView>(null);

  useEffect(() => {
    const initSession = async () => {
      if (!contractAddress && !chainId) return;
      try {
        const newSessionId = await createSession("Blockchain Explorer Session");
        setSessionId(newSessionId);

        setIsTyping(true);

        const contractDetails = await queryContract(
          contractAddress,
          chainId,
          newSessionId
        );
        setMessages([
          { role: "system", content: "Welcome to the Blockchain Explorer." },
          {
            role: "system",
            content: contractDetails || "No details available for this contract.",
          },
        ]);

        setIsTyping(false);
      } catch (error) {
        console.error("Error creating session or querying contract:", error);
        setMessages([
          {
            role: "system",
            content: "Failed to load contract details. Please try again.",
          },
        ]);
        setIsTyping(false);
      }
    };

    if (isOpen) {
      initSession();
    }
  }, [isOpen, contractAddress, chainId]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || !chainId || !contractAddress) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    try {
      setIsTyping(true);
      const response = await handleUserMessage(
        userMessage,
        sessionId,
        chainId,
        contractAddress
      );
      setMessages((prev) => [...prev, { role: "system", content: response }]);
      setIsTyping(false);
    } catch (error) {
      console.error("Error handling user message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Failed to process your query. Please try again.",
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleExecute = async () => {
    if (!account?.address || !input.includes("execute")) return;
    if (!contractAddress && !chainId) return;
    const executeMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: executeMessage }]);
    setInput("");

    try {
      setIsTyping(true);

      const executeResponse = await executeCommand(
        executeMessage,
        account.address,
        "default-user",
        false,
        chainId,
        contractAddress,
        sessionId
      );

      const action = executeResponse.actions?.find(
        (a: { type: string; data: string }) => a.type === "sign_transaction"
      );

      if (action) {
        const transactionData = JSON.parse(action.data);

        const preparedTransaction = prepareTransaction({
          to: transactionData.to,
          value: transactionData.value,
          data: transactionData.data,
          chain: defineChain(transactionData.chainId),
          client,
        });

        const receipt = await sendAndConfirmTransaction({
          transaction: preparedTransaction,
          account,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Transaction sent successfully! Hash: ${receipt.transactionHash}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "No transaction to sign in the response.",
          },
        ]);
      }

      setIsTyping(false);
    } catch (error) {
      console.error("Error executing transaction:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Failed to execute the command. Please try again.",
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleAction = () => {
    if (input.includes("execute")) {
      handleExecute();
    } else {
      handleSend();
    }
  };

  const readFunctions = abi?.filter(
    (item: any) => item.type === "function" && (item.stateMutability === "view" || item.stateMutability === "pure")
  );
  const writeFunctions = abi?.filter(
    (item: any) => item.type === "function" && item.stateMutability !== "view" && item.stateMutability !== "pure"
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.title}>Ask Plasma</ThemedText>

          {/* Main Content: Chat Interface and Functions List */}
          <View style={styles.contentContainer}>
            {/* Chat Interface */}
            <View style={styles.chatContainer}>
              <ScrollView
                ref={messagesRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageWrapper,
                      message.role === "user"
                        ? styles.userMessageWrapper
                        : styles.systemMessageWrapper,
                    ]}
                  >
                    <ThemedText
                      style={
                        message.role === "user"
                          ? styles.userMessage
                          : styles.systemMessage
                      }
                    >
                      {message.content}
                    </ThemedText>
                  </View>
                ))}
                {isTyping && (
                  <ThemedText style={styles.typingIndicator}>
                    Typing...
                  </ThemedText>
                )}
              </ScrollView>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#a8dadc"
                  onSubmitEditing={handleAction}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleAction}
                  disabled={!input.trim()}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={input.trim() ? "#FFF" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </View>

           
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
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
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 20,
  },
  contentContainer: {
    flexDirection: "row",
    flex: 1,
    gap: 20,
  },
  chatContainer: {
    flex: 2,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 10,
  },
  userMessageWrapper: {
    alignItems: "flex-end",
  },
  systemMessageWrapper: {
    alignItems: "flex-start",
  },
  userMessage: {
    backgroundColor: "#007bff",
    color: "#FFF",
    padding: 10,
    borderRadius: 8,
    maxWidth: "70%",
  },
  systemMessage: {
    backgroundColor: "#242424",
    color: "#FFF",
    padding: 10,
    borderRadius: 8,
    maxWidth: "70%",
  },
  typingIndicator: {
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#242424",
    color: "#FFF",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#00C4B4",
    padding: 10,
    borderRadius: 8,
  },
  functionsContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 10,
  },
  functionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 10,
  },
  functionsScroll: {
    flex: 1,
  },
  functionSectionTitle: {
    fontWeight: "bold",
    color: "#FFF",
  },
  functionItem: {
    paddingVertical: 5,
    color: "#FFF",
  },
  noAbiText: {
    color: "#FFF",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#00C4B4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00C4B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
});

export default AskPlasmaModal;