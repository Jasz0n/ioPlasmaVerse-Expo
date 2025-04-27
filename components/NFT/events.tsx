import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { defineChain, eth_getTransactionByHash, getRpcClient } from "thirdweb";

import { Picker } from "@react-native-picker/picker"; // For the filter dropdown
import { Ionicons } from "@expo/vector-icons"; // For icons
import { getSocialProfiles } from "thirdweb/social";
import { client } from "@/constants/thirdweb";
import TransactionModal from "../transaction/transaction";

/**
 * EventsTokenId Component
 *
 * This component fetches and displays blockchain events related to a specific token.
 *
 * Features:
 * - Fetches token events using Thirdweb's insight API.
 * - Decodes transaction events including sales and transfers.
 * - Retrieves ENS data for wallet addresses.
 * - Displays transactions in a list with filtering and pagination.
 * - Opens a modal to view transaction details.
 *
 * Props:
 * - `tokenId`: The ID of the token being tracked.
 * - `contractAddress`: The smart contract address for the NFT or token.
 * - `chainId`: The blockchain network identifier.
 */

export default function EventsTokenId({
  tokenId,
  contractAddress,
  chainId,
}: {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
}) {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [eventFilter, setEventFilter] = useState<"eventName" | "price" | "from" | "to">("eventName");

  // Determine if the device is mobile based on screen width
  const { width } = Dimensions.get("window");
  const isMobile = width <= 768;

  /* ---------------------------------------------------------------
     Pagination Effect
  --------------------------------------------------------------- */
  useEffect(() => {
    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    setFilteredEvents(events.slice(startIndex, endIndex));
  }, [page, events, eventsPerPage]);

  /* ---------------------------------------------------------------
     Fetching & Caching ENS Data and NFT events based on TokenId
  --------------------------------------------------------------- */
  useEffect(() => {
    const ensCache: Record<string, { name: string; avatar: string }> = {};

    const getENSData = async (address: string): Promise<{ name: string; avatar: string }> => {
      console.log("Fetching ENS data for address:", address);
      if (!ensCache[address]) {
        try {
          const profiles = await getSocialProfiles({ address, client });
          console.log("Fetched social profiles:", profiles);
          if (profiles.length > 0 && profiles[0].type === "ens") {
            ensCache[address] = {
              name: profiles[0].name || address,
              avatar: profiles[0].avatar || "",
            };
          } else {
            ensCache[address] = { name: address, avatar: "" };
          }
        } catch (error) {
          console.error("ENS fetch error:", error);
          ensCache[address] = { name: address, avatar: "" };
        }
      }
      return ensCache[address];
    };

    const fetchTokenEvents = async (chainId: number, contractAddress: string, tokenId: string) => {
        const baseUrl = `https://insight.thirdweb.com/v1/events`;
        const clientId = process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID;
        if (!clientId) return;
        const tokenIdAdjusted = BigInt(tokenId).toString(16).padStart(64, "0");
        console.log("tokenId", tokenIdAdjusted)
        try {
          const response = await fetch(
            `https://insight.thirdweb.com/v1/events/${contractAddress}?chain=${chainId}&filter_topic_3=${tokenIdAdjusted}&limit=20&clientId=${clientId}`,
            {
              headers: {
                'x-client-id': clientId,
              },
            }
          );
      
          if (!response.ok) {
            throw new Error(`Failed to fetch token events: ${response.statusText}`);
          }
      
          const data = await response.json();
          console.log('Token Transfer Events:', data);
          return data;
        } catch (error) {
          console.error('Error fetching token events:', error);
          return null;
        }
      };

      async function fetchNftSaleSale(
        transactionHash: string,
        chainId: number
      ): Promise<any | null> {
        try {
          const NETWORK = defineChain(chainId);
      
          // Ensure the transaction hash has the '0x' prefix
          const formattedHash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`;
      
          // Fetch transaction details
          const transaction = await eth_getTransactionByHash(
            getRpcClient({ client, chain: NETWORK }),
            { hash: formattedHash as `0x${string}` } // Type assertion to ensure correct type
          );
      
          // Check if `transaction.value` exists and log it
          const value = transaction.value ? transaction.value.toString() : "undefined";
      
          // Determine the event name
          const eventName = transaction.value.toString() && transaction.value.toString() !== "0"
          ? "Sale"
          : "Transfer";
      
          // Determine the marketplace address
          const marketplace = transaction.value && transaction.value.toString() !== "0" 
          ? transaction.to 
          : ""; 
      
          // Define the transaction details to return
          const transactionDetails: any = {
            transactionHash: transactionHash,
            eventName: eventName,
            price: value !== "undefined" ? `${(Number(value) / 1e18).toString()} Eth` : "",
            marketplace: marketplace || "",
          };
      
          return transactionDetails;
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          return null;
        }
      }

    const handleFetch = async () => {
      console.log("Fetching token events for:", {   
        chainId,
        contractAddress,
        tokenId: tokenId.toString(),
      });
      try {
        const response = await fetchTokenEvents(chainId, contractAddress, tokenId.toString());
        console.log("Fetched token events response:", response);
        if (response && response.data) {
          const decodedEvents = await Promise.all(
            response.data.map(async (event: any) => {
              console.log("Decoding event:", event);
              const from = `0x${event.topics[1].slice(26)}`;
              const to = `0x${event.topics[2].slice(26)}`;
              const tokenId = "10";

              const transactionDetails = await fetchNftSaleSale(event.transaction_hash.toString(), 1);

              const [ensFrom, ensTo] = await Promise.all([getENSData(from), getENSData(to)]);

              return {
                transactionHash: event.transaction_hash,
                blockNumber: event.block_number,
                from: ensFrom.name,
                fromImage: ensFrom.avatar,
                to: ensTo.name,
                toImage: ensTo.avatar,
                tokenId,
                timestamp: new Date(event.block_timestamp * 1000).toLocaleString(),
                eventName: transactionDetails?.eventName || "Transfer",
                price: transactionDetails?.price || "",
                marketplace: transactionDetails?.marketplace || "",
              };
            })
          );

          console.log("Decoded events:", decodedEvents);
          setEvents(decodedEvents);
        } else {
          console.error("Invalid response format:", response);
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching token events:", error);
        setEvents([]);
      }
    };

    handleFetch();
  }, [chainId]);

  /* ---------------------------------------------------------------
     Modal Handlers
  --------------------------------------------------------------- */
  const openModal = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  /* ---------------------------------------------------------------
     ENS Profile Rendering
  --------------------------------------------------------------- */
  const renderAddressCell = (address: string, avatar: string) => {
    const shortenedAddress = address.startsWith("0x")
      ? `${address.slice(0, 5)}...${address.slice(-4)}`
      : address;

    return (
      <TouchableOpacity
        onPress={() => {
          const Linking = require("react-native").Linking;
          Linking.openURL(`https://www.ioplasmaverse.com/profile/${address}`).catch((err: any) =>
            console.error("Failed to open URL:", err)
          );
        }}
        style={styles.addressContainer}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <ThemedText style={styles.addressText}>{shortenedAddress}</ThemedText>
      </TouchableOpacity>
    );
  };

  /* ---------------------------------------------------------------
     Render Event Item
  --------------------------------------------------------------- */
  const renderEventItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.eventRow}>
      <TouchableOpacity onPress={() => openModal(item)}>
        <ThemedText style={styles.transactionText}>
          {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
        </ThemedText>
      </TouchableOpacity>
      {isMobile ? (
        <ThemedText style={styles.eventDetail}>
          {eventFilter === "eventName"
            ? item.eventName
            : eventFilter === "price"
            ? item.price || "-"
            : eventFilter === "from"
            ? item.from
            : item.to}
        </ThemedText>
      ) : (
        <>
          <ThemedText style={styles.eventDetail}>{item.eventName}</ThemedText>
          <ThemedText style={styles.eventDetail}>{item.price || "-"}</ThemedText>
          <View style={styles.eventDetail}>{renderAddressCell(item.from, item.fromImage)}</View>
          <View style={styles.eventDetail}>{renderAddressCell(item.to, item.toImage)}</View>
        </>
      )}
    </ThemedView>
  );

  /* ---------------------------------------------------------------
     JSX Rendering
  --------------------------------------------------------------- */
  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.title}>Item Activity</ThemedText>

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <Picker
          selectedValue={eventFilter}
          onValueChange={(value) => setEventFilter(value)}
          style={styles.picker}
        >
          <Picker.Item label="All" value="eventName" />
          <Picker.Item label="Sales" value="price" />
          <Picker.Item label="Transfers" value="to" />
        </Picker>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item, index) => `${item.transactionHash}-${index}`}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <ThemedText style={styles.headerText}>Transaction</ThemedText>
            {isMobile ? (
              <ThemedText style={styles.headerText}>
                {eventFilter.charAt(0).toUpperCase() + eventFilter.slice(1)}
              </ThemedText>
            ) : (
              <>
                <ThemedText style={styles.headerText}>Event</ThemedText>
                <ThemedText style={styles.headerText}>Price</ThemedText>
                <ThemedText style={styles.headerText}>From</ThemedText>
                <ThemedText style={styles.headerText}>To</ThemedText>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={page === 1}
          onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
          style={[styles.paginationButton, page === 1 && styles.disabledButton]}
        >
          <Ionicons name="chevron-back" size={20} color={page === 1 ? "#666" : "#a8dadc"} />
        </TouchableOpacity>
        <ThemedText style={styles.pageText}>
          Page {page} of {Math.ceil(events.length / eventsPerPage)}
        </ThemedText>
        <TouchableOpacity
          disabled={page === Math.ceil(events.length / eventsPerPage)}
          onPress={() =>
            setPage((prev) => Math.min(prev + 1, Math.ceil(events.length / eventsPerPage)))
          }
          style={[
            styles.paginationButton,
            page === Math.ceil(events.length / eventsPerPage) && styles.disabledButton,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={page === Math.ceil(events.length / eventsPerPage) ? "#666" : "#a8dadc"}
          />
        </TouchableOpacity>
        {isModalOpen && selectedEvent &&( 
          <View>
            <TransactionModal transactionHash={selectedEvent.transactionHash} from={selectedEvent.from} chainId={chainId} isOpen={isModalOpen} onClose={closeModal} />
            </View>
        )}
      </View>      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(97, 218, 251, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 20,
    color: "#a8dadc",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  picker: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#f5f5f5",
    textAlign: "left",
  },
  listContainer: {
    paddingBottom: 16,
  },
  eventRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    alignItems: "center",
  },
  transactionText: {
    flex: 1,
    color: "#0294fe",
    fontSize: 14,
  },
  eventDetail: {
    flex: 1,
    fontSize: 14,
    color: "#f5f5f5",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#666",
    marginRight: 8,
  },
  addressText: {
    color: "#0294fe",
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  paginationButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    color: "#a8dadc",
    marginHorizontal: 16,
  },
});