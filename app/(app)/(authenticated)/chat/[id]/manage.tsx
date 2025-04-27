import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useChatContext } from 'stream-chat-expo';
import { useEffect, useState } from 'react';

// Utility to ensure logs are visible in all environments
const logToConsole = (message: string, data?: any) => {
  console.log(`[MANAGE_DEBUG] ${message}`, data || '');
  console.info(`[MANAGE_DEBUG] ${message}`, data || '');
  console.warn(`[MANAGE_DEBUG] ${message}`, data || '');
};

// Styles for dark theme, consistent with chat.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C2526',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C2526',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    margin: 10,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4647',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
});

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useChatContext();
  const channel = client.channel('messaging', id);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all users and check if they are in the channel
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        logToConsole('Querying users with role: user');
        const userQuery = await client.queryUsers({ role: 'user' });
        logToConsole('Users queried', { userCount: userQuery.users.length, users: userQuery.users });

        logToConsole('Querying channel members');
        const channelUsers = await channel.queryMembers({});
        logToConsole('Channel members queried', {
          memberCount: channelUsers.members.length,
          members: channelUsers.members,
        });

        const userList = userQuery.users.map((user) => {
          const isInChannel = channelUsers.members.some((member) => member.user?.id === user.id);
          return {
            ...user,
            isInChannel,
          };
        });

        logToConsole('User list prepared', { userList });
        setUsers(userList);
      } catch (err: any) {
        logToConsole('Failed to load users', err.message || err);
        setError('Failed to load users: ' + (err.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    if (id && client) {
      loadUsers();
    }
  }, [id, client, channel]);

  // Add user to channel
  const addUserToChannel = async (userId: string) => {
    try {
      logToConsole('Adding user to channel', { userId });
      await channel.addMembers([userId], {
        text: 'Welcome a new member!',
      });
      Alert.alert('Success', 'User added to channel');

      // Refresh the user list
      const channelUsers = await channel.queryMembers({});
      const updatedUsers = users.map((user) => ({
        ...user,
        isInChannel: channelUsers.members.some((member) => member.user?.id === user.id),
      }));
      setUsers(updatedUsers);
    } catch (err: any) {
      logToConsole('Failed to add user', err.message || err);
      Alert.alert('Error', 'Failed to add user: ' + (err.message || 'Unknown error'));
    }
  };

  // Remove user from channel
  const removeUserFromChannel = async (userId: string) => {
    try {
      logToConsole('Removing user from channel', { userId });
      await channel.removeMembers([userId]);
      Alert.alert('Success', 'User removed from channel');

      // Refresh the user list
      const channelUsers = await channel.queryMembers({});
      const updatedUsers = users.map((user) => ({
        ...user,
        isInChannel: channelUsers.members.some((member) => member.user?.id === user.id),
      }));
      setUsers(updatedUsers);
    } catch (err: any) {
      logToConsole('Failed to remove user', err.message || err);
      Alert.alert('Error', 'Failed to remove user: ' + (err.message || 'Unknown error'));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.errorText}>Loading users...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Channel',
          headerStyle: { backgroundColor: '#1C2526' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.userName}>{item.name || item.id}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.addButton, item.isInChannel && styles.disabledButton]}
                onPress={() => addUserToChannel(item.id)}
                disabled={item.isInChannel}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.removeButton, !item.isInChannel && styles.disabledButton]}
                onPress={() => removeUserFromChannel(item.id)}
                disabled={!item.isInChannel}
              >
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.container}>
            <Text style={styles.errorText}>No users found</Text>
          </View>
        )}
      />
    </View>
  );
};

export default Page;