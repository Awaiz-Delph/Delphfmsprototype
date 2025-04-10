import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  BarChart, 
  PackageOpen, 
  Menu,
  Bot,
  X,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg h-8 w-8 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-semibold tracking-wide text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Delphnoid</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" active={isActive("/")}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </NavLink>
            <NavLink to="/simple-dashboard" active={isActive("/simple-dashboard")}>
              <PackageOpen className="h-4 w-4 mr-2" />
              Simple View
            </NavLink>
            <NavLink to="/analytics" active={isActive("/analytics")}>
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </NavLink>
            {user.role === "admin" && (
              <NavLink to="/users" active={isActive("/users")}>
                <User className="h-4 w-4 mr-2" />
                Users
              </NavLink>
            )}
          </nav>
        )}

        {/* User Actions */}
        {user && (
          <div className="hidden md:flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-white/70" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full"></span>
            </Button>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-8 w-8">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-black/90 border border-white/10">
                <DropdownMenuLabel className="text-white/70">{user.username}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/10">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/10" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Mobile Menu Button */}
        {user && (
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/70"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden pt-2 pb-4 px-4 border-t border-white/5 bg-black/80 backdrop-blur-xl">
          <nav className="flex flex-col space-y-1">
            <MobileNavLink to="/" active={isActive("/")}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </MobileNavLink>
            <MobileNavLink to="/simple-dashboard" active={isActive("/simple-dashboard")}>
              <PackageOpen className="h-4 w-4 mr-2" />
              Simple View
            </MobileNavLink>
            <MobileNavLink to="/analytics" active={isActive("/analytics")}>
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </MobileNavLink>
            {user.role === "admin" && (
              <MobileNavLink to="/users" active={isActive("/users")}>
                <User className="h-4 w-4 mr-2" />
                Users
              </MobileNavLink>
            )}
            <div className="pt-2 border-t border-white/10 mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link href={to}>
      <a
        className={cn(
          "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-primary/20 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        {children}
      </a>
    </Link>
  );
}

function MobileNavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link href={to}>
      <a
        className={cn(
          "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-primary/20 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        {children}
      </a>
    </Link>
  );
}