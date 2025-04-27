import { View } from 'react-native';
import { Thread, Channel } from 'stream-chat-expo';
import { useAtom } from 'jotai';
import { Stack } from 'expo-router';
import { selectedChannelAtom, selectedThreadAtom } from '@/utils/atom';

const Page = () => {
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);

  return (
    <View>
      <Stack.Screen options={{ title: 'Thread' }} />
      <Channel channel={selectedChannel} thread={selectedThread} threadList>
        <Thread />
      </Channel>
    </View>
  );
};
export default Page;
