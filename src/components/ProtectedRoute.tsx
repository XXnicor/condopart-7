import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (loading && !forceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh-light dark:bg-mesh-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-stone-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
