"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@hrms-app/ui";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { t } from "~/lib/i18n";
import { Globe } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const { regulatoryContext, preferredLanguage, setPreferredLanguage } = useRegulatoryContext();
  const lang = preferredLanguage;

  const today = new Date();
  const dateStr = lang === "ar"
    ? today.toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
      {regulatoryContext === "saudi" && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Saudi Context
        </span>
      )}
      <span className="text-sm text-slate-400">{dateStr}</span>

      <button
        onClick={() => setPreferredLanguage(lang === "en" ? "ar" : "en")}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
      >
        <Globe className="h-4 w-4" />
        {lang === "en" ? "العربية" : "English"}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-xs font-semibold text-white shadow-sm">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="hidden sm:inline">{user.name ?? "User"}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-slate-500">{user.email ?? ""}</DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-2" />
          <DropdownMenuItem asChild className="rounded-lg text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900">
            <Link href="/settings">{t("nav.settings", lang)}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-2" />
          <DropdownMenuItem asChild className="rounded-lg text-sm text-red-600 focus:bg-red-50 focus:text-red-700">
            <Link href="/api/auth/signout">{t("nav.signOut", lang)}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
