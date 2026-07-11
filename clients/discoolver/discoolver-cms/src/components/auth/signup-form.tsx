"use client";

// import { createRegularAccount } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
// import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    // try {
    //   const result = await createRegularAccount({
    //     name: data.name,
    //     email: data.email,
    //     password: data.password,
    //   });

    //   if (result.success) {
    //     toast.success("Account created successfully!");

    //     // Sign in the user after successful registration
    //     const signInResult = await signIn("credentials", {
    //       email: data.email,
    //       password: data.password,
    //       redirect: false,
    //     });

    //     if (signInResult?.error) {
    //       toast.error(
    //         "Account created but failed to sign in. Please try signing in manually."
    //       );
    //     } else {
    //       // Redirect to dashboard
    //       window.location.href = ROUTES.DASHBOARD;
    //     }
    //   } else {
    //     form.setError("root", {
    //       message:
    //         result.error || "Failed to create account. Please try again.",
    //     });
    //   }
    // } catch (error) {
    //   console.error("Signup error:", error);
    //   form.setError("root", {
    //     message: "Something went wrong. Please try again.",
    //   });
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your information below to create your account
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <div className="text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </div>
        <div className="text-sm text-center">
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="underline underline-offset-4">
            Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
