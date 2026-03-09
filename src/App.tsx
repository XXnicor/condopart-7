import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
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
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={
          <PageTransition type="tab" id="auth"><Auth /></PageTransition>
        } />
        <Route path="/reset-password" element={
          <PageTransition type="tab" id="reset-password"><ResetPassword /></PageTransition>
        } />
        <Route path="/" element={
          <ProtectedRoute><PageTransition type="tab" id="home"><Index /></PageTransition></ProtectedRoute>
        } />
        <Route path="/condo-selection" element={
          <ProtectedRoute><PageTransition type="forward" id="condo-selection"><CondoSelection /></PageTransition></ProtectedRoute>
        } />
        <Route path="/create-alert" element={
          <ProtectedRoute><PageTransition type="forward" id="create-alert"><CreateAlert /></PageTransition></ProtectedRoute>
        } />
        <Route path="/alert/:id" element={
          <ProtectedRoute><PageTransition type="forward" id="alert-detail"><AlertDetail /></PageTransition></ProtectedRoute>
        } />
        <Route path="/feed-preview" element={
          <ProtectedRoute><PageTransition type="tab" id="feed-preview"><FeedPreview /></PageTransition></ProtectedRoute>
        } />
        <Route path="/syndic" element={
          <ProtectedRoute><PageTransition type="tab" id="syndic"><Syndic /></PageTransition></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><PageTransition type="tab" id="profile"><Profile /></PageTransition></ProtectedRoute>
        } />
        <Route path="/p/alert/:id" element={
          <PageTransition type="forward" id="public-alert"><PublicAlert /></PageTransition>
        } />
        <Route path="/preview" element={
          <PageTransition type="forward" id="preview"><DesignPreview /></PageTransition>
        } />
        <Route path="*" element={
          <PageTransition type="tab" id="not-found"><NotFound /></PageTransition>
        } />
      </Routes>
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
