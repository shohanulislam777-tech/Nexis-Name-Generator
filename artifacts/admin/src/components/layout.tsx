import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  KeyRound, 
  Package, 
  Users, 
  Laptop, 
  Bell, 
  BarChart3, 
  Activity, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGetAdminProfile } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { data: profile } = useGetAdminProfile({ query: { retry: false } });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Licenses", href: "/licenses", icon: KeyRound },
    { name: "Plans", href: "/plans", icon: Package },
    { name: "Users", href: "/users", icon: Users },
    { name: "Devices", href: "/devices", icon: Laptop },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Activity Logs", href: "/activity-logs", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tighter">NX</div>
            <span className="font-bold tracking-widest text-lg uppercase">Nexis</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
              {profile?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.username || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || "admin@nexis.io"}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
