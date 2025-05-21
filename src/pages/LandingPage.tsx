
import { useNavigate } from 'react-router-dom';
import PixelBorderButton from '@/components/PixelBorderButton';

const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleCreateClick = () => {
    navigate('/canvas');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      {/* Logo Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <img 
          src="/favicon-logo.svg" 
          alt="Logo" 
          className="w-full max-w-[250px] h-auto"
        />
      </div>
      
      {/* Create Together Button Container with padding */}
      <div className="px-6 pb-12">
        <PixelBorderButton 
          onClick={handleCreateClick}
          className="hover:bg-gray-900 active:bg-black transition-colors"
        >
          Create Together
        </PixelBorderButton>
      </div>
    </div>
  );
};

export default LandingPage;
