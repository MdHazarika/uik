import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Navbar from "@/components/layout/navbar";
import Home from "@/pages/home";
import Search from "@/pages/search";
import BarberProfile from "@/pages/barber-profile";
import Booking from "@/pages/booking";
import BookingConfirmation from "@/pages/booking-confirmation";
import UserDashboard from "@/pages/dashboard/user";
import BarberDashboard from "@/pages/dashboard/barber";
import BarberServices from "@/pages/dashboard/barber-services";
import AdminPanel from "@/pages/admin/index";
import Offers from "@/pages/offers";
import Login from "@/pages/login";
import Register from "@/pages/register";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/barbers/:id" component={BarberProfile} />
          <Route path="/booking/:barberId" component={Booking} />
          <Route path="/booking/:id/confirmation" component={BookingConfirmation} />
          <Route path="/dashboard/user" component={UserDashboard} />
          <Route path="/dashboard/barber" component={BarberDashboard} />
          <Route path="/dashboard/barber/services" component={BarberServices} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/offers" component={Offers} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
