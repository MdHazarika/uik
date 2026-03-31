import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { 
  useGetBarber, getGetBarberQueryKey,
  useGetBarberServices, getGetBarberServicesQueryKey,
  useGetBarberReviews, getGetBarberReviewsQueryKey,
  useGetBarberAvailability, getGetBarberAvailabilityQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Star, Clock, Home, Info, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function BarberProfile() {
  const [, params] = useRoute("/barbers/:id");
  const barberId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();

  const [date, setDate] = useState<Date>(new Date());
  const formattedDate = format(date, "yyyy-MM-dd");

  const { data: barber, isLoading: isBarberLoading } = useGetBarber(barberId, {
    query: {
      enabled: !!barberId,
      queryKey: getGetBarberQueryKey(barberId)
    }
  });

  const { data: services, isLoading: isServicesLoading } = useGetBarberServices(barberId, {
    query: {
      enabled: !!barberId,
      queryKey: getGetBarberServicesQueryKey(barberId)
    }
  });

  const { data: reviews, isLoading: isReviewsLoading } = useGetBarberReviews(barberId, {
    query: {
      enabled: !!barberId,
      queryKey: getGetBarberReviewsQueryKey(barberId)
    }
  });

  const { data: availability, isLoading: isAvailabilityLoading } = useGetBarberAvailability(barberId, { date: formattedDate }, {
    query: {
      enabled: !!barberId && !!formattedDate,
      queryKey: getGetBarberAvailabilityQueryKey(barberId, { date: formattedDate })
    }
  });

  if (isBarberLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-[350px]">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return <div className="text-center py-20">Barber not found.</div>;
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header Banner */}
      <div className="h-64 md:h-80 w-full bg-muted relative">
        {barber.portfolioImages && barber.portfolioImages.length > 0 ? (
          <div className="w-full h-full flex overflow-hidden">
            {barber.portfolioImages.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt="Portfolio" className="h-full object-cover flex-1 border-r border-background" />
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground font-medium">
            No portfolio images
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative -mt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Info */}
          <div className="flex-1">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="h-24 w-24 rounded-full bg-muted border-4 border-background overflow-hidden shrink-0">
                  {barber.avatar ? (
                    <img src={barber.avatar} alt={barber.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold bg-primary text-primary-foreground">
                      {barber.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-serif font-bold text-primary mb-2">{barber.name}</h1>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {barber.area}, {barber.city}</span>
                    <span className="flex items-center"><Star className="h-4 w-4 mr-1 text-accent fill-accent" /> {barber.rating.toFixed(1)} ({barber.totalReviews} reviews)</span>
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {barber.experience} Years Exp.</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {barber.homeService && (
                      <Badge variant="secondary" className="bg-accent/10 text-primary border-accent/20">
                        <Home className="h-3 w-3 mr-1" /> Home Service Available
                      </Badge>
                    )}
                    {barber.skills?.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="services" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none p-0 mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Services</TabsTrigger>
                <TabsTrigger value="about" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">About</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="services" className="space-y-4">
                {isServicesLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : services?.length ? (
                  <div className="grid gap-4">
                    {services.map(service => (
                      <div key={service.id} className="flex justify-between items-center p-4 border border-border rounded-xl hover:border-accent/50 transition-colors bg-card">
                        <div>
                          <h3 className="font-bold text-primary text-lg">{service.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3.5 w-3.5 mr-1" /> {service.durationMinutes} mins
                          </p>
                          {service.description && <p className="text-sm mt-2 text-muted-foreground">{service.description}</p>}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl">${service.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/50 rounded-xl">No services listed.</div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {barber.bio || "No bio provided."}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {isReviewsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : reviews?.length ? (
                  reviews.map(review => (
                    <div key={review.id} className="border-b border-border pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                            {review.userAvatar ? <img src={review.userAvatar} className="rounded-full" alt="" /> : review.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex text-accent">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-accent' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm mt-3 text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">No reviews yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Widget */}
          <div className="w-full lg:w-[400px]">
            <Card className="sticky top-24 border-primary/20 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-6">Book an Appointment</h3>
                
                <div className="mb-6">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    className="border border-border rounded-xl mx-auto"
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  />
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-bold text-primary mb-3">Availability for {format(date, 'MMM d, yyyy')}</h4>
                  {isAvailabilityLoading ? (
                    <div className="flex flex-wrap gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
                  ) : availability?.slots.length ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {availability.slots.map((slot, i) => (
                        <Badge 
                          key={i} 
                          variant={slot.available ? "outline" : "secondary"}
                          className={`py-2 px-3 text-sm font-medium ${slot.available ? 'hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors border-primary/20' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          {slot.startTime.substring(0,5)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 shrink-0" />
                      No slots available on this date.
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90" 
                  onClick={() => setLocation(`/booking/${barber.id}`)}
                >
                  Start Booking
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  You won't be charged yet.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
