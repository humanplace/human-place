import { ReactNode, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize MiniKit - this is required for MiniKit.isInstalled() to return true
    // Passing appId is optional but recommended
    console.log('Initializing MiniKit...');
    MiniKit.install();
    console.log('MiniKit install() called');
  }, []);

  return <>{children}</>;
} 