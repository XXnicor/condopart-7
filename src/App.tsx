import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen w-full bg-gray-50">
        <div className="mx-auto flex justify-center">
          <BrowserRouter>
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
