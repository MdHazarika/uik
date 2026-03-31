import { Link, useLocation } from "wouter";
import { Scissors, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        setLocation("/");
      }
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-primary">
            <Scissors className="h-6 w-6 text-accent" />
            BarbrGo
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
              Find a Barber
            </Link>
            <Link href="/offers" className="text-muted-foreground hover:text-foreground transition-colors">
              Offers
            </Link>
          </nav>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer w-full">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "barber" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/barber" className="cursor-pointer w-full">Barber Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/barber/services" className="cursor-pointer w-full">Manage Services</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === "customer" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/user" className="cursor-pointer w-full">My Bookings</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
          <Link href="/search" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
            Find a Barber
          </Link>
          <Link href="/offers" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
            Offers
          </Link>
          
          <div className="h-px bg-border my-2" />
          
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="px-2 py-1 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.name}</span>
              </div>
              {user.role === "admin" && (
                <Link href="/admin" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
                  Admin Dashboard
                </Link>
              )}
              {user.role === "barber" && (
                <>
                  <Link href="/dashboard/barber" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
                    Barber Dashboard
                  </Link>
                  <Link href="/dashboard/barber/services" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
                    Manage Services
                  </Link>
                </>
              )}
              {user.role === "customer" && (
                <Link href="/dashboard/user" className="font-medium px-2 py-1" onClick={closeMobileMenu}>
                  My Bookings
                </Link>
              )}
              <Button variant="outline" className="justify-start mt-2" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Button variant="outline" asChild className="w-full justify-center">
                <Link href="/login" onClick={closeMobileMenu}>Log in</Link>
              </Button>
              <Button asChild className="w-full justify-center">
                <Link href="/register" onClick={closeMobileMenu}>Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
