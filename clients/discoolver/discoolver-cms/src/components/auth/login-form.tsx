"use client";

import { login } from "@/app/actions";
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
import { APP_CONFIG } from "@/config/app";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { ApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  user: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z
    .string()
    .min(5, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type FormData = z.infer<typeof formSchema>;

const errorMessages = {
  SignupDisabled: "El registro está desactivado",
  default: "Algo salió mal. Por favor, inténtalo de nuevo.",
  CredentialsSignin: "Usuario o contraseña inválidos",
};

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callbackUrl = searchParams?.get("callbackUrl");
  const error = searchParams?.get("error");
  const sessionExpired = searchParams?.get("session_expired");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: "",
      password: "",
    },
  });

  // Clear error message when user starts typing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (errorMessage) {
        setErrorMessage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, errorMessage]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null); // Clear any previous errors

    try {
      const response = await login(data);

      // Recommended users go directly to their business page
      if (response.recommended && response.idRecommendeds?.length > 0) {
        router.push(
          ROUTES.RECOMMENDED_DETAIL(String(response.idRecommendeds[0])),
        );
        return;
      }

      // Redirect based on callback URL or default route
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(ROUTES.HOME);
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof ApiError) {
        // Handle API-specific errors
        setErrorMessage(error.message || errorMessages.default);
      } else {
        setErrorMessage(errorMessages.default);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!form || !error) return;

    setErrorMessage(
      errorMessages[error as keyof typeof errorMessages] || error,
    );

    // Clean URL params
    router.replace(ROUTES.LOGIN, { scroll: false });
  }, [error, form, router]);

  // Show toast when session has expired
  useEffect(() => {
    if (sessionExpired === "true") {
      toast.error("Tu sesión ha caducado");
      // Clean URL params
      router.replace(ROUTES.LOGIN, { scroll: false });
    }
  }, [sessionExpired, router]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col gap-2 items-center text-center">
          <h1 className="text-2xl font-bold">Inicia sesión en tu cuenta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Introduce tus datos a continuación para acceder al panel
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input
                    placeholder="nombre de usuario"
                    type="text"
                    {...field}
                  />
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
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {errorMessage && (
            <div className="p-4 text-sm font-medium rounded-md border bg-destructive/10 text-destructive border-destructive/50">
              {errorMessage}
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </div>
        {APP_CONFIG.SIGNUP_ENABLED && (
          <div className="text-sm text-center">
            ¿No tienes una cuenta?{" "}
            <Link
              href={ROUTES.SIGN_UP}
              className="underline underline-offset-4"
            >
              Regístrate
            </Link>
          </div>
        )}
      </form>
    </Form>
  );
}
