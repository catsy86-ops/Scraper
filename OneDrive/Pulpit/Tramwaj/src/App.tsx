import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import HomePage        from "./pages/HomePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import LinesPage       from "./pages/LinesPage";
import MapPage         from "./pages/MapPage";
import RoutePage       from "./pages/RoutePage";
import ComparePage     from "./pages/ComparePage";
import NotFound        from "./pages/NotFound";

// Legacy redirect
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* New mobile-first pages */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/polaczenia"  element={<ConnectionsPage />} />
          <Route path="/linie"       element={<LinesPage />} />
          <Route path="/mapa"        element={<MapPage />} />

          {/* Existing detail pages */}
          <Route path="/route/:routeId" element={<RoutePage />} />
          <Route path="/compare"        element={<ComparePage />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
