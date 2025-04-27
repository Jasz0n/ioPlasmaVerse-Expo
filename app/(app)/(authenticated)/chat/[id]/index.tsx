import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { Channel, MessageList, MessageInput, DefaultStreamChatGenerics, MessageProps, useAttachmentPickerContext } from 'stream-chat-expo';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { selectedChannelAtom, selectedThreadAtom } from '@/utils/atom';
import { useChatContext } from 'stream-chat-expo';

// Utility to ensure logs are visible in all environments
const logToConsole = (message: string, data?: any) => {
  console.log(`[CHAT_DEBUG] ${message}`, data || '');
  console.info(`[CHAT_DEBUG] ${message}`, data || '');
  console.warn(`[CHAT_DEBUG] ${message}`, data || '');
};

// Styles for dark theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C2526',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    margin: 10,
    fontSize: 16,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C2526',
  },
  messageListContainer: {
    backgroundColor: '#1C2526',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  messageText: {
    color: '#FFFFFF',
    backgroundColor: '#3A4647',
    padding: 8,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageMeta: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  messageInputContainer: {
    backgroundColor: '#2D3536',
    borderTopWidth: 1,
    borderTopColor: '#3A4647',
  },
});

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useChatContext();
  // Remove unused destructuring
  const { isTherapist: _ } = useAuth();
  const isTherapist = true; // Hardcoded to true as per your change
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const { setTopInset } = useAttachmentPickerContext();

  // Verify client setup
  useEffect(() => {
    if (!client?.userID) {
      logToConsole('Stream client not initialized or user not connected');
      setError('Chat client not ready');
      setIsLoading(false);
      return;
    }
    logToConsole('Stream client initialized', { userID: client.userID });
  }, [client]);

  // Initialize channel
  useEffect(() => {
    if (!id) {
      logToConsole('No channel ID provided');
      setError('No channel ID provided');
      setIsLoading(false);
      return;
    }

    const initializeChannel = async () => {
      try {
        logToConsole('Initializing channel', { id });
        const newChannel = client.channel('messaging', id);
        logToConsole('Channel created', { cid: newChannel.cid });

        // Watch channel to fetch state
        const state = await newChannel.watch();
        logToConsole('Channel watched successfully', {
          data: newChannel.data,
          memberCount: Object.keys(state.members).length,
        });

        // Log initial messages
        const initialMessages = newChannel.state.messages;
        logToConsole('Initial messages', {
          count: initialMessages.length,
          messages: initialMessages,
        });
        setMessages(initialMessages);

        setChannel(newChannel);
        setIsLoading(false);
      } catch (err: any) {
        logToConsole('Failed to initialize channel', err.message || err);
        setError('Failed to load channel: ' + (err.message || 'Unknown error'));
        setIsLoading(false);
      }
    };

    initializeChannel();

    // Cleanup
    return () => {
      if (channel) {
        logToConsole('Cleaning up channel', channel.cid);
        channel.off();
      }
    };
  }, [client, id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event: any) => {
      logToConsole('New message received', event.message);
      setMessages([...channel.state.messages]);
    };

    channel.on('message.new', handleNewMessage);

    return () => {
      logToConsole('Unsubscribing from message.new');
      channel.off('message.new', handleNewMessage);
    };
  }, [channel]);

  // Handle message sending
  const handleSendMessage = async (messageData: any) => {
    try {
      logToConsole('Sending message', messageData);
      const response = await channel.sendMessage(messageData);
      logToConsole('Message sent successfully', response);
      setMessages([...channel.state.messages]);
      return response;
    } catch (err: any) {
      logToConsole('Failed to send message', err.message || err);
      setError('Failed to send message: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Handle thread selection via MessageList's onThreadSelectMessage
  const handleThreadSelectMessage = (message: any) => {
    logToConsole('Thread selected via message', message);
    setSelectedThread(message);
    setSelectedChannel(channel);
    router.push(`/chat/${id}/thread`);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.errorText}>Loading channel...</Text>
      </View>
    );
  }

  // Error state
  if (error || !channel) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Channel not found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: channel?.data?.messaging || 'Chat',
          headerStyle: { backgroundColor: '#1C2526' },
          headerTintColor: '#FFFFFF',
          headerRight: () => {
            logToConsole('Rendering headerRight', { isTherapist }); // Debug log
            return (
              <>
                {isTherapist ? (
                  <Link href={`/chat/${id}/manage`} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#4ECDC4', fontSize: 16 }}>Manage</Text>
                  </Link>
                ) : null}
              </>
            );
          },
        }}
      />

      <Channel
        channel={channel}
        doSendMessageRequest={async (channelId, messageData) => {
          logToConsole('Custom send message request', { channelId, messageData });
          return handleSendMessage(messageData);
        }}
        
      >
        <MessageList />
        <MessageInput />
        {/* Wrap MessageList in a View to apply background color */}
        
      </Channel>
      </SafeAreaView>
  );
};

export default Page;