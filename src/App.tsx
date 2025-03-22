import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Info from "./pages/Info";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import AuthCallback from "./pages/AuthCallback";
import OpenPage from "./pages/OpenPage";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // If there's no user, redirect to the landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main app routes that require auth context
const MainRoutes = () => (
  <AuthProvider>
    <PaymentProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/info" element={<Info />} />
        <Route path="/welcome" element={<OpenPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PaymentProvider>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/*" element={<MainRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
