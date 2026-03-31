import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { useGetBarbers, getGetBarbersQueryKey, GetBarbersSortBy } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Filter, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Search() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [city, setCity] = useState(searchParams.get('city') || "");
  const [debouncedCity, setDebouncedCity] = useState(city);
  const [homeService, setHomeService] = useState(searchParams.get('homeService') === 'true');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<GetBarbersSortBy>("rating");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Simple debounce for city input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(city);
    }, 500);
    return () => clearTimeout(timer);
  }, [city]);

  const { data, isLoading } = useGetBarbers({
    city: debouncedCity || undefined,
    homeService: homeService || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    sortBy,
    limit: 20
  }, {
    query: {
      queryKey: getGetBarbersQueryKey({
        city: debouncedCity || undefined,
        homeService: homeService || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
        limit: 20
      }),
      keepPreviousData: true
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className={`md:w-64 flex-shrink-0 space-y-8 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="sticky top-24 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Location / City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter city..." 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select value={minRating.toString()} onValueChange={(val) => setMinRating(Number(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any rating</SelectItem>
                    <SelectItem value="4">4.0+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.8">4.8+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="home-service" className="cursor-pointer">Home Service Only</Label>
                <Switch 
                  id="home-service" 
                  checked={homeService} 
                  onCheckedChange={setHomeService} 
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(val: GetBarbersSortBy) => setSortBy(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                    <SelectItem value="price">Lowest Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-primary">
            {isLoading ? "Searching..." : `${data?.total || 0} Professionals Found`}
          </h1>
          <Button variant="outline" className="md:hidden" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.barbers.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
            <h3 className="text-xl font-bold text-primary mb-2">No professionals found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or searching in a different city.</p>
            <Button variant="outline" className="mt-6" onClick={() => {
              setCity("");
              setMinRating(0);
              setHomeService(false);
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data?.barbers.map((barber) => (
              <Card key={barber.id} className="hover:shadow-md transition-shadow border-border overflow-hidden flex flex-col">
                <div className="relative h-48 bg-muted">
                  {barber.portfolioImages?.[0] || barber.avatar ? (
                    <img 
                      src={barber.portfolioImages?.[0] || barber.avatar} 
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                      No image
                    </div>
                  )}
                  {barber.homeService && (
                    <Badge className="absolute top-2 right-2 bg-primary/90">
                      Home Service
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-primary">{barber.name}</h3>
                    <div className="flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded text-sm font-medium text-primary">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {barber.rating.toFixed(1)} <span className="text-muted-foreground ml-1">({barber.totalReviews})</span>
                    </div>
                  </div>
                  
                  <div className="text-muted-foreground text-sm flex items-center mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {barber.area}, {barber.city}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {barber.skills?.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="font-normal text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {(barber.skills?.length || 0) > 3 && (
                      <Badge variant="outline" className="font-normal text-xs text-muted-foreground">
                        +{(barber.skills?.length || 0) - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> {barber.experience} yrs
                    </span>
                    <Button onClick={() => setLocation(`/barbers/${barber.id}`)}>
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
