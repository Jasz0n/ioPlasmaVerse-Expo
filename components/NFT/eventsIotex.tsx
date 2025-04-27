import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this for themed text
import { ThemedView } from "@/components/ThemedView"; // Assuming you have this for themed views
import { defineChain } from "thirdweb";
import { Ionicons } from "@expo/vector-icons"; // For pagination icons
import TransactionModal from "../transaction/transaction";

/**
 * Events Component
 *
 * This component fetches and displays blockchain events related to a specific token.
 *
 * Props:
 * - `tokenId`: The ID of the token being tracked.
 * - `contractAddress`: The smart contract address for the NFT or token.
 * - `chainId`: The blockchain network identifier.
 */

export default function Events({
  tokenId,
  contractAddress,
  chainId,
}: {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
}) {
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const NETWORK = defineChain(chainId);
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [eventsPerPage] = useState(20);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Determine if the device is mobile based on screen width
  const { width } = Dimensions.get("window");
  const isMobile = width <= 768;

  const openModal = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    setFilteredEvents(events.slice(startIndex, endIndex));
  }, [page, events, eventsPerPage]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `https://ioplasmaverse.com/api/fetchContractEvents/${chainId}/${contractAddress}/${tokenId.toString()}`
        );
        const result = await response.json();

        if (response.ok) {
          setEvents(result.events);
          console.log("Events fetched:", result.events);
        } else {
          console.error("Failed to fetch events");
        }
      } catch (err) {
        console.error("An unexpected error occurred:", err);
      }
    };

    fetchEvents();
  }, [chainId, contractAddress, tokenId]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  const TARGET_ADDRESSES = [
    { Address: "0x8C9413291fc98bF9556d0Fb3A9A052164e37aeC2".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7499e71FF8a472D1d82Aa2e68e868B5B92896B0E".toLowerCase(), Marketplace: "Mimo" },
    { Address: "0xa6436681b12D0499a8280378057FCd6ab9bb1B3A".toLowerCase(), Marketplace: "Treasureland" },
    { Address: "0x260128f8a312184b9b5cba84a87ef7e82b732f0b".toLowerCase(), Marketplace: "IotexPunks" },
    { Address: "0x7c3cacc88e469ed9365fede9426e947a985ae495".toLowerCase(), Marketplace: "ioPlasmaVerse" },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getMarketplaceOrAddress = (address: string) => {
    const found = TARGET_ADDRESSES.find((entry) => entry.Address === address.toLowerCase());
    return found ? found.Marketplace : formatAddress(address);
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.eventRow}>
      <TouchableOpacity onPress={() => openModal(item)}>
              <ThemedText style={styles.transactionText}>
                {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
              </ThemedText>
            </TouchableOpacity>
      <ThemedText style={styles.eventDetail}>{item.event_name}</ThemedText>
      <ThemedText style={styles.eventDetail}>{item.price || "-"}</ThemedText>
      {!isMobile && (
        <>
          <ThemedText style={styles.eventDetail}>
            {item.from_address ? formatAddress(item.from_address) : "-"}
          </ThemedText>
          <ThemedText style={styles.eventDetail}>
            {item.to_address ? formatAddress(item.to_address) : "-"}
          </ThemedText>
          <ThemedText style={styles.eventDetail}>
            {item.marketplace ? getMarketplaceOrAddress(item.marketplace.toLowerCase()) : "-"}
          </ThemedText>
          <ThemedText style={styles.eventDetail}>
            {item.timestamp ? formatDate(item.timestamp) : "-"}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.title}>NFT Events</ThemedText>

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item, index) => `${item.transaction_hash}-${index}`}
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <ThemedText style={styles.headerText}>Transaction Hash</ThemedText>
              <ThemedText style={styles.headerText}>Event</ThemedText>
              <ThemedText style={styles.headerText}>Price</ThemedText>
              {!isMobile && (
                <>
                  <ThemedText style={styles.headerText}>From</ThemedText>
                  <ThemedText style={styles.headerText}>To</ThemedText>
                  <ThemedText style={styles.headerText}>Marketplace</ThemedText>
                  <ThemedText style={styles.headerText}>Time</ThemedText>
                </>
              )}
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedText style={styles.noEventsText}>No events found.</ThemedText>
      )}

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={page <= 1}
          onPress={() => setPage((prev) => prev - 1)}
          style={[styles.paginationButton, page <= 1 && styles.disabledButton]}
        >
          <Ionicons name="chevron-back" size={20} color={page <= 1 ? "#666" : "#a8dadc"} />
          <ThemedText style={styles.paginationText}>Previous</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.pageText}>
          Page {page} of {Math.ceil(events.length / eventsPerPage)}
        </ThemedText>
        <TouchableOpacity
          disabled={filteredEvents.length < eventsPerPage}
          onPress={() => setPage((prev) => prev + 1)}
          style={[
            styles.paginationButton,
            filteredEvents.length < eventsPerPage && styles.disabledButton,
          ]}
        >
          <ThemedText style={styles.paginationText}>Next</ThemedText>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={filteredEvents.length < eventsPerPage ? "#666" : "#a8dadc"}
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
  noEventsText: {
    fontSize: 14,
    color: "#a8dadc",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: "#a8dadc",
    marginHorizontal: 8,
  },
  pageText: {
    fontSize: 14,
    color: "#a8dadc",
  },
});