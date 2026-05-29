import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../provider/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="relative flex items-center justify-center">
          {/* Glowing outer rings */}
          <div className="absolute w-24 h-24 rounded-full border-4 border-violet-500/20 animate-ping"></div>
          <div className="absolute w-20 h-20 rounded-full border-4 border-indigo-500/40 animate-pulse"></div>
          
          {/* Spinning gradient ring */}
          <div className="w-16 h-16 rounded-full border-t-4 border-r-4 border-violet-500 border-b-transparent border-l-transparent animate-spin"></div>
          
          {/* Center brand dot */}
          <div className="absolute w-6 h-6 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]"></div>
        </div>
        <p className="mt-6 text-sm tracking-widest text-slate-400 uppercase font-semibold animate-pulse">
          Synchronizing Workspace...
        </p>
      </div>
    );
  }

  if (user) {
    return children;
  }

  return <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
