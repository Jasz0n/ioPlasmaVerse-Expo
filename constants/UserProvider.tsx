"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import { SocialUrl } from "./types";
import { Platform } from "react-native";

// Define the UserData type
export type UserData = {
  name: string;
  info: string;
  location: string;
  receiverAddress: string;
  profileImage?: string;
  userId: string;
  isUser: boolean;
  socialUrls?: SocialUrl[];
  pushToken: string;
  notificationCount:string;
};

// Define the context type
type UserContextType = {
  userData?: UserData;
  userName?: string;
  userExists?: boolean;
  expoPushToken?: string; // Add push token to context
  notificationCount: string;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const account = useActiveAccount(); // Hardcoded for testing
  const [userData, setUserData] = useState<UserData | undefined>(undefined);
  const [userName, setUserName] = useState<string>("");
  const [notificationCount, setNotificationCount] = useState<string>("");
  const [userExists, setUserExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [expoPushToken, setExpoPushToken] = useState<string>("");

  // ✅ Correctly register push notifications
 

  const fetchUserData = useCallback(async () => {
    if (!account) {
      console.error("❌ Error: Account or address is undefined.");
      setUserData(undefined);
      setUserExists(false);
      return;
    }
  
    try {
      console.log("🔍 Fetching user data...");
      setLoading(true);
  
      const url = `https://ioplasmaverse.com/api/user/${account.address}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        if (response.status === 404) {
          console.log("ℹ️ User not found for address:", account);
          setUserExists(false);
          setUserData(undefined);
        } else {
          console.error(`❌ Failed to fetch user data. HTTP Status: ${response.status}`);
        }
        return;
      }
  
      const data: UserData = await response.json();
      setUserData(data);
      setUserName(data.name);
      setUserExists(true);
      setNotificationCount(data.notificationCount)
      // ✅ Check if the push token has changed before sending
     
    } catch (error: any) {
      console.error("❌ Error fetching user data:", error.message || error);
    } finally {
      setLoading(false);
    }
  }, [account, expoPushToken]);
  

  useEffect(() => {
    if (account) {
      fetchUserData();
    } else {
      setUserData(undefined);
      setUserExists(false);
      setUserName("");
    }
  }, [account, fetchUserData]);

  return (
    <UserContext.Provider
      value={{
        userData,
        userName,
        notificationCount,
        userExists,
        expoPushToken, // ✅ Include push token in context
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
