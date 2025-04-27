import { Image, StyleSheet, View, useColorScheme } from "react-native";

import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  useActiveAccount,
  useConnect,
  useDisconnect,
  useActiveWallet,
  ConnectButton,
  lightTheme,
  ConnectEmbed,
} from "thirdweb/react";
import {
  getUserEmail,
  hasStoredPasskey,
  inAppWallet,
} from "thirdweb/wallets/in-app";
import { baseSepolia, ethereum } from "thirdweb/chains";
import PostFeed from "@/components/socialPost/PostFeedMap";
import NotificationFeed from "@/components/User/notificationFeed";
import DappBrowserScreen from "@/components/walletModal.tsx/connectScreen";

const wallets = [
  inAppWallet({
  auth: {
    options: [
    "google",
    "facebook",
    "discord",
    "telegram",
    "email",
    "phone",
    "passkey",
    ],
    passkeyDomain: "thirdweb.com",
  },
  smartAccount: {
    chain: baseSepolia,
    sponsorGas: true,
  },
  }),
  
];



// fake login state, this should be returned from the backend
let isLoggedIn = false;

export default function HomeScreen() {
  const account = useActiveAccount();
  const theme = useColorScheme();
  const mimo = "https://mimo.exchange/swap";
  const sc  = "https://d2jhbtit8chvf8.cloudfront.net/starcrazy/9699a1ca/web-mobile/index.html";
  return (
  <ParallaxScrollView
    headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
    headerImage={
    <Image
      source={require("@/assets/images/title.png")}
      style={styles.reactLogo}
    />
    }
  >
    
    
    
    <View style={{ gap: 2 }}>
     <DappBrowserScreen/>	
     
    </View>
   
    <View style={{ height: 16 }} />
    
    
    
    <View style={{ height: 16 }} />
    
  </ParallaxScrollView>
  );
}



const styles = StyleSheet.create({
  titleContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  },
  stepContainer: {
  gap: 8,
  marginBottom: 8,
  },
  reactLogo: {
  height: "100%",
  width: "100%",
  bottom: 0,
  left: 0,
  position: "absolute",
  },
  rowContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 24,
  justifyContent: "space-evenly",
  },
  tableContainer: {
  width: "100%",
  },
  tableRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 4,
  },
  leftColumn: {
  flex: 1,
  textAlign: "left",
  },
  rightColumn: {
  flex: 1,
  textAlign: "right",
  },
});