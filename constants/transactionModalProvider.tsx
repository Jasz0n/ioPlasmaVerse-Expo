import React, { createContext, useContext, useState, ReactNode } from "react";
import TransactionModal from "@/components/transaction/transaction";
import ProductCardModal from "@/components/NFT/NftDetails";
import { WalletDetailsModal } from "@/components/walletModal.tsx/walledModal";
import AskPlasmaModal from "@/components/walletModal.tsx/askAiModal";
import PostCardComment from "@/components/socialPost/PostCardModal";
import { ConnectedWalletDetails } from "thirdweb/dist/types/react/web/ui/ConnectWallet/Details";
import { ConnectWalletModal } from "@/components/walletModal.tsx/ConnectWalletModal";

// Define the possible modal types and their data
type ModalType = "transaction" | "productCard" | "walletDetails" | "askPlasma" | "postCardComment" | "connectWallet" | null;

interface TransactionModalData {
  type: "transaction";
  transactionHash: string;
  from: string;
  to: string;
  chainId: number;
}

interface ProductCardModalData {
  type: "productCard";
  nft: {
    tokenId: bigint;
    contractAddress: string;
    chainId: number;
    listing?: any;
    auction?: any;
  };
}

interface WalletDetailsModalData {
  type: "walletDetails";
}

interface ConnectWalletModalData {
  type: "connectWallet";
}

interface AskPlasmaModalData {
  type: "askPlasma";
}

interface PostCardCommentModalData {
  type: "postCardComment";
  userImage?: string;
  postId: number;
  userId: string;
  mediaUrl: string;
  content: string;
  createdAt: string;
  contractAddress?: string;
  chainId?: string;
}

export type ModalData =
  | TransactionModalData
  | ProductCardModalData
  | WalletDetailsModalData
  | AskPlasmaModalData
  | PostCardCommentModalData
  | ConnectWalletModalData
  | null;

interface ModalContextType {
  openModal: (
    modalData: TransactionModalData | ProductCardModalData | WalletDetailsModalData | AskPlasmaModalData | PostCardCommentModalData | ConnectWalletModalData
  ) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>(null);

  const openModal = (
    data: TransactionModalData | ProductCardModalData | WalletDetailsModalData | AskPlasmaModalData | PostCardCommentModalData | ConnectWalletModalData
  ) => {
    setModalData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalData(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && modalData && (
        <>
          {modalData.type === "transaction" && (
            <TransactionModal
              isOpen={isOpen}
              onClose={closeModal}
              transactionHash={modalData.transactionHash}
              from={modalData.from}
              to={modalData.to}
              chainId={modalData.chainId}
            />
          )}
          {modalData.type === "connectWallet" && (
            <ConnectWalletModal
              isOpen={isOpen}
              onClose={closeModal}
              
            />
          )}
          {modalData.type === "productCard" && (
            <ProductCardModal
              isOpen={isOpen}
              onClose={closeModal}
              nft={modalData.nft}
            />
          )}
          {modalData.type === "walletDetails" && (
            <WalletDetailsModal
              isOpen={isOpen}
              onClose={closeModal}
            />
          )}
          {modalData.type === "askPlasma" && (
            <AskPlasmaModal
              isOpen={isOpen}
              chainId={1}
              contractAddress="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
              onClose={closeModal}
            />
          )}
          {modalData.type === "postCardComment" && (
            <PostCardComment
              isOpen={isOpen}
              onClose={closeModal}
              userImage={modalData.userImage}
              postId={modalData.postId}
              userId={modalData.userId}
              mediaUrl={modalData.mediaUrl}
              content={modalData.content}
              createdAt={modalData.createdAt}
            />
          )}
        </>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};