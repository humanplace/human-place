import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TiledBackground from '@/components/TiledBackground';
import { MiniKit, VerifyCommandInput, VerificationLevel, type ISuccessResult } from '@worldcoin/minikit-js';
import { toast } from '@/hooks/use-toast';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string>('Ready');
  
  const showDebugToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
    toast({
      title: "🔍 Debug",
      description: message,
      variant,
      duration: 3000,
    });
  };

  const handleCreateClick = async () => {
    setDebugStatus('Starting verification...');
    showDebugToast('Starting handleCreateClick');
    
    // Check if MiniKit is available (running in World App)
    if (!MiniKit.isInstalled()) {
      setDebugStatus('MiniKit not installed');
      showDebugToast('MiniKit not installed', 'destructive');
      toast({
        title: "World App Required",
        description: "This app must be opened within the World App to verify your identity.",
        variant: "destructive",
      });
      return;
    }

    setDebugStatus('Showing MiniKit popup...');
    showDebugToast('MiniKit installed, showing verification popup');
    // Note: Button stays clickable until MiniKit succeeds

    try {
      // Configure the verification payload
      const verifyPayload: VerifyCommandInput = {
        action: 'human-verification',
        verification_level: VerificationLevel.Orb,
      };

      setDebugStatus('Calling MiniKit.verify() - WAITING...');
      showDebugToast('Calling MiniKit.commandsAsync.verify() - promise starting');
      
      // This is where Cancel/X might hang - but button stays clickable!
      const result = await MiniKit.commandsAsync.verify(verifyPayload);
      
      setDebugStatus('MiniKit.verify() RESOLVED!');
      showDebugToast('✅ MiniKit promise resolved!');
      showDebugToast(`Status: ${result.finalPayload?.status}`);
      
      const { finalPayload } = result;
      
      // Handle all non-success responses (error, cancelled, rejected, etc.)
      if (finalPayload.status !== 'success') {
        setDebugStatus(`Non-success status: ${finalPayload.status}`);
        showDebugToast(`Non-success status: ${finalPayload.status}`);
        showDebugToast('Returning early (no backend call)');
        // User cancelled, closed popup, or verification failed at World ID level
        // Button stays clickable - user can try again immediately
        return;
      }

      // SUCCESS! Now we disable the button and call backend
      setDebugStatus('Success! Disabling button and calling backend...');
      showDebugToast('Success status - NOW disabling button for backend call');
      setIsVerifying(true); // MOVED HERE - only disable when backend work starts

      // Send proof to our Edge Function for verification
      const response = await fetch('https://dzvsnevhawxdzxuqtdse.supabase.co/functions/v1/verify-world-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnNuZXZoYXd4ZHp4dXF0ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTMyNjIsImV4cCI6MjA2MTgyOTI2Mn0.-6dYHXxQ8VfBG6jZnjYC-pQrMx4xT9xhsA_Tav4iGRQ',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnNuZXZoYXd4ZHp4dXF0ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTMyNjIsImV4cCI6MjA2MTgyOTI2Mn0.-6dYHXxQ8VfBG6jZnjYC-pQrMx4xT9xhsA_Tav4iGRQ'
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: 'human-verification',
        }),
      });

      setDebugStatus('Backend response received');
      showDebugToast(`Backend response status: ${response.status}`);
      
      const result_backend = await response.json();

      if (result_backend.success) {
        setDebugStatus('Backend verification successful!');
        showDebugToast('Backend verification successful - navigating');
        // Verification successful - navigate to canvas (no toast needed)
        navigate('/canvas');
      } else {
        setDebugStatus('Backend verification failed');
        showDebugToast('Backend verification failed', 'destructive');
        // Backend verification failed - this is a real error worth showing
        console.error('Backend verification failed:', result_backend);
        toast({
          title: "Verification Failed",
          description: result_backend.error || "Unable to verify your identity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setDebugStatus('Exception caught!');
      showDebugToast('💥 Exception caught in try block!', 'destructive');
      showDebugToast(`Error: ${error?.message || 'Unknown error'}`, 'destructive');
      
      // Handle exceptions (X button click, network issues, etc.)
      // Button will be reset in finally block
      console.error('Verification error:', error);
    } finally {
      setDebugStatus('Finally block executing');
      showDebugToast('Finally block - resetting isVerifying to false');
      // ALWAYS reset isVerifying to ensure button is clickable again
      setIsVerifying(false);
      setTimeout(() => {
        setDebugStatus('Ready');
        showDebugToast('handleCreateClick complete');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Tiled Background */}
      <TiledBackground density={25} />
      
      {/* Content Container - positioned above the background */}
      <div className="flex flex-col h-full w-full relative z-10 bg-white/50 backdrop-blur-sm">
        {/* Logo Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          {/* Inlined SVG logo instead of external image */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 250.8 179" 
            className="w-full max-w-[250px] h-auto drop-shadow-md"
            aria-label="Human Place Logo"
          >
            <style>
              {`.st0 { fill: #ffa800; }`}
            </style>
            <g>
              <polygon className="st0" points="0 35.8 0 71.6 0 107.4 0 143.2 0 179 35.9 179 35.9 143.2 35.9 107.4 35.9 71.6 35.9 35.8 35.9 0 0 0 0 35.8"/>
              <polygon className="st0" points="71.7 143.2 71.7 179 107.5 179 107.5 143.2 107.5 107.4 71.7 107.4 71.7 143.2"/>
              <rect x="143.3" y="71.6" width="35.8" height="35.8"/>
              <polygon className="st0" points="179.1 0 143.3 0 107.5 0 71.7 0 71.7 35.8 71.7 71.6 107.5 71.6 107.5 35.8 143.3 35.8 179.1 35.8 214.9 35.8 214.9 0 179.1 0"/>
              <polygon className="st0" points="214.9 35.8 214.9 71.6 214.9 107.4 214.9 143.2 179.1 143.2 143.3 143.2 143.3 179 179.1 179 214.9 179 250.8 179 250.8 143.2 250.8 107.4 250.8 71.6 250.8 35.8 214.9 35.8"/>
            </g>
          </svg>
        </div>
        
        {/* Create Together Button Container with padding */}
        <div className="px-6 pb-12">
          {/* Debug Status Display */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Debug Status:</div>
            <div className="text-sm text-blue-600">{debugStatus}</div>
          </div>
          
          <Button 
            onClick={handleCreateClick}
            disabled={isVerifying}
            className="w-full bg-black hover:bg-gray-800 text-white py-6 h-auto rounded-xl text-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Create Together"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
