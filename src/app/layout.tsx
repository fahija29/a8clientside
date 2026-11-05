
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "BookNook | Your Small Online Library",
  description:
    "BookNook is a small online library where readers can discover, add, borrow, and return books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-[#0b120d] dark:text-slate-100">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("booknook-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch(e){}',
          }}
        />
        <div className="flex min-h-screen flex-col">
          <AuthProvider>
            <Suspense
              fallback={
                <div className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/95 dark:border-white/10 dark:bg-[#0e1710]" />
              }
            >
              <Navbar />
            </Suspense>

            <main className="flex-1">{children}</main>

            <Footer />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}

