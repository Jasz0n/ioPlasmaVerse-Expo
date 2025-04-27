import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, FlatList, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { client } from '@/constants/thirdweb';
import { chainData, Token } from '@/constants/types';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '@/constants/UserProvider';
import { BalanceCardErc20 } from '../Token/ballanceCardERC20';
import { BalanceCardNative } from '../Token/ballanceCard';
import { useActiveAccount } from 'thirdweb/react';
import { ZERO_ADDRESS } from 'thirdweb';

interface UserProfile {
  name: string;
  info: string;
  location: string;
  receiverAddress: string; // Fixed typo
  profileImage?: string;
  id: string;
  isUser: boolean;
}

interface ERC20Token {
  contractAddress: string;
  balance: string;
  chainId: number;
  type: 'ERC-20';
}

export default function UserWalletManager() {
  const account = useActiveAccount(); // Hardcoded for testing
  const { userData } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainKey, setSelectedChainKey] = useState<string>('Iotex');
  const [selectedWallet, setSelectedWallet] = useState<'account' | 'receiverAddress'>('account');
  const [erc20Tokens, setErc20Tokens] = useState<ERC20Token[]>([]);

  const selectedChain = chainData[selectedChainKey];
  const address = selectedWallet === 'account' ? account?.address : userData?.receiverAddress || account?.address;

  // Fetch user data
  

  // Fetch ERC-20 tokens
  const fetchOwnedNfts = async (chainId: number, walletAddress: string) => {
    const baseUrl = `https://insight.thirdweb.com/v1`;
    let allERC20: any[] = [];
    const clientId = process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || "";

    try {
      console.log("Fetching NFTs for wallet:", walletAddress, "on chainId:", chainId);

      // Fetch ERC-20 tokens
      const erc20Response = await fetch(
        `${baseUrl}/tokens/erc20/${walletAddress}?chain=1&chain=10&chain=8453&chain=137&limit=100&metadata=false&clientId=${clientId}`,
        {
          headers: {
            'x-client-id': process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || '',
          },
        }
      );

      console.log("ERC-20 Response Status:", erc20Response.status);
      const erc20ResponseBody = await erc20Response.json();
      console.log("ERC-20 Response Body:", erc20ResponseBody);

      if (!erc20ResponseBody || !Array.isArray(erc20ResponseBody.data)) {
        console.error("Invalid ERC-20 data format:", erc20ResponseBody);
        throw new Error("Expected ERC-20 response to have a 'data' array.");
      }

      const erc20 = erc20ResponseBody.data
        .filter((token: any) => Number(token.balance) > 0) // Only include tokens with balance > 0
        .map((token: any) => ({
          contractAddress: token.tokenAddress,
          balance: token.balance,
          chainId: token.chainId,
          type: 'ERC-20',
        }));

      allERC20 = [...erc20];
      console.log("Fetched ERC-20 Tokens:", allERC20);
      return allERC20;
    } catch (error) {
      console.error("Error fetching owned ERC-20 tokens:", error);
      return [];
    }
  };

  // Fetch user data and ERC-20 tokens on mount or when chain/wallet changes
  
  useEffect(() => {
    if (!address) return;
    const fetchTokens = async () => {
      const tokens = await fetchOwnedNfts(selectedChain.chainId, address);
      setErc20Tokens(tokens);
    };
    fetchTokens();
  }, [selectedChainKey, selectedWallet, userData]);

  // Render ERC-20 token card
  const renderErc20Card = ({ item }: { item: ERC20Token }) => (
    <BalanceCardErc20 balance={item.balance || "0"}  address={item.contractAddress.toString() || ZERO_ADDRESS} client={client} chainId={item.chainId || 1}/>
  );

  if (!account) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>User Wallet</ThemedText>
        </ThemedView>
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.message}>Please connect your wallet to view your wallet.</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>User Wallet</ThemedText>
      </ThemedView>

      {/* Network Selector */}
      <ThemedView style={styles.networkSelectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.networkSelector}>
          {Object.keys(chainData).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.networkButton, selectedChainKey === key && styles.networkButtonActive]}
              onPress={() => setSelectedChainKey(key)}
              accessibilityLabel={`Select ${chainData[key].name} network`}
            >
              {chainData[key].image ? (
                <Image
                  source={chainData[key].image}
                  style={[styles.networkImage, selectedChainKey === key && styles.networkImageActive]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.networkImage, styles.placeholderImage]}>
                  <ThemedText style={styles.placeholderText}>?</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Wallet Selector */}
      <ThemedView style={styles.pickerContainer}>
        <ThemedView style={styles.pickerWrapper}>
          <ThemedText style={styles.pickerLabel}>Wallet</ThemedText>
          <Picker
            selectedValue={selectedWallet}
            onValueChange={(itemValue) => setSelectedWallet(itemValue as 'account' | 'receiverAddress')}
            style={styles.picker}
          >
            <Picker.Item label="Account" value="account" />
            <Picker.Item label="Receiver" value="receiverAddress" />
          </Picker>
        </ThemedView>
      </ThemedView>

      {/* Balances Section */}
      <ThemedView style={styles.contentContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          {selectedWallet === 'account'
            ? `Your Balances (Account: ${account?.address.slice(0, 6)}...)`
            : `Receiver Balances (Address: ${userData?.receiverAddress?.slice(0, 6) || 'N/A'}...)`}
        </ThemedText>

        {/* Native Balance Card */}
        <BalanceCardNative
          token={selectedChain.nativeToken}
          address={address || ""}
          client={client}
          chainId={selectedChain.chainId}
        />

        {/* ERC-20 Tokens */}
        {erc20Tokens.length > 1 ? (
          <FlatList
          data={erc20Tokens}
          renderItem={renderErc20Card}
          keyExtractor={(item) => `${item.contractAddress.toString() || ""}-${item.chainId}`} // Composite key
          scrollEnabled={false}
        />
        ) : (
          <ThemedText style={styles.noTokensText}>No ERC-20 tokens found.</ThemedText>
        )}
      </ThemedView>

      {/* Error Message */}
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background to match the dApp theme
  },
  titleContainer: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    color: '#fff', // White text for contrast
  },
  networkSelectorContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  networkSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkImage: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderRadius: 18,
    borderColor: '#555', // Subtle border for inactive state
    backgroundColor: '#000', // Black background for the image
  },
  networkImageActive: {
    borderColor: '#fff', // White border for active state
  },
  placeholderImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#A0A0A0',
  },
  networkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#2A2A2A',
  },
  networkButtonActive: {
    backgroundColor: '#007AFF',
  },
  networkLabel: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  networkLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerWrapper: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  pickerLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  picker: {
    color: '#fff',
    height: 44,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },
  subtitle: {
    color: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  tokenCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  tokenBalance: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  noTokensText: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 16,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});