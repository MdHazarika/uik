import { useState } from "react";
import { 
  useGetCurrentUser, getGetCurrentUserQueryKey,
  useGetBarberDashboard, getGetBarberDashboardQueryKey,
  useGetBarberBookings, getGetBarberBookingsQueryKey,
  useUpdateBooking,
  GetBarberBookingsStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Scissors, DollarSign, Calendar, Star, Clock, Check, X } from "lucide-react";
import { format } from "date-fns";

export default function BarberDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey() }
  });

  const { data: dashboard, isLoading: isDashboardLoading } = useGetBarberDashboard(user?.id || 0, {
    query: {
      enabled: !!user?.id,
      queryKey: getGetBarberDashboardQueryKey(user?.id || 0)
    }
  });

  const { data: pendingBookings, isLoading: isPendingLoading } = useGetBarberBookings(user?.id || 0, { status: "pending" }, {
    query: {
      enabled: !!user?.id,
      queryKey: getGetBarberBookingsQueryKey(user?.id || 0, { status: "pending" })
    }
  });

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: "Booking updated successfully" });
        if(user?.id) {
          queryClient.invalidateQueries({ queryKey: getGetBarberDashboardQueryKey(user.id) });
          queryClient.invalidateQueries({ queryKey: getGetBarberBookingsQueryKey(user.id, { status: "pending" }) });
        }
      }
    }
  });

  const handleAction = (id: number, status: "confirmed" | "cancelled") => {
    updateBooking.mutate({ id, data: { status } });
  };

  if (isDashboardLoading || !dashboard) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary">Barber Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Bookings</p>
              <h3 className="text-2xl font-bold text-primary">{dashboard.todayBookings}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Earnings</p>
              <h3 className="text-2xl font-bold text-primary">${dashboard.todayEarnings.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shrink-0">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <h3 className="text-2xl font-bold text-primary">{dashboard.averageRating.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">({dashboard.totalReviews})</span></h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
              <h3 className="text-2xl font-bold text-primary">{dashboard.pendingBookings}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pending Requests */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-primary border-b border-border pb-2">Pending Requests</h2>
          
          {isPendingLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !pendingBookings || pendingBookings.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 border border-dashed rounded-xl">
              <p className="text-muted-foreground">No pending booking requests.</p>
            </div>
          ) : (
            pendingBookings.map(booking => (
              <Card key={booking.id} className="border-border border-l-4 border-l-yellow-400">
                <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-lg">{booking.userName}</h4>
                      <p className="text-sm text-muted-foreground font-medium">
                        {format(new Date(booking.date), 'MMM d, yyyy')} • {booking.startTime.substring(0,5)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.services.map(s => s.name).join(', ')} • {booking.isHomeService ? 'Home Service' : 'Shop'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => handleAction(booking.id, "cancelled")}
                      disabled={updateBooking.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction(booking.id, "confirmed")}
                      disabled={updateBooking.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <h2 className="text-xl font-bold text-primary border-b border-border pb-2 mt-10">Today's Schedule</h2>
          {dashboard.recentBookings.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 border border-dashed rounded-xl">
              <p className="text-muted-foreground">No bookings scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
              {dashboard.recentBookings.map(booking => (
                <div key={booking.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                    <Clock className="h-4 w-4" />
                  </div>
                  <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-primary">{booking.userName}</h4>
                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-primary font-medium">{booking.startTime.substring(0,5)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.services.map(s => s.name).join(', ')}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-sm">
                        <span className="font-medium text-accent">${booking.finalAmount.toFixed(2)}</span>
                        <Badge variant="outline" className="bg-primary/5">{booking.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Earnings</span>
                  <span className="font-bold text-primary">${dashboard.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Bookings</span>
                  <span className="font-bold text-primary">{dashboard.totalBookings}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Completed</span>
                  <span className="font-bold text-green-600">{dashboard.completedBookings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground">
            View Full Analytics
          </Button>
        </div>

      </div>
    </div>
  );
}
