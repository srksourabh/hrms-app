"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { RegulatoryContext } from "~/lib/regulatory-context";
import type { Lang } from "~/lib/i18n";

interface DashboardUser {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface DashboardShellProps {
  user: DashboardUser;
  regulatoryContext: "saudi" | "india";
  preferredLanguage: Lang;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  regulatoryContext,
  preferredLanguage: initialLang,
  children,
}: DashboardShellProps) {
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(initialLang);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSetLanguage = useCallback((lang: Lang) => {
    setPreferredLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, []);

  return (
    <RegulatoryContext.Provider value={{ regulatoryContext, preferredLanguage, setPreferredLanguage: handleSetLanguage }}>
      <div className="min-h-screen bg-[#f7f7f4]">
        {/* UX-011: skip past the sidebar nav straight to the page content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-emerald-600"
        >
          Skip to main content
        </a>
        <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
          <Sidebar user={user} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative h-full w-[278px] shadow-2xl">
              <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
              <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="min-h-screen md:pl-[278px]">
          <Header user={user} onOpenMenu={() => setMobileOpen(true)} />
          <main id="main-content" className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RegulatoryContext.Provider>
  );
}
