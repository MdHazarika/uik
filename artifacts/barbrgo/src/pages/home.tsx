import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search as SearchIcon, Star, Clock, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey()
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      setLocation(`/search?city=${encodeURIComponent(city.trim())}`);
    } else {
      setLocation('/search');
    }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Hero Section */}
      <section className="relative w-full bg-primary text-primary-foreground pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent to-transparent" />
        <div className="container mx-auto relative z-10 flex flex-col items-center text-center max-w-4xl">
          <Badge variant="outline" className="mb-6 border-accent text-accent font-medium px-4 py-1 uppercase tracking-wider">
            The Future of Grooming
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            Book the best barbers.<br />
            <span className="text-accent italic">Zero waiting.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl">
            Discover top-rated professionals in your area. Book appointments instantly or request a premium home service.
          </p>

          <div className="w-full max-w-2xl bg-background rounded-xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <MapPin className="absolute left-4 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Enter your city..." 
                className="pl-12 border-0 focus-visible:ring-0 text-foreground h-12 text-base shadow-none"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              />
            </div>
            <Button size="lg" className="h-12 px-8 text-base bg-accent text-primary hover:bg-accent/90" onClick={handleSearch}>
              <SearchIcon className="mr-2 h-5 w-5" />
              Find Barbers
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-primary mb-1">
                {isLoading ? <Skeleton className="h-9 w-16" /> : summary?.stats.totalBarbers || "500+"}
              </span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Pro Barbers</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-primary mb-1">
                {isLoading ? <Skeleton className="h-9 w-16" /> : summary?.stats.totalBookingsToday || "2k+"}
              </span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Bookings Today</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-primary mb-1 flex items-center">
                {isLoading ? <Skeleton className="h-9 w-16" /> : (summary?.stats.averageRating?.toFixed(1) || "4.9")}
                <Star className="h-6 w-6 text-accent fill-accent ml-1" />
              </span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Average Rating</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl font-bold text-primary mb-1">Instant</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Confirmation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Barbers */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              Top Rated Professionals
            </h2>
            <p className="text-muted-foreground mt-2">The highest rated barbers in your area.</p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/search">View All</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {summary?.featuredBarbers?.map((barber) => (
              <Link key={barber.id} href={`/barbers/${barber.id}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-border group overflow-hidden cursor-pointer">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {barber.portfolioImages?.[0] || barber.avatar ? (
                      <img 
                        src={barber.portfolioImages?.[0] || barber.avatar} 
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                        No image
                      </div>
                    )}
                    {barber.homeService && (
                      <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        Home Service
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">{barber.name}</h3>
                      <div className="flex items-center gap-1 text-sm font-medium bg-accent/10 text-primary px-2 py-1 rounded-md">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        {barber.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      {barber.area}, {barber.city}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {barber.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-xs bg-secondary px-2 py-1 rounded-md text-secondary-foreground font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4 mt-auto">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1" /> {barber.experience} yrs exp
                        </span>
                        <span className="font-bold text-primary">Book Now &rarr;</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Active Offers */}
      {summary?.activeOffers && summary.activeOffers.length > 0 && (
        <section className="bg-secondary py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-primary flex items-center gap-2 mb-10">
              <Sparkles className="h-8 w-8 text-accent" />
              Exclusive Offers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summary.activeOffers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="bg-background rounded-xl p-6 shadow-sm border border-border flex flex-col relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 h-24 w-24 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
                  <Badge className="w-fit mb-4 bg-accent text-primary font-bold px-3 py-1">
                    {offer.code}
                  </Badge>
                  <h3 className="text-xl font-bold text-primary mb-2">
                    {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {offer.description}
                  </p>
                  <div className="text-xs text-muted-foreground font-medium bg-muted w-fit px-2 py-1 rounded">
                    Valid until {new Date(offer.validUntil || '').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Cities */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-serif font-bold text-primary mb-10 text-center">Popular Locations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary?.topCities?.map((city, idx) => (
            <Link key={idx} href={`/search?city=${encodeURIComponent(city.name)}`} className="group">
              <div className="bg-card border border-border p-6 rounded-xl text-center hover:border-accent hover:bg-accent/5 transition-all cursor-pointer h-full flex flex-col justify-center">
                <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors mb-1">{city.name}</h3>
                <p className="text-sm text-muted-foreground">{city.totalBarbers} Professionals</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
