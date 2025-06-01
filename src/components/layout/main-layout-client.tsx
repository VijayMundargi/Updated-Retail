
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { APP_TITLE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react'; // Using Palette as a placeholder for ThemeIcon

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Dummy theme toggle function
  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };
  
  if (isAuthPage) {
    // For auth pages, render children directly without the main app layout shell.
    // The auth pages themselves define their full-page layout.
    return <>{children}</>;
  }
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="flex flex-col">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-headline font-semibold group-data-[collapsible=icon]:hidden">{APP_TITLE}</h1>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4">
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
            <Palette size={18}/>
            <span className="group-data-[collapsible=icon]:hidden">Toggle Theme</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
