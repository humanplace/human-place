
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TiledBackground from '@/components/TiledBackground';
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import { toast } from '@/hooks/use-toast';
import { verifyWorldIdProof } from '@/api/verify';
import { useCanvas } from '@/context/CanvasContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useCanvas();
  
  const handleCreateClick = async () => {
    // Check if MiniKit is available (user is in World App)
    if (!MiniKit.isInstalled()) {
      toast({
        title: "World App Required",
        description: "Please open this app in World App",
        variant: "destructive",
      });
      return;
    }

    console.log('MiniKit is installed, proceeding with verification...');

    // Prepare verification payload
    const verifyPayload: VerifyCommandInput = {
      action: import.meta.env.VITE_WORLD_ACTION_ID || 'human-verification',
      verification_level: VerificationLevel.Orb, // Only orb-verified users
    };

    console.log('Verification payload:', verifyPayload);

    try {
      // Trigger World ID verification
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);
      
      if (finalPayload.status === 'error') {
        toast({
          title: "Must be Orb verified",
          variant: "destructive",
        });
        return;
      }

      // Verify the proof on our backend
      const verificationResult = await verifyWorldIdProof({
        payload: finalPayload as ISuccessResult,
        action: import.meta.env.VITE_WORLD_ACTION_ID || 'human-verification',
      });

      if (verificationResult.success && verificationResult.verified) {
        // Success - user is orb verified, set verification state and proceed to canvas
        dispatch({ type: 'SET_USER_VERIFIED', verified: true });
        navigate('/canvas');
      } else {
        toast({
          title: "Must be Orb verified",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('World ID verification error:', error);
      toast({
        title: "Must be Orb verified",
        variant: "destructive",
      });
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
            className="w-full bg-black hover:bg-gray-800 text-white py-6 h-auto rounded-xl text-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Create Together
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
