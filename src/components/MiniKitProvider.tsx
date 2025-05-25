import { ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  // Initialize MiniKit immediately so `MiniKit.isInstalled()` reflects the
  // correct status during the first render.
  if (!MiniKit.isInstalled()) {
    MiniKit.install();
  }

  return <>{children}</>;
}
