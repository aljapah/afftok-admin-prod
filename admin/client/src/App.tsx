import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState, useEffect, createContext, useContext } from "react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Offers from "./pages/Offers";
import Networks from "./pages/Networks";
import Teams from "./pages/Teams";
import Badges from "./pages/Badges";
import UserDetails from "./pages/UserDetails";
import Analytics from "./pages/Analytics";
// Phase 10: New Admin Pages
import Monitoring from "./pages/Monitoring";
import Tenants from "./pages/Tenants";
import GeoRules from "./pages/GeoRules";
import FraudDetection from "./pages/FraudDetection";
import LogsViewer from "./pages/LogsViewer";
import Webhooks from "./pages/Webhooks";
import Invoices from "./pages/Invoices";
import Contests from "./pages/Contests";
import Integrations from "./pages/Integrations";
import AffiliateNetworks from "./pages/AffiliateNetworks";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import AuditLog from "./pages/AuditLog";
import Payouts from "./pages/Payouts";

// Admin User Context
interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AdminContextType {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
  hasAccess: (requiredRoles: string[]) => boolean;
}

export const AdminContext = createContext<AdminContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  hasAccess: () => false,
});

export const useAdmin = () => useContext(AdminContext);

// Role-based access mapping
// ملاحظة: KYC تلقائي الآن - لا يحتاج صفحة منفصلة
const roleAccess: Record<string, string[]> = {
  super_admin: ['*'], // All access
  finance_admin: ['/', '/invoices', '/payouts', '/analytics', '/offers', '/contests', '/affiliate-networks'],
  tech_admin: ['/', '/monitoring', '/logs', '/webhooks', '/geo-rules', '/fraud', '/integrations', '/affiliate-networks'],
  advertiser_manager: ['/', '/offers', '/networks', '/teams', '/contests', '/badges', '/analytics', '/integrations', '/affiliate-networks'],
  promoter_support: ['/', '/users', '/teams', '/contests'],
  fraud_reviewer: ['/', '/fraud', '/geo-rules', '/logs'],
  viewer: ['/'],
};

function Router() {
  const { user, hasAccess } = useAdmin();
  
  // Filter routes based on role
  const canAccess = (path: string) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const allowedPaths = roleAccess[user.role] || [];
    return allowedPaths.includes('*') || allowedPaths.includes(path);
  };

  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      {canAccess('/users') && <Route path={"/users"} component={Users} />}
      {canAccess('/users') && <Route path={"/users/:id"} component={UserDetails} />}
      {canAccess('/offers') && <Route path={"/offers"} component={Offers} />}
      {canAccess('/networks') && <Route path={"/networks"} component={Networks} />}
      {canAccess('/teams') && <Route path={"/teams"} component={Teams} />}
      {canAccess('/badges') && <Route path={"/badges"} component={Badges} />}
      {canAccess('/analytics') && <Route path={"/analytics"} component={Analytics} />}
      {canAccess('/monitoring') && <Route path={"/monitoring"} component={Monitoring} />}
      {canAccess('/tenants') && <Route path={"/tenants"} component={Tenants} />}
      {canAccess('/geo-rules') && <Route path={"/geo-rules"} component={GeoRules} />}
      {canAccess('/fraud') && <Route path={"/fraud"} component={FraudDetection} />}
      {canAccess('/logs') && <Route path={"/logs"} component={LogsViewer} />}
      {canAccess('/webhooks') && <Route path={"/webhooks"} component={Webhooks} />}
      {canAccess('/invoices') && <Route path={"/invoices"} component={Invoices} />}
      {canAccess('/payouts') && <Route path={"/payouts"} component={Payouts} />}
      {canAccess('/contests') && <Route path={"/contests"} component={Contests} />}
      {canAccess('/integrations') && <Route path={"/integrations"} component={Integrations} />}
      {canAccess('/affiliate-networks') && <Route path={"/affiliate-networks"} component={AffiliateNetworks} />}
      {/* Super Admin Only */}
      {user?.role === 'super_admin' && <Route path={"/admin-users"} component={AdminUsers} />}
      {user?.role === 'super_admin' && <Route path={"/audit-log"} component={AuditLog} />}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const hasAccess = (requiredRoles: string[]) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return requiredRoles.includes(user.role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Login onLogin={setUser} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminContext.Provider value={{ user, setUser, logout, hasAccess }}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AdminContext.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
