
import React from 'react';
import Header from './Header';
import ColorPicker from './ColorPicker';
import { CanvasProvider } from '@/context/CanvasContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  
  return (
    <CanvasProvider>
      <div className="app-container flex flex-col h-screen w-screen overflow-hidden bg-white">
        <Header />
        <main className={`flex-1 overflow-hidden flex items-center justify-center bg-white ${!isMobile ? 'p-4' : ''}`}>
          <div className={`${!isMobile ? 'max-w-3xl w-full h-full border border-gray-200 rounded-lg shadow-sm' : 'w-full h-full'}`}>
            {children}
          </div>
        </main>
        <ColorPicker />
      </div>
    </CanvasProvider>
  );
};

export default Layout;
