import AppProviders from "@/components/AppProviders";
import DbUserBootstrap from "@/components/DbUserBootstrap";
import SubpageTopBar from "@/components/navigation/SubpageTopBar";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wechu",
    template: "%s · Wechu",
  },
  description: "GPS 줄 대기, 리워드, 위츄, 헤메코 투표",
  applicationName: "Wechu",
  appleWebApp: {
    capable: true,
    title: "Wechu",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#c1e5ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-dvh antialiased">
        <div className="flex min-h-dvh justify-center">
          <div
            className="app-column-w app-canvas-inner relative flex min-h-dvh w-full flex-col border-x border-sky-200/45 bg-[var(--wechu-base)] pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_0_1px_rgba(30,41,59,0.06),0_12px_40px_rgba(30,41,59,0.05)]"
            id="wechu-app-shell"
          >
            <AppProviders>
              <DbUserBootstrap>
                <SubpageTopBar />
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </DbUserBootstrap>
            </AppProviders>
          </div>
        </div>
      </body>
    </html>
  );
}
