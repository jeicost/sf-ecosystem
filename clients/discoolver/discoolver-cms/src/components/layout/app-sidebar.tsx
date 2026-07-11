"use client";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/config/routes";
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AppName } from "../common/app-name";

// Navigation data
const navMain = [
  {
    title: "Recomendados",
    url: ROUTES.RECOMMENDED,
    icon: LayoutDashboard,
  },
  {
    title: "Transacciones",
    url: ROUTES.TRANSACTIONS,
    icon: ArrowRightLeft,
  },
  {
    title: "Profesionales",
    url: ROUTES.PROFESSIONALS,
    icon: BriefcaseBusiness,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex justify-center items-center w-8 h-8">
          <Link href={ROUTES.HOME}>
            <AppName className="text-foreground" height={20} width={20} />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
