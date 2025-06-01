
"use client";

import React, { useState, useEffect } from 'react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Settings, Loader2 } from 'lucide-react';
import { APP_TITLE } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { UserDetails } from '@/lib/authUtils';

export function AppHeader() {
  const { isMobile, open, state } = useSidebar();
  const showMobileTrigger = isMobile || state === 'collapsed';
  const router = useRouter();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);

  useEffect(() => {
    setIsLoadingUserDetails(true);
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as UserDetails;
        setUserDetails(parsedUser);
      } else {
        setUserDetails(null); // No user in session, potentially redirect or show guest state
      }
    } catch (error) {
      console.error("Error retrieving user details from sessionStorage:", error);
      setUserDetails(null); // Handle potential JSON parse errors or other issues
    } finally {
      setIsLoadingUserDetails(false);
    }
  }, [router]); // Re-run if router changes, e.g., after navigation

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Error removing user details from sessionStorage:", error);
    }
    setUserDetails(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        {showMobileTrigger && <SidebarTrigger />}
        {(isMobile || state === 'collapsed') && <h1 className="text-xl font-headline font-semibold">{APP_TITLE}</h1>}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {isLoadingUserDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : (userDetails ? userDetails.initials : "G")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {isLoadingUserDetails ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : userDetails ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userDetails.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userDetails.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="#"> 
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
             <>
              <DropdownMenuLabel className="font-normal text-center text-muted-foreground">
                Guest User
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/login')}>
                <User className="mr-2 h-4 w-4" />
                <span>Login</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
