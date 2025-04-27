import React, { FC, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useActiveAccount } from "thirdweb/react";

interface Attribute {
  trait_type: string;
  value: string | number;
  frequency?: string;
  count?: number;
  total?: string;
  MiningRate?: string;
}

type INFTCardProps = {
  nft: any; // Adjust the type according to your actual NFT type
  contractAddress: string;
};

interface RarityData {
  total: string;
  MiningRate: string;
}

interface Rarities {
  [trait_type: string]: { [value: string]: RarityData };
}

const punksContractAddress = "0xce300b00aa9c066786D609Fc96529DBedAa30B76";

const rarities: Rarities = {
  face: {
    "IOTX Skeleton": { total: "1030", MiningRate: "10%" },
    "IOTX Ape": { total: "1075", MiningRate: "10%" },
    "SilverBack Ape": { total: "1069", MiningRate: "10%" },
    "Female Pink": { total: "470", MiningRate: "4%" },
    "Female Zombie": { total: "463", MiningRate: "4%" },
    "Female Light": { total: "470", MiningRate: "4%" },
    "Male Light": { total: "1064", MiningRate: "10%" },
    "Male Zombie": { total: "1047", MiningRate: "10%" },
    "Male Dark": { total: "1103", MiningRate: "11%" },
    "Skeleton Light": { total: "1091", MiningRate: "10%" },
    "Alien": { total: "1118", MiningRate: "11%" },
  },
  Mouth: {
    "Smirk": { total: "4276", MiningRate: "42%" },
    "Female Smirk": { total: "433", MiningRate: "4%" },
  },
  FacialHair: {
    "Beard Scruby": { total: "695", MiningRate: "6%" },
    "Beard Full": { total: "705", MiningRate: "7%" },
    "Goatee Aqua": { total: "730", MiningRate: "7%" },
    "Goatee Purple": { total: "731", MiningRate: "7%" },
    "Goatee Brown": { total: "724", MiningRate: "7%" },
  },
  Eyes: {
    "Red Laser": { total: "345", MiningRate: "3%" },
    "Gold Laser": { total: "355", MiningRate: "3%" },
    "Purple Laser": { total: "386", MiningRate: "3%" },
    "Stoned": { total: "390", MiningRate: "3%" },
  },
  Hair: {
    "IOTX Mohawk": { total: "145", MiningRate: "1%" },
    "Mohawk Orange": { total: "157", MiningRate: "1%" },
    "Mohawk Green": { total: "154", MiningRate: "1%" },
    "Mohawk Blond": { total: "150", MiningRate: "1%" },
    "Wild Orange": { total: "146", MiningRate: "1%" },
    "Wild White": { total: "135", MiningRate: "1%" },
    "Wild Blond": { total: "154", MiningRate: "1%" },
    "Shaggy Black": { total: "131", MiningRate: "1%" },
    "Shaggy Fushia": { total: "132", MiningRate: "1%" },
    "Shaggy Orange": { total: "144", MiningRate: "1%" },
  },
  Hat: {
    "IOTX Cap": { total: "779", MiningRate: "7%" },
    "IOTX Bandana": { total: "817", MiningRate: "8%" },
    "Bandana Blue": { total: "783", MiningRate: "7%" },
    "Cowboy": { total: "840", MiningRate: "8%" },
    "Top Hat": { total: "779", MiningRate: "7%" },
    "Knitted Cap": { total: "769", MiningRate: "7%" },
    "Cap Purple": { total: "812", MiningRate: "8%" },
    "Fedora": { total: "802", MiningRate: "8%" },
    "Driver": { total: "780", MiningRate: "7%" },
  },
  Glasses: {
    "IOTX Classics": { total: "1283", MiningRate: "12%" },
    "IOTX Epics": { total: "1237", MiningRate: "12%" },
    "Hipster": { total: "1264", MiningRate: "12%" },
    "Dork": { total: "1293", MiningRate: "12%" },
    "Pirate": { total: "1283", MiningRate: "12%" },
    "3D": { total: "1262", MiningRate: "12%" },
  },
  Earring: {
    "Pink": { total: "945", MiningRate: "12%" },
    "Blue": { total: "931", MiningRate: "9%" },
    "Gold": { total: "876", MiningRate: "8%" },
  },
  Accessories: {
    "Pipe": { total: "1020", MiningRate: "10%" },
    "Cigarette": { total: "1072", MiningRate: "10%" },
    "Mask": { total: "949", MiningRate: "9%" },
  },
};

export const NftAttributes: FC<INFTCardProps> = ({ nft, contractAddress }) => {
  const account = useActiveAccount();
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  useEffect(() => {
    if (nft && Array.isArray(nft.attributes)) {
      const formattedAttributes = nft.attributes.reduce((acc: Attribute[], attr: { trait_type: any; value: any; frequency?: string; count?: number }) => {
        if (
          typeof attr.trait_type === "string" &&
          (typeof attr.value === "string" || typeof attr.value === "number")
        ) {
          if (contractAddress === punksContractAddress) {
            const rarity = rarities[attr.trait_type]?.[attr.value];
            if (rarity) {
              acc.push({
                trait_type: attr.trait_type,
                value: attr.value,
                total: rarity.total,
                MiningRate: rarity.MiningRate,
              });
            }
          } else {
            acc.push({
              trait_type: attr.trait_type,
              value: attr.value,
              frequency: attr.frequency,
              count: attr.count,
            });
          }
        }
        return acc;
      }, []);
      setAttributes(formattedAttributes);
    }
  }, [nft, contractAddress]);

  const renderAttribute = (item: Attribute, index: number) => (
    <ThemedView key={`${item.trait_type}-${index}`} style={styles.attributeCard}>
      <ThemedText style={styles.traitType}>{item.trait_type}</ThemedText>
      <ThemedText style={styles.value}>{item.value.toString()}</ThemedText>
      {contractAddress === punksContractAddress && (
        <>
          <ThemedText style={styles.detail}>Total: {item.total}</ThemedText>
          <ThemedText style={styles.detail}>Percent: {item.MiningRate}</ThemedText>
        </>
      )}
      {contractAddress !== punksContractAddress && item.frequency && (
        <ThemedText style={styles.detail}>Frequency: {item.frequency}</ThemedText>
      )}
      {contractAddress !== punksContractAddress && item.count && (
        <ThemedText style={styles.detail}>Count: {item.count}</ThemedText>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {attributes.length > 0 && (
        <>
          <ThemedText style={styles.title}>Traits</ThemedText>
          <View style={styles.listContainer}>
            <View style={styles.columnWrapper}>
              {attributes.map((item, index) => renderAttribute(item, index))}
            </View>
          </View>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  columnWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  attributeCard: {
    width: "48%", // Adjust to fit 2 columns with some spacing
    backgroundColor: "#2d2d44",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  traitType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#a8dadc",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: "#a8dadc",
    marginBottom: 4,
  },
});