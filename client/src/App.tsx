import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
