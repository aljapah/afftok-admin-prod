import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAdmin } from "@/App";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Tag, 
  Network, 
  UsersRound, 
  Award, 
  BarChart3,
  Activity,
  Building2,
  Globe,
  Shield,
  FileText,
  Webhook,
  Receipt,
  Trophy,
  Plug,
  UserCog,
  History,
  Wallet
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

// All menu items with role access
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", labelAr: "الرئيسية", path: "/", roles: ['*'] },
  { icon: Users, label: "Users", labelAr: "المستخدمون", path: "/users", roles: ['super_admin', 'promoter_support'] },
  { icon: Tag, label: "Offers", labelAr: "العروض", path: "/offers", roles: ['super_admin', 'finance_admin', 'advertiser_manager'] },
  { icon: Network, label: "Networks", labelAr: "الشبكات", path: "/networks", roles: ['super_admin', 'advertiser_manager'] },
  { icon: UsersRound, label: "Teams", labelAr: "الفرق", path: "/teams", roles: ['super_admin', 'advertiser_manager', 'promoter_support'] },
  { icon: Trophy, label: "Contests", labelAr: "المسابقات", path: "/contests", roles: ['super_admin', 'finance_admin', 'advertiser_manager', 'promoter_support'] },
  { icon: Award, label: "Badges", labelAr: "الشارات", path: "/badges", roles: ['super_admin', 'advertiser_manager'] },
  { icon: Receipt, label: "Invoices", labelAr: "الفواتير", path: "/invoices", roles: ['super_admin', 'finance_admin'] },
  { icon: BarChart3, label: "Analytics", labelAr: "التحليلات", path: "/analytics", roles: ['super_admin', 'finance_admin', 'advertiser_manager'] },
];

const systemMenuItems = [
  { icon: Wallet, label: "Payments", labelAr: "الدفع", path: "/affiliate-networks", roles: ['super_admin', 'tech_admin', 'finance_admin', 'advertiser_manager'] },
  { icon: Plug, label: "Integrate", labelAr: "تكامل", path: "/integrations", roles: ['super_admin', 'tech_admin', 'advertiser_manager'] },
  { icon: Activity, label: "Monitor", labelAr: "مراقبة", path: "/monitoring", roles: ['super_admin', 'tech_admin'] },
  { icon: Building2, label: "Tenants", labelAr: "مستأجر", path: "/tenants", roles: ['super_admin'] },
  { icon: Globe, label: "Geo", labelAr: "الدول", path: "/geo-rules", roles: ['super_admin', 'tech_admin', 'fraud_reviewer'] },
  { icon: Shield, label: "Fraud", labelAr: "احتيال", path: "/fraud", roles: ['super_admin', 'tech_admin', 'fraud_reviewer'] },
  { icon: FileText, label: "Logs", labelAr: "سجل", path: "/logs", roles: ['super_admin', 'tech_admin', 'fraud_reviewer'] },
  { icon: Webhook, label: "Hooks", labelAr: "هوك", path: "/webhooks", roles: ['super_admin', 'tech_admin'] },
];

const adminMenuItems = [
  { icon: UserCog, label: "Admins", labelAr: "الإداريون", path: "/admin-users", roles: ['super_admin'] },
  { icon: History, label: "Audit", labelAr: "السجل", path: "/audit-log", roles: ['super_admin'] },
];

const roleLabels: Record<string, string> = {
  super_admin: 'مدير عام',
  finance_admin: 'مدير مالي',
  tech_admin: 'مدير تقني',
  advertiser_manager: 'مدير معلنين',
  promoter_support: 'دعم المروجين',
  fraud_reviewer: 'مراجع احتيال',
  viewer: 'مشاهد',
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAdmin();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Filter menu items based on user role
  const canAccess = (roles: string[]) => {
    if (!user) return false;
    if (roles.includes('*')) return true;
    if (user.role === 'super_admin') return true;
    return roles.includes(user.role);
  };

  const filteredMenuItems = menuItems.filter(item => canAccess(item.roles));
  const filteredSystemItems = systemMenuItems.filter(item => canAccess(item.roles));
  const filteredAdminItems = adminMenuItems.filter(item => canAccess(item.roles));

  const allItems = [...filteredMenuItems, ...filteredSystemItems, ...filteredAdminItems];
  const activeMenuItem = allItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Main Menu */}
            <SidebarMenu className="px-2 py-1">
              {filteredMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* System Section */}
            {filteredSystemItems.length > 0 && (
              <>
                <div className="mt-4 mx-4 pt-4 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-2 group-data-[collapsible=icon]:hidden">
                    System
                  </p>
                </div>
                
                <SidebarMenu className="px-2 py-1">
                  {filteredSystemItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                          />
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}

            {/* Admin Section - Super Admin Only */}
            {filteredAdminItems.length > 0 && (
              <>
                <div className="mt-4 mx-4 pt-4 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-2 group-data-[collapsible=icon]:hidden">
                    Admin
                  </p>
                </div>
                
                <SidebarMenu className="px-2 py-1">
                  {filteredAdminItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                          />
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.fullName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.fullName || user?.username || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {roleLabels[user?.role || ''] || user?.role}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {roleLabels[user?.role || ''] || user?.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
