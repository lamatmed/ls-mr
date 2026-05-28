import type { Metadata } from "next";
import "./globals.css";
import Footer from "./components/Footer";
import { ToastContainer } from "react-toastify";
import Header from "./components/Header";
import Background from "./components/Background";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

export const metadata: Metadata = {
  title: "ستوك-لوكال | Stock-Local",
  description: "تطبيق إدارة المخزون - لامات عبد الله",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "إدارة المخزون",
    "msapplication-TileColor": "#3b82f6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="font-system" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        {/* Prevent dark-mode flash before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="antialiased relative">
        <ThemeProvider>
          <LanguageProvider>
            <Background />
            <div className="min-h-screen flex flex-col relative z-10">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <ToastContainer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
