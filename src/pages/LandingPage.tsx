
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
        <button 
          onClick={handleCreateClick}
          className="w-full bg-black text-white py-6 text-xl font-medium transition-all 
            relative border-0 rounded-none h-auto
            before:absolute before:inset-0 before:border-4 before:border-black before:bg-transparent 
            after:absolute after:inset-[-5px] after:border-4 after:border-black after:bg-transparent
            hover:before:bg-[#ffa800] hover:before:bg-opacity-20 hover:after:border-[#ffa800]
            pixel-shadow"
        >
          <span className="relative z-10">Create Together</span>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
