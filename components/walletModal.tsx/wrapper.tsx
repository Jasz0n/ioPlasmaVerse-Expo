// app/components/WalletConnectWrapper.tsx
"use client";
import React, { useState, useEffect } from "react";
import { ConnectEmbed } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import axios from "axios";
import { Colors } from "@/constants/Colors";
import { client } from "@/constants/thirdweb";
import { createWallet, getUserEmail, inAppWallet } from "thirdweb/wallets";
import { createAuth } from "thirdweb/auth";
import { useAuth } from "@/providers/AuthProvider";
import { ThemedText } from "../ThemedText";


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
		
	}),
	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet", {
		appMetadata: {
			name: "Thirdweb RN Demo",
		},
		mobileConfig: {
			callbackURL: "com.thirdweb.demo://",
		},
		walletConfig: {
			options: "smartWalletOnly",
		},
	}),
	createWallet("me.rainbow"),
	createWallet("com.trustwallet.app"),
	createWallet("io.zerion.wallet"),
];

const thirdwebAuth = createAuth({
	domain: "localhost:3000",
	client,
});



let isLoggedIn = false;

export function WalletConnectWrapper() {
  const account = useActiveAccount();
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userExist, onRegister, signIn,signOut, authState } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);


 
  useEffect(() => {
      const fetchUserEmail = async () => {
        if (account?.address) {
          console.log("Wallet connected:", account.address);
          setIsFetching(true);
          try {
            // Use getUserEmail as provided
            const fetchedEmail = await getUserEmail({ client });
            console.log("Email fetched:", fetchedEmail);
            if (fetchedEmail) {
              const exist = await userExist(fetchedEmail, account.address)
              if (exist.message === "User not exist") {
                const register = await onRegister(fetchedEmail, account.address)
                console.log("register", register)
                if (register) {
                  signIn(fetchedEmail, account.address)
                }
              } else if (exist.message === "User exists") {
                  signIn(fetchedEmail, account.address)
              }
            }
          } catch (e: any) {
            console.error("Failed to fetch email:", e.message);
            setNeedsEmail(true);
            setUserEmail(null);
          } finally {
            setIsFetching(false);
          }
        }
      };
  
      fetchUserEmail();
    }, [account?.address]);
 
  

  return (
    <View style={styles.container}>
       <ThemedText>
        Connect to ioPlasmaVerse
       </ThemedText>
      <ConnectEmbed
				client={client}
				theme={ "dark"}
        
        auth={{
					async doLogin(params) {
						// fake delay
						await new Promise((resolve) => setTimeout(resolve, 2000));
						const verifiedPayload = await thirdwebAuth.verifyPayload(params);
						isLoggedIn = verifiedPayload.valid;
					},
					async doLogout() {
						isLoggedIn = false;
					},
					async getLoginPayload(params) {
						return thirdwebAuth.generatePayload(params);
					},
					async isLoggedIn(address) {
						return isLoggedIn;
					},
				}}
        
        />   
            
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  input: {
    backgroundColor: "#2A2A2A",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    width: "100%",
    marginVertical: 10,
    fontFamily: "SpaceMono",
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: {
    backgroundColor: "#888888",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "SpaceMono",
  },
  email: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: "SpaceMono",
  },
  errorText: {
    fontSize: 12,
    marginTop: 10,
    fontFamily: "SpaceMono",
  },
});