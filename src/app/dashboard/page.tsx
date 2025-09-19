"use client";

import { UserDashboard } from "@/components/user-dashboard";
import { SidebarLeft } from "@/components/sidebar-left";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeButton } from "@/components/theme-button";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <ThemeButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <UserDashboard />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
