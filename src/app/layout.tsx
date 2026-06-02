import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { runtimeConfig } from "@/config/runtime";
import { AnalyticsConsent } from "@/components/consent/AnalyticsConsent";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const logoFont = Sora({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: runtimeConfig.app.title,
  description: runtimeConfig.app.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiEnabled =
    runtimeConfig.umami.enabled &&
    runtimeConfig.umami.websiteId.length > 0 &&
    runtimeConfig.umami.scriptUrl.length > 0;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${logoFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
                <SiteHeader />
                <div className="flex-1 bg-muted/10">
                  <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-4 lg:px-8 lg:py-8">
                    {children}
                  </div>
                </div>
                <ConditionalSiteFooter />
              </main>
            </SidebarProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <AnalyticsConsent
          umamiEnabled={umamiEnabled}
          umamiWebsiteId={runtimeConfig.umami.websiteId}
          umamiScriptUrl={runtimeConfig.umami.scriptUrl}
        />
      </body>
    </html>
  );
}
