import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from '@/components/BottomNav';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CondoSelection from "./pages/CondoSelection";
import CreateAlert from "./pages/CreateAlert";
import AlertDetail from "./pages/AlertDetail";
import Profile from "./pages/Profile";
import Syndic from "./pages/Syndic";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicAlert from "./pages/PublicAlert";
import FeedPreview from "./pages/FeedPreview";
import DesignPreview from "./pages/DesignPreview";

const queryClient = new QueryClient();

const ROUTES_WITHOUT_NAV = ['/auth', '/reset-password', '/preview'];

const AnimatedRoutes = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: shouldReduceMotion ? 0 : -3 },
  };

  const ease = [0.25, 0.1, 0.25, 1] as const;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: shouldReduceMotion ? 0 : 0.18,
          ease,
        }}
        style={{ width: '100%' }}
      >
        <Routes location={location}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/condo-selection" element={<ProtectedRoute><CondoSelection /></ProtectedRoute>} />
          <Route path="/create-alert" element={<ProtectedRoute><CreateAlert /></ProtectedRoute>} />
          <Route path="/alert/:id" element={<ProtectedRoute><AlertDetail /></ProtectedRoute>} />
          <Route path="/feed-preview" element={<ProtectedRoute><FeedPreview /></ProtectedRoute>} />
          <Route path="/syndic" element={<ProtectedRoute><Syndic /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/p/alert/:id" element={<PublicAlert />} />
          <Route path="/preview" element={<DesignPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();
  const showNav =
    !ROUTES_WITHOUT_NAV.includes(location.pathname) &&
    !location.pathname.startsWith('/p/');

  return (
    <>
      <AnimatedRoutes />
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div
        className="fixed inset-0 w-full bg-gray-50 flex justify-center"
      >
        <div
          className="relative w-full max-w-[480px] h-full overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <BrowserRouter>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
