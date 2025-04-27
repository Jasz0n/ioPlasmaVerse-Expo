import { useAuth } from '@/providers/AuthProvider';
import { Stack, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useActiveAccount } from 'thirdweb/react';

const Layout = () => {
  const account = useActiveAccount();

  const { authState } = useAuth();

  if (authState?.authenticated) {
    return <Redirect href="/(app)/(authenticated)/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Login' }} />
      
    </Stack>
  );
};
export default Layout;
