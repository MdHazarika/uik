import { useRoute } from "wouter";
import { useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, User, Scissors } from "lucide-react";
import { format } from "date-fns";

export default function BookingConfirmation() {
  const [, params] = useRoute("/booking/:id/confirmation");
  const bookingId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: booking, isLoading } = useGetBooking(bookingId, {
    query: {
      enabled: !!bookingId,
      queryKey: getGetBookingQueryKey(bookingId)
    }
  });

  if (isLoading) {
    return <div className="min-h-[70vh] flex items-center justify-center">Loading...</div>;
  }

  if (!booking) {
    return <div className="min-h-[70vh] flex items-center justify-center">Booking not found.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your appointment with {booking.barberName} has been successfully scheduled.
          </p>
        </div>

        <Card className="border-border shadow-md overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
            <div>
              <p className="text-primary-foreground/80 text-sm mb-1 uppercase tracking-wider font-medium">Booking ID</p>
              <p className="font-mono text-xl font-bold">#{booking.id}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/80 text-sm mb-1 uppercase tracking-wider font-medium">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-100 border border-green-400/30">
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Date</p>
                    <p className="font-bold text-primary text-lg">{format(new Date(booking.date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Time</p>
                    <p className="font-bold text-primary text-lg">{booking.startTime.substring(0,5)} - {booking.endTime.substring(0,5)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{booking.isHomeService ? 'Home Service At' : 'Location'}</p>
                    <p className="font-medium text-primary">{booking.address || "Barber's Shop"}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/10">
                <h3 className="font-bold text-primary mb-4 flex items-center border-b border-border pb-2">
                  <Scissors className="h-4 w-4 mr-2" /> Services Included
                </h3>
                <ul className="space-y-3 mb-6">
                  {booking.services.map((s, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="font-medium">${s.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Payment Method</span>
                    <span className="capitalize">{booking.paymentMethod}</span>
                  </div>
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount applied</span>
                      <span>-${booking.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-primary pt-2">
                    <span>Total Paid</span>
                    <span className="text-accent">${booking.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" asChild className="w-40">
            <Link href="/">Back Home</Link>
          </Button>
          <Button asChild className="w-40 bg-primary hover:bg-primary/90">
            <Link href="/dashboard/user">View Bookings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
