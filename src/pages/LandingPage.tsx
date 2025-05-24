import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TiledBackground from '@/components/TiledBackground';
import { MiniKit, VerifyCommandInput, VerificationLevel, type ISuccessResult } from '@worldcoin/minikit-js';
import { toast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useVerification } from '@/context/VerificationContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const { setVerified } = useVerification();
  
  const handleCreateClick = async () => {
    // Check if MiniKit is available (running in World App)
    if (!MiniKit.isInstalled()) {
      toast({
        title: "World App Required",
        description: "This app must be opened within the World App to verify your identity.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Configure the verification payload
      const verifyPayload: VerifyCommandInput = {
        action: 'human-verification',
        verification_level: VerificationLevel.Orb,
      };

      // Show MiniKit verification popup
      const result = await MiniKit.commandsAsync.verify(verifyPayload);
      const { finalPayload } = result;
      
      // Handle all non-success responses (error, cancelled, rejected, etc.)
      if (finalPayload.status !== 'success') {
        // User cancelled, closed popup, or verification failed at World ID level
        // Button stays clickable - user can try again immediately
        return;
      }

      // SUCCESS! Now we disable the button and call backend
      setIsVerifying(true);

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
      
      const result_backend = await response.json();

      if (result_backend.success) {
        // Store verification in sessionStorage via context
        setVerified({
          verified: true,
          nullifierHash: finalPayload.nullifier_hash,
          verificationLevel: finalPayload.verification_level,
          timestamp: Date.now()
        });
        
        // Verification successful - navigate to canvas
        navigate('/canvas');
      } else {
        // Backend verification failed - this is a real error worth showing
        console.error('Backend verification failed:', result_backend);
        toast({
          title: "Verification Failed",
          description: result_backend.error || "Unable to verify your identity. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle exceptions (network issues, etc.)
      console.error('Verification error:', error);
    } finally {
      // Always reset isVerifying to ensure button is clickable again
      setIsVerifying(false);
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
          <Button 
            onClick={handleCreateClick}
            disabled={isVerifying}
            className="w-full !bg-black active:!bg-black focus:!bg-black focus-visible:!bg-black hover:!bg-black text-white py-6 h-auto rounded-xl text-xl font-medium shadow-md disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <LoaderCircle className="animate-spin mr-2" size={20} />
                Verifying...
              </>
            ) : "Create Together"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
