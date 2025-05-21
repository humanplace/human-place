
import { useNavigate } from 'react-router-dom';

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
      
      {/* Create Together Button */}
      <button 
        onClick={handleCreateClick}
        className="w-full bg-black text-white py-6 text-xl font-medium hover:bg-gray-900 transition-colors"
      >
        Create Together
      </button>
    </div>
  );
};

export default LandingPage;
