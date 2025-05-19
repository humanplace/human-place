
import React from 'react';
import Header from './Header';
import ColorPicker from './ColorPicker';
import { CanvasProvider } from '@/context/CanvasContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  
  return (
    <CanvasProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
        <Header />
        <main className="flex-1 overflow-hidden flex items-center justify-center bg-white">
          {children}
        </main>
        <ColorPicker />
      </div>
    </CanvasProvider>
  );
};

export default Layout;
