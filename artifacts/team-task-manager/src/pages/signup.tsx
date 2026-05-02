import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useSignup, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";
import { SignupBodyRole } from "@workspace/api-client-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "member"]).optional(),
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const signupMutation = useSignup();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: "member" },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    signupMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/dashboard");
        },
        onError: (error) => {
          toast({
            title: "Signup failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border shadow-sm rounded-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-primary-foreground mb-4">
            <CheckSquare size={20} strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create account</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign up to get started</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(val) => form.setValue("role", val as SignupBodyRole)} defaultValue={form.getValues("role")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
            {signupMutation.isPending ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
