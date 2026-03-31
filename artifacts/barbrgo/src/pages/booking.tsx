import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  useGetBarber, 
  getGetBarberQueryKey,
  useGetBarberServices, 
  getGetBarberServicesQueryKey,
  useGetBarberAvailability, 
  getGetBarberAvailabilityQueryKey,
  useCreateBooking,
  useValidateCoupon
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scissors, MapPin, Tag, ArrowRight, ArrowLeft } from "lucide-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export default function Booking() {
  const [, params] = useRoute("/booking/:barberId");
  const barberId = params?.barberId ? parseInt(params.barberId, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false
    }
  });

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [validatedCoupon, setValidatedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [notes, setNotes] = useState("");

  const formattedDate = format(date, "yyyy-MM-dd");

  const { data: barber } = useGetBarber(barberId, {
    query: { enabled: !!barberId, queryKey: getGetBarberQueryKey(barberId) }
  });

  const { data: services } = useGetBarberServices(barberId, {
    query: { enabled: !!barberId, queryKey: getGetBarberServicesQueryKey(barberId) }
  });

  const { data: availability, isLoading: isAvailabilityLoading } = useGetBarberAvailability(barberId, { date: formattedDate }, {
    query: {
      enabled: !!barberId && !!formattedDate,
      queryKey: getGetBarberAvailabilityQueryKey(barberId, { date: formattedDate })
    }
  });

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: (res) => {
        toast({ title: "Booking confirmed!", description: "Your appointment is set." });
        setLocation(`/booking/${res.id}/confirmation`);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Booking failed", description: err.message || "Please try again." });
      }
    }
  });

  const validateCouponMutation = useValidateCoupon({
    mutation: {
      onSuccess: (res) => {
        if (res.valid) {
          setValidatedCoupon({ code: couponCode, discount: res.discountAmount || 0 });
          toast({ title: "Coupon applied!", description: res.message });
        } else {
          toast({ variant: "destructive", title: "Invalid coupon", description: res.message });
          setValidatedCoupon(null);
        }
      }
    }
  });

  const toggleService = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const { totalDuration, subtotal } = useMemo(() => {
    if (!services) return { totalDuration: 0, subtotal: 0 };
    return selectedServices.reduce((acc, serviceId) => {
      const s = services.find(x => x.id === serviceId);
      if (s) {
        acc.totalDuration += s.durationMinutes;
        acc.subtotal += s.price;
      }
      return acc;
    }, { totalDuration: 0, subtotal: 0 });
  }, [selectedServices, services]);

  const homeServiceCharge = isHomeService && barber?.homeServiceCharge ? barber.homeServiceCharge : 0;
  const totalAmount = subtotal + homeServiceCharge;
  const discountAmount = validatedCoupon?.discount || 0;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleValidateCoupon = () => {
    if (!couponCode) return;
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to apply coupons.", variant: "destructive" });
      return;
    }
    validateCouponMutation.mutate({
      data: { code: couponCode, userId: user.id, amount: totalAmount }
    });
  };

  const handleSubmit = () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to book an appointment." });
      setLocation(`/login?redirect=/booking/${barberId}`);
      return;
    }

    if (!selectedServices.length || !timeSlot) return;

    createBooking.mutate({
      data: {
        userId: user.id,
        barberId,
        serviceIds: selectedServices,
        date: formattedDate,
        startTime: timeSlot,
        isHomeService,
        address: isHomeService ? address : undefined,
        paymentMethod,
        couponCode: validatedCoupon?.code,
        notes
      }
    });
  };

  if (!barber || !services) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8 text-center md:text-left">Book Appointment</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Main Form Area */}
        <div className="flex-1 space-y-6">
          
          {/* Step 1: Services */}
          {step === 1 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="flex items-center text-xl">
                  <span className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                  Select Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {services.map(service => (
                    <div 
                      key={service.id} 
                      className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${selectedServices.includes(service.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => toggleService(service.id)}
                    >
                      <Checkbox 
                        checked={selectedServices.includes(service.id)} 
                        className="mt-1 mr-4" 
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-primary">{service.name}</h3>
                          <span className="font-bold text-accent">${service.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{service.durationMinutes} mins</p>
                        {service.description && <p className="text-sm text-muted-foreground mt-2">{service.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={() => setStep(2)} 
                    disabled={selectedServices.length === 0}
                    className="w-full md:w-auto"
                  >
                    Continue to Schedule <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <span className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                  Date & Time
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              </CardHeader>
              <CardContent className="p-6 flex flex-col md:flex-row gap-8">
                <div className="mx-auto md:mx-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { if(d) { setDate(d); setTimeSlot(""); } }}
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                    className="border border-border rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-4">Available Slots for {format(date, 'MMM d, yyyy')}</h3>
                  {isAvailabilityLoading ? (
                    <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                  ) : availability?.slots.length ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availability.slots.map((slot, i) => (
                        <Button
                          key={i}
                          variant={timeSlot === slot.startTime ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => setTimeSlot(slot.startTime)}
                          className={timeSlot === slot.startTime ? "bg-primary text-primary-foreground" : ""}
                        >
                          {slot.startTime.substring(0,5)}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-muted/50 rounded-xl border border-dashed">
                      <p className="text-muted-foreground">No slots available on this date.</p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={() => setStep(3)} 
                      disabled={!timeSlot}
                      className="w-full md:w-auto"
                    >
                      Continue to Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Details & Payment */}
          {step === 3 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <span className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3">3</span>
                  Details & Payment
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {barber.homeService && (
                  <div className="space-y-4 border border-border p-5 rounded-xl bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="home-service" className="text-base font-bold text-primary flex items-center">
                          <MapPin className="h-4 w-4 mr-2" /> Home Service (+${barber.homeServiceCharge})
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Barber comes to your location</p>
                      </div>
                      <Switch id="home-service" checked={isHomeService} onCheckedChange={setIsHomeService} />
                    </div>
                    
                    {isHomeService && (
                      <div className="pt-4 border-t border-border">
                        <Label>Full Address</Label>
                        <Input 
                          placeholder="Street, Apt, City..." 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-bold">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v: "online" | "cash") => setPaymentMethod(v)} className="grid grid-cols-2 gap-4">
                    <div className={`flex items-center p-4 border rounded-xl cursor-pointer ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <RadioGroupItem value="online" id="pay-online" className="mr-3" />
                      <Label htmlFor="pay-online" className="cursor-pointer font-medium">Pay Online</Label>
                    </div>
                    <div className={`flex items-center p-4 border rounded-xl cursor-pointer ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <RadioGroupItem value="cash" id="pay-cash" className="mr-3" />
                      <Label htmlFor="pay-cash" className="cursor-pointer font-medium">Pay at Shop</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label>Additional Notes (Optional)</Label>
                  <Input placeholder="Any special requests..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="pt-6 border-t border-border">
                  <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={handleSubmit}
                    disabled={createBooking.isPending || (isHomeService && !address)}
                  >
                    {createBooking.isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    Confirm Booking (${finalAmount.toFixed(2)})
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar Summary */}
        <div className="w-full md:w-[350px]">
          <Card className="sticky top-24 border-primary/10 shadow-lg bg-card overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-full bg-muted overflow-hidden shrink-0">
                  {barber.avatar ? <img src={barber.avatar} className="h-full w-full object-cover" alt="" /> : null}
                </div>
                <div>
                  <h4 className="font-bold text-primary">{barber.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" /> {barber.shopName || barber.city}</p>
                </div>
              </div>

              {timeSlot && (
                <div className="bg-secondary p-3 rounded-lg text-sm flex items-center justify-center font-medium text-secondary-foreground border border-border">
                  {format(date, 'MMM d, yyyy')} at {timeSlot.substring(0,5)}
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Services</span>
                    <span>{totalDuration} mins</span>
                  </div>
                  {selectedServices.map(id => {
                    const s = services.find(x => x.id === id);
                    if(!s) return null;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span>{s.name}</span>
                        <span className="font-medium">${s.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {step === 3 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Promo Code" 
                      value={couponCode} 
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="h-9"
                    />
                    <Button 
                      variant="secondary" 
                      className="h-9 shrink-0" 
                      onClick={handleValidateCoupon}
                      disabled={validateCouponMutation.isPending || !couponCode}
                    >
                      Apply
                    </Button>
                  </div>
                  {validatedCoupon && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Tag className="h-3 w-3 mr-1" /> Code {validatedCoupon.code} applied
                    </Badge>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {isHomeService && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Home Service Fee</span>
                    <span>${homeServiceCharge.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-primary pt-2">
                  <span>Total</span>
                  <span className="text-accent">${finalAmount.toFixed(2)}</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
