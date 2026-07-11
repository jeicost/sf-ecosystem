// import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default async function LoginPage() {
  // const session = await auth();

  // if (session) {
  //   redirect(ROUTES.DASHBOARD);
  // }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
