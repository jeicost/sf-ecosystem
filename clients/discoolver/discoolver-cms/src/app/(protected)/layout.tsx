import { logout } from "@/app/actions/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/config/routes";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect(ROUTES.LOGIN);
  }

  const currentUser = await getCurrentUser();
  const isRecommended = currentUser?.recommended === true;

  if (isRecommended) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex justify-end items-center px-6 h-14 border-b shrink-0">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="mr-2 w-4 h-4" />
              Cerrar sesión
            </Button>
          </form>
        </header>
        <main className="px-4 py-6">{children}</main>
      </div>
    );
  }

  // Format user data for the sidebar
  const userData = {
    name:
      currentUser?.name && currentUser?.surname
        ? `${currentUser.name} ${currentUser.surname}`
        : currentUser?.name || currentUser?.login || "User",
    email: currentUser?.mail || "",
    avatar: undefined, // No avatar in the API response yet
  };

  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset>
        <header className="flex gap-2 items-center px-8 h-16 border-b shrink-0">
          <SidebarTrigger className="-ml-1" />
          <DynamicBreadcrumb />
        </header>
        <main className="px-4 py-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
