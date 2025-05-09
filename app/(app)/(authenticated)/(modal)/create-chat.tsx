import { View, Text, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useChatContext } from 'stream-chat-expo';

const Page = () => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const { client } = useChatContext();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await client.queryUsers({ role: 'user' });
      setUsers(users.users);
    };
    loadUsers();
  }, []);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 15);

    const channel = client.channel('messaging', randomId, {
      name: channelName.trim(),
      description: description.trim(),
      image:
        'https://plus.unsplash.com/premium_photo-1683865775849-b958669dca26?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      members: [{ user_id: client.user!.id, channel_role: 'admin' }],
      channelType: 'messaging',
    });
    channel.create();
    router.dismiss();
  };

  const handleDirectConversation = async (userId: string) => {
    const channel = client.channel('messaging', `${client.user!.id}-${userId}`, {
      members: [
        { user_id: client.user!.id, channel_role: 'admin' },
        { user_id: userId, channel_role: 'member' },
      ],
      name: client.user!.name,
    });
    await channel.create();
    router.dismiss();
  };

  return (
    <View >
      <Text >Channel Name</Text>
      <TextInput
        value={channelName}
        onChangeText={setChannelName}
        placeholder="Enter channel name"
      />

      <Text >Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Enter channel description"
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        onPress={handleCreateChannel}
        disabled={!channelName.trim() || !description.trim()}>
        <Text>Create Channel</Text>
      </TouchableOpacity>

      <View >
        <View />
        <Text >or</Text>
        <View />
      </View>

      <Text >Start a direct conversation</Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleDirectConversation(item.id)}
            >
            <Text >{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Page;