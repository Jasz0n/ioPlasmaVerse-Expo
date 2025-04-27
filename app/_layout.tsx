import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { CurrencyProvider } from "@/constants/currency";
import { MarketplaceProvider } from "@/constants/marketProvider";
import { UserProvider } from "@/constants/UserProvider";
import { NftProvider } from "@/constants/NftOwnedProvider";
import { ModalProvider } from "@/constants/transactionModalProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { authState, initialized } = useAuth();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const authState2 = false;


  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      if (authState) {
        console.log("authstate",authState)

        router.replace("/(app)/(authenticated)/(tabs)");
      } else {
        router.replace("/(app)/(public)");
      }
    
    }
  }, [loaded, authState, router]);
  useEffect(() => {
    
      if (authState) {
        console.log("authstate",authState)

        router.replace("/(app)/(authenticated)/(tabs)");
      } else {
        router.replace("/(app)/(public)");
      
    
    }
  }, [ initialized, authState, router]);

  return (
    <ThirdwebProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <CurrencyProvider>
            <MarketplaceProvider>
              <UserProvider>
                <NftProvider>
                  <ThemeProvider value={DarkTheme}>
                    <ModalProvider>
                      <View style={styles.container}>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="index" redirect={false} />
                          <Stack.Screen name="(app)/(authenticated)" />
                          <Stack.Screen name="(app)/(public)" />
                          <Stack.Screen name="+not-found" />
                        </Stack>
                      </View>
                    </ModalProvider>
                  </ThemeProvider>
                </NftProvider>
              </UserProvider>
            </MarketplaceProvider>
          </CurrencyProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ThirdwebProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});