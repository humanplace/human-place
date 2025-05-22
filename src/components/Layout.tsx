
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import ColorPicker from './ColorPicker';
import { useCanvas } from '@/context/CanvasContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { state } = useCanvas();
  const navigate = useNavigate();

  // Redirect to landing page if user is not verified
  useEffect(() => {
    if (!state.isUserVerified) {
      navigate('/');
    }
  }, [state.isUserVerified, navigate]);

  // Don't render the canvas UI if user is not verified
  if (!state.isUserVerified) {
    return null;
  }

  return (
    <div className="app-container flex flex-col h-screen w-screen overflow-hidden bg-white">
      <Header />
      <main className="flex-1 overflow-hidden flex items-center justify-center bg-white">
        {children}
      </main>
      <ColorPicker />
    </div>
  );
};

export default Layout;
