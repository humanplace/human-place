
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

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
        <Button 
          onClick={handleCreateClick}
          className="w-full bg-black hover:bg-gray-800 text-white py-6 h-auto rounded-xl text-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          Create Together
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
