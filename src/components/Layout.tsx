
import React from 'react';
import Header from './Header';
import ColorPicker from './ColorPicker';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container flex flex-col h-screen w-screen bg-white">
      <Header />
      <main className="flex-1 overflow-hidden flex items-center justify-center bg-white">
        {children}
      </main>
      <ColorPicker />
    </div>
  );
};

export default Layout;
