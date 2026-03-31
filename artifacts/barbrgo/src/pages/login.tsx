import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (res) => {
        // Cache the user
        queryClient.setQueryData(getGetCurrentUserQueryKey(), res.user);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        // Redirect based on role
        if (res.user.role === "admin") setLocation("/admin");
        else if (res.user.role === "barber") setLocation("/dashboard/barber");
        else setLocation("/dashboard/user");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid credentials. Please try again.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    loginMutation.mutate({
      data: { email, password }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-3 items-center text-center pb-8">
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <Scissors className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
              </div>
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
              className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log in"}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
