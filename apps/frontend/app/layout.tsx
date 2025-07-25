import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { ConditionalLayout } from "@/components/ConditionalLayout";

export const metadata = {
  title: "Memos - Developer Dashboard",
  description: "Manage your Memos integration and stored memories",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
            <SonnerToaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
