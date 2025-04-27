import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

import type { ChannelFilters, Channel as StreamChannel } from 'stream-chat';
import { useAuth } from '@/providers/AuthProvider';
import { DefaultStreamChatGenerics, useChatContext, ChannelListMessengerProps, ChannelList } from 'stream-chat-expo';
import { useRouter } from 'expo-router';

// Define the generics you'll be using (optional unless you've customized the client types)
type StreamGenerics = DefaultStreamChatGenerics;

export default function ChannelListScreen(): JSX.Element {
  const { authState } = useAuth(); // Your custom auth hook
  const { client } = useChatContext<StreamGenerics>();
  const user = authState.user_id;
  const [filters, setFilters] = useState<ChannelFilters<StreamGenerics>>({});
  const router = useRouter();
  useEffect(() => {
    console.log('Mounted ChannelListScreen');

    if (!client?.user?.id) {
      console.warn('Chat client has no connected user. Make sure connectUser was called.');
      return;
    }

    console.log('Current chat user:', client.user);

    const userId = client.user.id;
    const newFilters: ChannelFilters<StreamGenerics> = { members: { $in: [userId] } };
    console.log('Setting filters:', newFilters);
    setFilters(newFilters);

    return () => {
      console.log('Unmounted ChannelListScreen');
    };
  }, [client]);

  const handleSelectChannel = (channel: StreamChannel<StreamGenerics>) => {
    console.log('Selected channel:', channel?.cid);
    // You could use a router here, for example: router.push(`/chat/${channel?.cid}`);
  };

  

  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Channel List</Text>
      <ChannelList
        filters={filters}
        onSelect={(channel) => router.push(`/(app)/(authenticated)/chat/${channel.id}`)}
       
        LoadingIndicator={() => <Text style={styles.loading}>Loading channels...</Text>}
        LoadingErrorIndicator={({ error }) => (
          <Text style={styles.error}>Error loading channels: </Text>
        )}
        EmptyStateIndicator={() => <Text style={styles.empty}>No channels to show.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  loading: { padding: 16, textAlign: 'center' },
  error: { padding: 16, color: 'red', textAlign: 'center' },
  empty: { padding: 16, textAlign: 'center', color: 'gray' },
});
