import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import DrunkOverlay from "@/components/DrunkOverlay";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import OrderHistory from "./pages/OrderHistory.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import VipPage from "./pages/VipPage.tsx";
import AlkomatPage from "./pages/AlkomatPage.tsx";
import QuizPage from "./pages/QuizPage.tsx";
import DeliveryTracker from "./pages/DeliveryTracker.tsx";
import FiszVsAI from "./pages/FiszVsAI.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/zamowienia" element={<PageTransition><OrderHistory /></PageTransition>} />
        <Route path="/profil" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/produkt/:id" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="/vip" element={<PageTransition><VipPage /></PageTransition>} />
        <Route path="/alkomat" element={<PageTransition><AlkomatPage /></PageTransition>} />
        <Route path="/quiz" element={<PageTransition><QuizPage /></PageTransition>} />
        <Route path="/dostawa" element={<PageTransition><DeliveryTracker /></PageTransition>} />
        <Route path="/fisz-vs-ai" element={<PageTransition><FiszVsAI /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
          <DrunkOverlay />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
