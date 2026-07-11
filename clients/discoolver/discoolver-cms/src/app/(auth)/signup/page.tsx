import { SignupForm } from "@/components/auth/signup-form";
import { APP_CONFIG } from "@/config/app";
import { ROUTES } from "@/config/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default async function SignupPage() {
  // Check if signup is enabled
  if (!APP_CONFIG.SIGNUP_ENABLED) {
    redirect(ROUTES.LOGIN);
  }

  // Check if user is already authenticated
  // const session = await auth();
  // if (session) {
  //   redirect(ROUTES.DASHBOARD);
  // }

  return <SignupForm />;
}
