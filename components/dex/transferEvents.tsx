import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Pressable, FlatList, LayoutChangeEvent } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useContractEvents } from "thirdweb/react";
import { client } from "@/constants/thirdweb";
import { transferEvent } from "thirdweb/extensions/erc20";
import { defineChain, getContract, NATIVE_TOKEN_ADDRESS, toTokens } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { Token } from "@/constants/types";
import { useCurrency } from "@/constants/currency";
import { useModal } from "@/constants/transactionModalProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import EventCard from "./eventCard";

interface ContractEventsProps {
  tokenA: Token;
  tokenB: Token;
}

interface EventItem {
  transactionHash: string;
  args: {
    from: string;
    to: string;
    value: bigint;
  };
}

const ContractEvents: React.FC<ContractEventsProps> = ({ tokenA, tokenB }) => {
  const [selectedToken, setSelectedToken] = useState<Token>(tokenB);
  const [eventList, setEventList] = useState<EventItem[]>([]);
  const [cardHeight, setCardHeight] = useState(100); // Default height, will be updated dynamically
  const { openModal } = useModal();
  const { WETH9, chainId } = useCurrency();

  // Query contract events
  const contract = useMemo(() => {
    const address =
      selectedToken.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS
        ? WETH9
        : selectedToken.contractAddress;
    return getContract({
      client,
      chain: defineChain(chainId),
      address,
    });
  }, [selectedToken, chainId, WETH9]);

  const eventsQuery = useContractEvents({
    contract,
    events: [transferEvent()],
    blockRange: 10,
  });

  // Update event list when new events are fetched
  useEffect(() => {
    if (eventsQuery.data && eventsQuery.data.length > 0) {
      const newEvents = eventsQuery.data.slice(-10).reverse();

      // If eventList is empty, initialize it
      if (eventList.length === 0) {
        setEventList(newEvents);
        return;
      }

      // Find new events by comparing transaction hashes
      const existingHashes = new Set(eventList.map((event) => event.transactionHash));
      const newItems = newEvents.filter((event) => !existingHashes.has(event.transactionHash));

      if (newItems.length > 0) {
        // Prepend new events to the existing list, keeping at most 10 items
        setEventList((prev) => {
          const updatedList = [...newItems, ...prev];
          return updatedList.slice(0, 10); // Limit to 10 items
        });
      }
    }
  }, [eventsQuery.data]);

  // Reset event list when token changes
  useEffect(() => {
    setEventList([]);
  }, [selectedToken]);

  // Toggle between tokenA and tokenB
  const toggleToken = () => {
    setSelectedToken((prev) => (prev === tokenA ? tokenB : tokenA));
  };

  // Container animation (for loading state)
  const containerOpacity = useSharedValue(0);
  const containerStyle = useAnimatedStyle(() => {
    containerOpacity.value = withTiming(eventsQuery.isLoading && eventList.length === 0 ? 0 : 1, { duration: 300 });
    return {
      opacity: containerOpacity.value,
    };
  });

  // Handle card height measurement
  const onCardLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setCardHeight(height);
  };

  // Render event card
  const renderEventCard = ({ item, index }: { item: EventItem; index: number }) => {
    const from = shortenAddress(item.args.from);
    const to = shortenAddress(item.args.to);
    const value = toTokens(item.args.value, selectedToken.decimals);
    const shortTxHash = `Tx: ${item.transactionHash.slice(0, 6)}...${item.transactionHash.slice(-6)}`;

    return (
      <EventCard
        from={from}
        to={to}
        value={value}
        tokenSymbol={selectedToken.symbol}
        transactionHash={shortTxHash}
        fullTransactionHash={item.transactionHash}
        chainId={chainId}
        index={index}
        onPress={() =>
          openModal({ type: "transaction", transactionHash: item.transactionHash, from, to, chainId })
        }
        animationOffset={index * cardHeight} // Use dynamic card height
        onLayout={index === 0 ? onCardLayout : undefined} // Measure height of the first card
      />
    );
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ThemedView style={styles.contractEventsCard}>
        <View style={styles.eventsHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contract Events
          </ThemedText>
          <Pressable style={styles.toggleButton} onPress={toggleToken}>
            <ThemedText style={styles.toggleButtonText}>
              {tokenA.symbol} / {tokenB.symbol}
            </ThemedText>
            <View
              style={[
                styles.toggleIndicator,
                selectedToken === tokenA ? styles.toggleIndicatorLeft : styles.toggleIndicatorRight,
              ]}
            />
          </Pressable>
        </View>

        <View style={styles.eventsBody}>
          <ThemedText style={styles.eventsTitle}>
            Live <ThemedText type="defaultSemiBold">{selectedToken.symbol}</ThemedText> transfers
          </ThemedText>

          {eventsQuery.isLoading && eventList.length === 0 && (
            <View style={styles.skeletonContainer}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.skeletonRow} />
              ))}
            </View>
          )}

          {eventsQuery.isError && (
            <ThemedText style={styles.errorText}>
              Failed to load events. Please try again.
            </ThemedText>
          )}

          {eventList.length === 0 && !eventsQuery.isLoading && (
            <ThemedText style={styles.noEventsText}>
              No recent transfers found.
            </ThemedText>
          )}

          {eventList.length > 0 && (
            <FlatList
              data={eventList}
              renderItem={renderEventCard}
              keyExtractor={(item, index) => `${item.transactionHash}${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.eventsList}
              getItemLayout={(data, index) => ({
                length: cardHeight,
                offset: cardHeight * index,
                index,
              })}
            />
          )}
        </View>
      </ThemedView>
    </Animated.View>
  );
};

export default ContractEvents;

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 12,
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  contractEventsCard: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3A3A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#555",
    position: "relative",
    width: 120,
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  toggleIndicator: {
    position: "absolute",
    width: 60,
    height: "100%",
    backgroundColor: "#00E5D5",
    borderRadius: 20,
    opacity: 0.2,
  },
  toggleIndicatorLeft: {
    left: 0,
  },
  toggleIndicatorRight: {
    right: 0,
  },
  eventsBody: {
    marginTop: 16,
  },
  eventsTitle: {
    fontSize: 16,
    color: "#FFF",
    marginBottom: 12,
  },
  eventsList: {
    paddingBottom: 16,
  },
  skeletonContainer: {
    gap: 8,
  },
  skeletonRow: {
    backgroundColor: "#3A3A3A",
    borderRadius: 8,
    height: 70,
    opacity: 0.5,
  },
  noEventsText: {
    fontSize: 14,
    color: "#888",
    marginTop: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#FF5555",
    marginTop: 12,
    textAlign: "center",
  },
});