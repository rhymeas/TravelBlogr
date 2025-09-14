import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import PrivacyWrapper from "@/components/PrivacyWrapper";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LocationDetail from "@/pages/LocationDetail";
import AdminPanel from "@/pages/AdminPanel";
import LiveFeedPage from "@/pages/LiveFeed";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/location/:slug" component={LocationDetail} />
      <Route path="/live-feed" component={LiveFeedPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <PrivacyWrapper>
            <Router />
            <FloatingUploadButton />
          </PrivacyWrapper>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
