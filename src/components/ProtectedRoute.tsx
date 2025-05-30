import { Navigate } from 'react-router-dom';
import { useWorldAppVerification } from '@/context/VerificationContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { canAccess, isInWorldApp } = useWorldAppVerification();

  // If not in World App, show error message
  if (!isInWorldApp) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-white p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">World App Required</h2>
        <p className="text-gray-600">
          This app must be opened within the World App to access the canvas.
        </p>
      </div>
    );
  }

  // If in World App but not verified, redirect to landing page
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 
