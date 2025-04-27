import React, { FC, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { useActiveAccount, MediaRenderer } from "thirdweb/react";
import {  defineChain, getContract, sendTransaction } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { Ionicons } from "@expo/vector-icons"; // For icons (replacing react-icons)
import QRCode from "react-native-qrcode-svg"; // For QR code (replacing qrcode.react)
import { transferFrom } from "thirdweb/extensions/erc721";
import { client } from "@/constants/thirdweb";
import { SocialProfilesList } from "./SocialProfileCard";
import { useUser } from "@/constants/UserProvider";

type FilterType = "all" | "ens" | "farcaster" | "lens";
type SocialIconName = 'logo-twitter-outline' | "logo-telegram-outline" | "globe-outline-outline";   

interface ProfilePageProps {
  ownerAddresse: string;
  contractAddress: string;
  tokenId: bigint;
  currentNFT: any;
  chainId: number;
  tokenUriImage: string;
}

const ProfileData: FC<ProfilePageProps> = ({
  ownerAddresse,
  contractAddress,
  tokenId,
  chainId,
  currentNFT,
  tokenUriImage,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpened, setQrModalOpened] = useState(false);
  const [sendModalOpened, setSendModalOpened] = useState(false);
  const [toAddress, setToAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const account = useActiveAccount();
  const { userData } = useUser();

  const handleTransfer = async () => {
    if (account?.address.toLowerCase() !== ownerAddresse.toLowerCase()) return;
    setLoading(true);
    setMessage("");
    try {
      const tx = await transferFrom({
        contract: getContract({ client, chain: defineChain(chainId), address: contractAddress }),
        from: ownerAddresse,
        to: toAddress,
        tokenId: tokenId,
      });

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account,
      });

      setMessage(`NFT sent successfully! TxHash: ${transactionHash}`);
    } catch (err) {
      console.error("Error during NFT transfer:", err);
      setMessage("Failed to send NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  

  

  const handleCopy = async () => {
    if (account?.address) {
      try {
        // Using Clipboard from @react-native-clipboard/clipboard
        const Clipboard = require("@react-native-clipboard/clipboard").default;
        Clipboard.setString(account.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {userData?.profileImage ? (
              <Image
                source={{ uri: userData.profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>
              {userData?.name || "Unknown User"}
            </ThemedText>
            <ThemedText style={styles.address}>
              {shortenAddress(ownerAddresse)}
            </ThemedText>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <ThemedText style={styles.copyButtonText}>
                {copied ? "Copied" : "Copy Address"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.divider} />
        <ThemedText style={styles.sectionTitle}>Social Links</ThemedText>
        <View style={styles.socialLinksContainer}>
          {userData?.socialUrls?.length ? (
            userData.socialUrls.map((socialUrl: any, index: number) => {
              if (!socialUrl.url) return null;
              let iconName: any | undefined;
              switch (socialUrl.name.toLowerCase()) {
                case "twitter":
                  iconName = "twitter-outline";
                  break;
                case "telegram":
                  iconName = "telegram-outline";
                  break;
                case "website":
                  iconName = "globe-outline";
                  break;
                default:
                  return null;
              }
              return (
                <TouchableOpacity
                key={index}
                style={styles.socialButton}
                onPress={() => {
                  const Linking = require("react-native").Linking;
                  Linking.openURL(socialUrl.url).catch((err:any) =>
                    console.error("Failed to open URL:", err)
                  );
                }}
              >
                {iconName && <Ionicons name={iconName} size={18} color="rgba(97, 218, 251, 0.3)" />}
              </TouchableOpacity>
              );
            })
          ) : (
            <ThemedText style={styles.noSocialText}>No social links available</ThemedText>
          )}
        </View>
        <SocialProfilesList address={ownerAddresse} client={client} />

        {/* NFT Actions */}
        <View style={styles.divider} />
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => setSendModalOpened(true)}>
            <Ionicons name="send-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setQrModalOpened(true)}>
            <Ionicons name="download-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const url = `/profile/${ownerAddresse}`;
              console.log("Navigating to:", url); // Replace with navigation logic if needed
            }}
          >
            <Ionicons name="open-outline" size={20} color="#a8dadc" />
          </TouchableOpacity>
        </View>

        {/* QR Code Modal */}
        <Modal
          visible={qrModalOpened}
          onRequestClose={() => setQrModalOpened(false)}
          animationType="slide"
          transparent={true}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Wallet Address QR Code</ThemedText>
              <View style={styles.qrContainer}>
                <QRCode
                  value={ownerAddresse || ""}
                  size={256}
                  backgroundColor="transparent"
                  color="#fff"
                />
              </View>
              <ThemedText style={styles.modalText}>
                Scan the QR code or copy the address from the NFT Owner
              </ThemedText>
              <TouchableOpacity style={styles.modalButton} onPress={handleCopy}>
                <ThemedText style={styles.modalButtonText}>
                  {copied ? "Copied" : "Copy Address"}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setQrModalOpened(false)}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Modal>

        {/* Send NFT Modal */}
        <Modal
          visible={sendModalOpened}
          onRequestClose={() => setSendModalOpened(false)}
          animationType="slide"
          transparent={true}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>
                Send NFT {currentNFT?.name}
              </ThemedText>
              {currentNFT?.image && (
                <MediaRenderer
                  src={currentNFT.animation_url || currentNFT.image || tokenUriImage}
                  client={client}
                  style={styles.nftImage}
                />
              )}
              <ThemedText style={styles.modalText}>
                You are about to Send #{currentNFT?.name}
              </ThemedText>
              <ThemedText style={styles.modalSubText}>
                Please enter the Wallet Address you want to send the NFT to
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter the recipient's wallet address"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={toAddress}
                onChangeText={setToAddress}
              />
              <View style={styles.modalActions}>
                {loading ? (
                  <Ionicons name="hourglass-outline" size={24} color="teal" />
                ) : (
                  <TouchableOpacity onPress={handleTransfer}>
                    <Ionicons name="send-outline" size={24} color="teal" />
                  </TouchableOpacity>
                )}
              </View>
              {message && (
                <ThemedText
                  style={[
                    styles.messageText,
                    message.includes("successful") ? styles.successText : styles.errorText,
                  ]}
                >
                  {message}
                </ThemedText>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSendModalOpened(false)}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Modal>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 16,
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 800,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#0294fe",
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#0294fe",
    backgroundColor: "#333",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    color: "#a8dadc",
    fontWeight: "600",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#f5f5f5",
    marginBottom: 8,
  },
  copyButton: {
    backgroundColor: "#61dafb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  copyButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#61dafb",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  socialLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  noSocialText: {
    fontSize: 14,
    color: "#a8dadc",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: "#a8dadc",
    fontWeight: "600",
    marginBottom: 16,
  },
  qrContainer: {
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#4B5563",
    borderRadius: 12,
    padding: 10,
  },
  qrCode: {
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  modalSubText: {
    fontSize: 14,
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#4B5563",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#a8dadc",
    fontSize: 14,
    fontWeight: "600",
  },
  nftImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  textInput: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    color: "#fff",
    marginBottom: 16,
  },
  modalActions: {
    marginTop: 16,
    alignItems: "center",
  },
  messageText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },
  successText: {
    color: "green",
  },
  errorText: {
    color: "red",
  },
});

export default ProfileData;