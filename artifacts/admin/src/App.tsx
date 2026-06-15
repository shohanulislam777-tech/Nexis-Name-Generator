import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Licenses from "@/pages/licenses";
import LicenseDetail from "@/pages/license-detail";
import Plans from "@/pages/plans";
import Users from "@/pages/users";
import Devices from "@/pages/devices";
import Notifications from "@/pages/notifications";
import Analytics from "@/pages/analytics";
import ActivityLogs from "@/pages/activity-logs";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Configure the API client to use the token from localStorage
setAuthTokenGetter(() => localStorage.getItem("nexis_admin_token"));

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RedirectToDashboard} />
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/licenses">
        <ProtectedRoute component={Licenses} />
      </Route>
      <Route path="/licenses/:id">
        <ProtectedRoute component={LicenseDetail} />
      </Route>
      <Route path="/plans">
        <ProtectedRoute component={Plans} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={Users} />
      </Route>
      <Route path="/users/:id">
        <ProtectedRoute component={Users} />
      </Route>
      <Route path="/devices">
        <ProtectedRoute component={Devices} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/activity-logs">
        <ProtectedRoute component={ActivityLogs} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
