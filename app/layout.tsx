import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Override with NEXT_PUBLIC_SITE_URL so social previews and canonicals use the
// deployed domain instead of localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://maxstream.pages.dev";

const title = "MaxStream — Stream Movies & Series";
const description =
  "Stream movies and series on your phone, tablet, Android TV, or Windows PC. Free, fast, and ad-free.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "MaxStream",
  alternates: { canonical: "/" },
  icons: {
    icon: "/app_icon.png",
  },
  openGraph: {
    title,
    description,
    siteName: "MaxStream",
    url: "/",
    images: ["/app_icon.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/app_icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

// Runs before first paint: the server can't know the visitor's theme, so this
// avoids the dark flash that happened when ThemeProvider corrected it after
// hydration.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
