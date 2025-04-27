"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { NFT as NFTType, ThirdwebContract, readContract, resolveMethod } from "thirdweb";
import { AppMint, ChattApp } from "@/const/contracts";
import UserCard from "@/components/BuyMeACoffee/BuyMeACoffee";
import randomColor from "@/util/randomColor";
import styles from "./ProfileImage.module.css";
import { BigNumber } from "ethers";
import { getContractMetadata } from "thirdweb/extensions/common";
import { getNFT } from "thirdweb/extensions/erc721";


const [randomColor1, randomColor2, randomColor3, randomColor4] = [
  randomColor(),
  randomColor(),
  randomColor(),
  randomColor(),
];

interface ProfilePageProps {
  ownerAddresse: string;
  
}

const PencilIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="pencil w-6 h-6">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l-6 6H2V6z" clipRule="evenodd"></path>
  </svg>
);

const ProfileImage: React.FC<ProfilePageProps> = ({ ownerAddresse }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nft, setNFT] = useState<NFTType | null>(null);
  const [ownedNftsProfile, setOwnedNftsProfile] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, any> | undefined>(undefined);

  const fetchNFTData = useCallback(async (tokenId: string) => {
    if (tokenId) {
        try {
            const contract = ChattApp;

            // Fetch contract metadata
            const contractMetadata = await getContractMetadata({ contract });
            const contractName = contractMetadata.name;

            // Fetch NFT data
            const nftData = await getNFT({
                contract,
                tokenId: BigInt(tokenId),
                includeOwner: true,
            });


            if (nftData && nftData.metadata) {
                const metadata = nftData.metadata as any;
                if (metadata.attributes) {
                    setAttributes(metadata.attributes);
                } 
            }
        } catch (error) {
            console.error("Error fetching NFT:", error);
        }
    }
}, []);

  // Get the contract
  const fetchUserInfo = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
      if (!signerAddress) return;
      setIsLoading(true);
      try {
          const userInfo = await readContract({
              contract,
              method: resolveMethod("getUserInfo"),
              params: [signerAddress]
          }) as unknown as any[];


          if (userInfo && userInfo.length > 0) {
              const tokenId = BigNumber.from(userInfo[0]).toString();
              const userName = userInfo[1];
              const timestamp = new Date(BigNumber.from(userInfo[2]).toNumber() * 1000).toLocaleString();

              

              // Fetch NFT data using the tokenId
              fetchNFTData(tokenId);
          } else {
             
          }
      } catch (error) {
          console.error("Error fetching user info:", error);
         
      } finally {
          setIsLoading(false);    
      }
  }, [fetchNFTData]);

  
  

  useEffect(() => {
      if (ownerAddresse) {
          const signerAddress = ownerAddresse;
          fetchUserInfo(signerAddress, ChattApp);
      }
  }, [ownerAddresse, fetchUserInfo]);


  const fetchUsername = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    setIsLoading(true);
    try {
        const usernameData = await readContract({
            contract,
            method: resolveMethod("getUserInfo"),
            params: [signerAddress]
        }) as unknown as string[];

        if (usernameData && usernameData.length > 0) {
            setUserName(usernameData[0]);

        } else {
            setUserName("Unknown user");
        }
    } catch (error) {
    } finally {
        setIsLoading(false);
    }
}, []);
  const account = ownerAddresse;
  


  const fetchUserProfile = useCallback(async (signerAddress: string | undefined, contract: ThirdwebContract) => {
    if (!signerAddress) return;
    try {
      const imageUrl = await readContract({
        contract,
        method: resolveMethod("getActiveProfileImage"),
        params: [signerAddress]
      }) as unknown as string;
      console.log("Profile image fetched:", imageUrl);

      if (imageUrl.startsWith("ipfs://")) {
        const ipfsData = await fetchIPFSData(imageUrl);
        setOwnedNftsProfile(ipfsData);
      } else {
        setOwnedNftsProfile({ image: imageUrl });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user existence:', error);
      setIsLoading(false);
    }
  }, []);

  const fetchIPFSData = async (ipfsUrl: string) => {
    const url = `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`;
    const response = await fetch(url);
    return await response.json();
  };

  useEffect(() => {
    if (account) {
      fetchUserProfile(account, AppMint);
      fetchUsername(account, ChattApp);

    } 
  }, [account, fetchUserProfile,fetchUsername]);

  

  return (
    <div className="items-center justify-center pt-20px min-w-[120px] min-h-[180px]">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {ownedNftsProfile ? (
              <Image
                src={ownedNftsProfile?.image}
                alt="Profile"
                className={styles.profilePicture}
                width={45}
                height={45}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                }}
              />
            ) : (
              <div
                className={styles.profilePicture}
                style={{
                  background: `linear-gradient(90deg, ${randomColor3}, ${randomColor4})`,
                  width: '45px',
                  height: '45px',
                }}
              />
            )}
  
            <div className="text-white font-bold text-md md:text-lg">
              {attributes?.userName}
            </div>
          </div>
  
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full h-45 w-45 object-cover mt-2"
            title="Change photo"
          >
            <PencilIcon />
          </button>
  
          {modalOpen && <UserCard onClose={() => setModalOpen(false)} ownerAddress={ownerAddresse} />}
  
          {error && <div className="text-red-500">{error}</div>}
        </>
      )}
    </div>
  );
};  

export default ProfileImage;
