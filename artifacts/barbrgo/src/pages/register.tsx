import { useState } from "react";
import { useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Scissors, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "barber">("customer");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (res) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), res.user);
        toast({
          title: "Account created!",
          description: "Welcome to BarbrGo.",
        });
        
        if (res.user.role === "barber") setLocation("/dashboard/barber");
        else setLocation("/dashboard/user");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "Please check your information and try again.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    registerMutation.mutate({
      data: { name, email, phone, password, role }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30 py-12">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-3 items-center text-center pb-8">
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <Scissors className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold">Create an Account</CardTitle>
          <CardDescription>Join BarbrGo to book or offer services</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-3 pb-2">
              <Label>I want to use BarbrGo to...</Label>
              <RadioGroup value={role} onValueChange={(v: "customer" | "barber") => setRole(v)} className="flex gap-4">
                <div className="flex items-center space-x-2 border border-border p-3 rounded-lg flex-1 cursor-pointer hover:border-primary">
                  <RadioGroupItem value="customer" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer font-medium">Book a haircut</Label>
                </div>
                <div className="flex items-center space-x-2 border border-border p-3 rounded-lg flex-1 cursor-pointer hover:border-primary">
                  <RadioGroupItem value="barber" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer font-medium">Offer services</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+1 (555) 000-0000" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign up"}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
