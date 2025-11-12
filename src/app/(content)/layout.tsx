import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { Separator } from "@/components/ui/separator";
import { ThemeButton } from "@/components/theme-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuParser - AI Document Processing",
  description:
    "Transform your documents into conversations with AI-powered document processing and intelligent question-answering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en">
    //   <body
    //     className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    //     suppressHydrationWarning={true}
    //   >

    <SidebarProvider>
      <div className="flex w-full h-screen ">
        <div>
          <SidebarLeft className="shrink-0" />
        </div>
        <div className="flex flex-col flex-1">
          <header className="bg-background sticky top-0 flex h-15 py-5 shrink-0 items-center gap-2 border-b w-full px-3">
            <div className="flex flex-1 items-center gap-2 ">
              <div className="flex items-center ">
                <SidebarTrigger />
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Document Parser
                </h1>
              </div>
            </div>
            <div className="px-3">
              <ThemeButton />
            </div>
          </header>
          <div className="px-3 flex-1 overflow-auto">{children}</div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>

    //   </body>
    // </html>
  );
}
