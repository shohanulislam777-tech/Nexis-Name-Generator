import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Terminal } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Authentication successful", description: "Welcome to Nexis Control." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({ 
          title: "Authentication failed", 
          description: error.message || "Invalid credentials", 
          variant: "destructive" 
        });
      }
    }
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data });
  };

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
      </div>

      <Card className="w-full max-w-sm z-10 border-border bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20 mb-2">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Nexis Operator</CardTitle>
            <CardDescription className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              System Authentication Required
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Identifier</Label>
                    <FormControl>
                      <Input 
                        placeholder="admin" 
                        {...field} 
                        className="font-mono bg-background/50 focus-visible:ring-primary/50"
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Passcode</Label>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="font-mono bg-background/50 focus-visible:ring-primary/50"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full font-mono uppercase tracking-widest text-xs h-10" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
