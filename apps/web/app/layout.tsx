import type { Metadata } from "next";
import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "UDS-HR | Saudi HR & Payroll Platform",
  description: "Human Resource Management System for Saudi MSMEs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="antialiased">
      <body className="min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
