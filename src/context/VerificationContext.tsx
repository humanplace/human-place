import React, { createContext, useContext, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

interface VerificationData {
  verified: boolean;
  nullifierHash?: string;
  verificationLevel?: string;
  timestamp?: number;
}

interface VerificationContextType {
  isVerified: boolean;
  verificationData: VerificationData | null;
  setVerified: (data: VerificationData) => void;
  clearVerification: () => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

const STORAGE_KEY = 'worldIdVerified';

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading verification data:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return null;
  });

  const setVerified = (data: VerificationData) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setVerificationData(data);
    } catch (error) {
      console.error('Error storing verification data:', error);
    }
  };

  const clearVerification = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setVerificationData(null);
  };

  return (
    <VerificationContext.Provider 
      value={{
        isVerified: verificationData?.verified === true,
        verificationData,
        setVerified,
        clearVerification
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}

// Helper hook to check if we're in World App and verified
export function useWorldAppVerification() {
  const { isVerified } = useVerification();
  const isInWorldApp = MiniKit.isInstalled();
  
  return {
    isVerified,
    isInWorldApp,
    canAccess: isVerified && isInWorldApp
  };
} 