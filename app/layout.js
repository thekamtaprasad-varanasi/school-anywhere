export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import FlashMessageContainer from "@/components/FlashMessageContainer";
import { cookies } from "next/headers";
import "./globals.css";
import { getSession } from "@/lib/session";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Nishant School Software",
  description: "School Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nishant School Software",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4338ca",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = token ? await getSession(token) : null;

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-100`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
        <FlashMessageContainer />

        {user ? (
          <div className="min-h-screen">
            {/* Top Bar — only Logout */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-900 shadow-md">
              <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
                <a
                  href="/menu"
                  className="text-indigo-200 text-sm font-medium hover:text-white transition"
                >
                  ☰ Menu
                </a>
                <form action="/logout" method="POST">
                  <button type="submit" className="text-red-300 text-sm">
                    🚪 Logout
                  </button>
                </form>
              </div>
            </div>

            {/* Main content — centered, mobile-style width */}
            <main className="max-w-2xl mx-auto px-4 pt-16 pb-8">
              {children}
            </main>
          </div>
        ) : (
          <div>
            <nav className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                  <div className="text-xl font-bold text-indigo-600">
                    Nishant School Software
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
