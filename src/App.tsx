import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import AstroKarmaz from "./pages/AstroKarmaz";
import AiPredictor from "./pages/AiPredictor";
import Kundli from "./pages/Kundli";

// The 3D sky (three.js) loads only when someone opens Explore.
const Explore = lazy(() => import("./pages/Explore"));
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AstroKarmaz />} />
          {/* Legacy link — the Astrokarmaz site now lives at the root. */}
          <Route path="/astrokarmaz" element={<Navigate to="/" replace />} />
          <Route path="/ai-predictor" element={<AiPredictor />} />
          <Route path="/kundli" element={<Kundli />} />
          <Route
            path="/explore"
            element={
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Explore />
              </Suspense>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
