import { useGetCurrentUser, useGetUserBookings, getGetCurrentUserQueryKey, getGetUserBookingsQueryKey, useCancelBooking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Scissors, Star, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function UserDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey()
    }
  });

  const { data: bookings, isLoading: isBookingsLoading } = useGetUserBookings(user?.id || 0, {}, {
    query: {
      enabled: !!user?.id,
      queryKey: getGetUserBookingsQueryKey(user?.id || 0, {})
    }
  });

  const cancelMutation = useCancelBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: "Booking cancelled successfully" });
        if(user?.id) {
          queryClient.invalidateQueries({ queryKey: getGetUserBookingsQueryKey(user.id, {}) });
        }
      }
    }
  });

  const handleCancel = (id: number) => {
    if(confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate({ id, data: { reason: "Customer requested cancellation" } });
    }
  };

  if (isUserLoading || !user) {
    return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
  }

  const upcomingBookings = bookings?.filter(b => b.status === "pending" || b.status === "confirmed") || [];
  const pastBookings = bookings?.filter(b => b.status === "completed" || b.status === "cancelled") || [];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Profile Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-6">
          <Card className="border-border overflow-hidden">
            <div className="h-24 bg-primary" />
            <div className="px-6 pb-6 relative">
              <div className="h-20 w-20 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-2xl font-bold text-primary absolute -top-10">
                {user.avatar ? <img src={user.avatar} className="rounded-full" alt="" /> : user.name.charAt(0)}
              </div>
              <div className="mt-12">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  {user.name}
                  {user.isVerified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground mt-1">{user.phone}</p>
              </div>
            </div>
            <div className="border-t border-border p-6 bg-muted/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Loyalty Points</span>
                <span className="font-bold text-accent">{user.loyaltyPoints}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{width: `${Math.min(100, user.loyaltyPoints / 10)}%`}}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right">Reach 1000 for a free service!</p>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-primary mb-6">My Bookings</h1>
          
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6 bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 space-x-6">
              <TabsTrigger value="upcoming" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base">
                History ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isBookingsLoading ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-primary mb-2">No upcoming appointments</h3>
                  <Button asChild className="mt-4"><Link href="/search">Find a Barber</Link></Button>
                </div>
              ) : (
                upcomingBookings.map(booking => (
                  <Card key={booking.id} className="border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 bg-secondary rounded-lg flex flex-col items-center justify-center shrink-0 border border-border">
                            <span className="text-xs font-bold uppercase text-muted-foreground">{format(new Date(booking.date), 'MMM')}</span>
                            <span className="text-xl font-bold text-primary leading-none mt-1">{format(new Date(booking.date), 'd')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-primary">{booking.barberName}</h3>
                              <Badge variant="outline" className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center"><Clock className="h-3.5 w-3.5 mr-2" /> {booking.startTime.substring(0,5)} - {booking.endTime.substring(0,5)}</p>
                              <p className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-2" /> {booking.isHomeService ? 'Home Service' : booking.address || 'Shop'}</p>
                              <p className="flex items-center"><Scissors className="h-3.5 w-3.5 mr-2" /> {booking.services.map(s => s.name).join(', ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                          <div className="text-right mb-4 md:mb-0">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-bold text-accent">${booking.finalAmount.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => handleCancel(booking.id)}>
                              Cancel
                            </Button>
                            <Button size="sm" className="flex-1 md:flex-none" asChild>
                              <Link href={`/booking/${booking.id}/confirmation`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed text-muted-foreground">
                  No past bookings found.
                </div>
              ) : (
                pastBookings.map(booking => (
                  <Card key={booking.id} className="border-border opacity-80 hover:opacity-100 transition-opacity">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                          <div className="h-12 w-12 bg-secondary rounded-lg flex flex-col items-center justify-center shrink-0 opacity-50">
                            <span className="text-xs font-bold text-muted-foreground">{format(new Date(booking.date), 'MMM d')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-primary">{booking.barberName}</h3>
                              <Badge variant="outline" className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {booking.services.map(s => s.name).join(', ')} • ${booking.finalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {booking.status === 'completed' && (
                          <div className="flex items-center justify-end">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Star className="h-4 w-4 text-accent fill-accent" /> Leave Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
