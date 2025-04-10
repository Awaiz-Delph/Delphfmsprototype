import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import UserManagement from "@/pages/user-management";
import AuthPage from "@/pages/auth-page";
import SimpleDashboard from "@/pages/simple-dashboard";
import { WarehouseProvider } from "@/context/warehouse-context";
import { AuthProvider } from "@/hooks/use-auth";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PERMISSIONS } from "@shared/types";
import { ProtectedRoute } from "./lib/protected-route";
import AppHeader from "@/components/app-header";

function Router() {
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  return (
    <>
      {!isAuthPage && <AppHeader />}
      <main className={!isAuthPage ? "pt-16" : ""}>
        <Switch>
          {/* Protected routes that require authentication */}
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/simple-dashboard" component={SimpleDashboard} />
          <ProtectedRoute
            path="/users"
            component={() => (
              <PermissionGate 
                permission={PERMISSIONS.USER_VIEW}
                fallback={<NotFound />}
              >
                <UserManagement />
              </PermissionGate>
            )}
          />
          
          {/* Public routes */}
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionsProvider>
          <WarehouseProvider>
            <div className="min-h-screen flex flex-col">
              <Router />
              <Toaster />
            </div>
          </WarehouseProvider>
        </PermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
