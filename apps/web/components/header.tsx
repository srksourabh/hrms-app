"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, ChevronDown, Globe2, Menu, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hrms-app/ui";
import { todayHijri, formatDual, gregorianToHijri, parseDateString } from "@hrms-app/date";
import { useRegulatoryContext } from "~/lib/regulatory-context";

interface HeaderProps {
  user: { name?: string | null; email?: string | null };
  onOpenMenu?: () => void;
}

export function Header({ user, onOpenMenu }: HeaderProps) {
  const { preferredLanguage, setPreferredLanguage } = useRegulatoryContext();
  const isArabic = preferredLanguage === "ar";

  // Compute Hijri + Gregorian "today" for the date pill. Recomputed every minute
  // so the header always reflects the current day.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const greg = now
    ? { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
    : null;
  const hijri = now ? todayHijri() : null;
  const dualDate =
    greg && hijri ? formatDual(greg, hijri, isArabic ? "ar" : "en") : "";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200/80 bg-[#f7f7f4]/90 px-4 backdrop-blur-xl sm:px-6">
      <button type="button" onClick={onOpenMenu} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/modules" className="group hidden h-11 min-w-0 max-w-md flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-400 transition hover:border-emerald-800/25 hover:text-slate-700 sm:flex">
        <Search className="h-4 w-4" />
        <span className="truncate">{isArabic ? "ابحث في الموظفين والوحدات والمهام" : "Search people, modules and actions"}</span>
        <span className="ml-auto hidden items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400 lg:flex"><span>K</span></span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Hijri-focal date pill: today's Gregorian | Hijri (Umm al-Qura). */}
        <div
          dir={isArabic ? "rtl" : "ltr"}
          className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-[0_1px_0_rgba(0,108,53,0.04)] xl:flex"
          title={isArabic ? "تاريخ اليوم الميلادي والهجري" : "Today · Gregorian and Hijri (Umm al-Qura)"}
        >
          <CalendarClock className="h-3.5 w-3.5 text-emerald-700" />
          <span className="whitespace-nowrap">{dualDate}</span>
        </div>

        <button type="button" onClick={() => setPreferredLanguage(isArabic ? "en" : "ar")} className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950">
          <Globe2 className="h-4 w-4" /><span className="hidden sm:inline">{isArabic ? "English" : "العربية"}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950 focus:outline-none data-[state=open]:bg-white" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#f7f7f4] bg-amber-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{isArabic ? "الإشعارات" : "Notifications"}</p>
              <p className="mt-0.5 text-xs font-normal text-slate-400">
                {isArabic ? `${notifications.length} رسائل غير مقروءة` : `${notifications.length} unread updates`}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} asChild className="rounded-xl">
                  <Link href={n.href} className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.toneClass}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{isArabic ? n.titleAr : n.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{isArabic ? n.bodyAr : n.body}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-wider text-slate-400">{n.time}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/notifications" className="flex w-full items-center justify-center px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                {isArabic ? "عرض كل الإشعارات" : "View all notifications"}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#071b14] text-xs font-bold text-white">{user.name?.[0]?.toUpperCase() ?? "U"}</span>
            <span className="hidden max-w-28 truncate lg:inline">{user.name ?? "HR Manager"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{user.name ?? "HR Manager"}</p>
              <p className="mt-0.5 truncate text-xs font-normal text-slate-400">{user.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl"><Link href="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl"><Link href="/settings">Settings</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  href: string;
  time: string;
  toneClass: string;
}

// Fictional demo notifications — visible to all roles so the bell is non-empty
// for the customer demo without depending on real cron jobs.
const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "June payroll pre-check passed",
    titleAr: "فحص يونيو التمهيدي للرواتب مكتمل",
    body: "12 payslips validated, 2 anomalies flagged for review.",
    bodyAr: "تم التحقق من 12 كشف راتب، هناك ملاحظتان تحتاجان مراجعة.",
    href: "/payroll",
    time: "Just now",
    toneClass: "bg-emerald-500",
  },
  {
    id: "n2",
    title: "Iqama expiry in 28 days · Priya Menon",
    titleAr: "انتهاء الإقامة خلال 28 يومًا · برييا مينون",
    body: "Renew before 11 August 2026 to avoid visa lapse.",
    bodyAr: "يرجى التجديد قبل 11 أغسطس 2026 لتجنب انتهاء التأشيرة.",
    href: "/employees",
    time: "2h ago",
    toneClass: "bg-amber-500",
  },
  {
    id: "n3",
    title: "New candidate applied: Field Engineer",
    titleAr: "مرشح جديد قدّم على وظيفة مهندس ميداني",
    body: "Salman Al-Mutairi submitted application for Riyadh branch.",
    bodyAr: "قدّم سلمان المطيري طلبًا لفرع الرياض.",
    href: "/recruitment/candidates",
    time: "Today",
    toneClass: "bg-sky-500",
  },
  {
    id: "n4",
    title: "Nitaqat band recompute due",
    titleAr: "إعادة حساب نطاق النطاقات",
    body: "Run the monthly Saudization recompute before 25 July.",
    bodyAr: "يرجى إعادة حساب نطاقات السعودة قبل 25 يوليو.",
    href: "/compliance",
    time: "Yesterday",
    toneClass: "bg-violet-500",
  },
];