import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Design Brief | Barnhaus Steel Builders",
  description: "Help us understand your construction needs",
  icons: {
    icon: "https://hbfjdfxephlczkfgpceg.supabase.co/storage/v1/object/public/website/logos/logo1.png",
    apple: "https://hbfjdfxephlczkfgpceg.supabase.co/storage/v1/object/public/website/logos/logo1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
