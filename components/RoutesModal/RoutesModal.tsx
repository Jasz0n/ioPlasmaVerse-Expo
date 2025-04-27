import React from "react";
import { View, StyleSheet, Modal, FlatList } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import ActionButton from "../ActionButton";
import RouteItem from "./RouterItems";
import { Platform } from "react-native";

interface Route {
  originToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
  destinationToken: {
    chainId: number;
    address: string;
    decimals: number;
    iconUri?: string;
    name: string;
    symbol: string;
  };
}

interface RoutesModalProps {
  visible: boolean;
  onClose: () => void;
  routes: Route[];
  routesError: string | null;
  onSelectRoute: (route: Route) => void;
  routesPage: number;
  setRoutesPage: (page: number) => void;
  routesPerPage: number;
}

const RoutesModal: React.FC<RoutesModalProps> = ({
  visible,
  onClose,
  routes,
  routesError,
  onSelectRoute,
  routesPage,
  setRoutesPage,
  routesPerPage,
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
          <ThemedText style={styles.modalTitle}>Available Routes</ThemedText>

          {routesError ? (
            <ThemedText style={styles.errorText}>{routesError}</ThemedText>
          ) : routes.length === 0 ? (
            <ThemedText style={styles.modalLabel}>No routes available</ThemedText>
          ) : (
            <>
              <FlatList
                data={routes}
                renderItem={({ item }) => <RouteItem item={item} onSelect={onSelectRoute} />}
                keyExtractor={(item) => `${item.originToken.address}-${item.destinationToken.address}`}
                style={styles.routeList}
              />
              <View style={styles.pagination}>
                <ActionButton
                  title="Previous"
                  onPress={() => setRoutesPage(Math.max(routesPage - 1, 0))}
                  disabled={routesPage === 0}
                  accessibilityLabel="Previous routes page"
                />
                <ActionButton
                  title="Next"
                  onPress={() => setRoutesPage(routesPage + 1)}
                  disabled={routes.length < routesPerPage}
                  accessibilityLabel="Next routes page"
                />
              </View>
            </>
          )}

          <ActionButton
            title="Close"
            onPress={onClose}
            accessibilityLabel="Close routes modal"
          />
        </ThemedView>
      </View>
    </Modal>
  );
};

export default RoutesModal;

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
  routeList: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    marginBottom: 10,
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
