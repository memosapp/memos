"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/signin" || pathname === "/auth/callback";
  const isSigninPage = pathname === "/signin";

  return (
    <div className={`h-screen font-sans antialiased flex flex-col ${isSigninPage ? 'bg-white' : 'bg-zinc-950'}`}>
      {!isAuthPage && <Navbar />}
      <ScrollArea className={isAuthPage ? "h-full" : "h-[calc(100vh-64px)]"}>
        {children}
      </ScrollArea>
    </div>
  );
} 