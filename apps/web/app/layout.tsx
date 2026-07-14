import type { Metadata } from "next";
import { Cairo, Inter, Amiri } from "next/font/google";
import { productBrand } from "@hrms-app/config/brand";
import "~/styles/globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${productBrand.name} | Saudi HR & Payroll Platform`,
    template: `%s | ${productBrand.name}`,
  },
  description: `${productBrand.name} (${productBrand.nameAr}) is a Saudi people, payroll, talent and compliance platform. ${productBrand.attribution}.`,
  applicationName: productBrand.name,
  icons: {
    icon: "/favicon.svg",
    apple: "/brand/taazur-mark.svg",
  },
  openGraph: {
    title: `${productBrand.name} · ${productBrand.nameAr}`,
    description: productBrand.tagline,
    images: ["/brand/taazur-lockup.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`antialiased ${cairo.variable} ${inter.variable} ${amiri.variable}`}
    >
      <body className="min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
