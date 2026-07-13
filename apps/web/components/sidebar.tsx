"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChevronRight,
  CircleUserRound,
  FileText,
  Grid2X2,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { BrandLockup } from "~/components/brand/brand-lockup";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { can, type AppRole, type Capability } from "@hrms-app/auth/rbac";

type NavIcon = typeof LayoutDashboard;

interface NavItem {
  href: string;
  label: string;
  labelAr: string;
  icon: NavIcon;
  capability?: Capability;
}

interface NavGroup {
  label: string;
  labelAr: string;
  items: NavItem[];
}

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  onNavigate?: () => void;
}

const adminNavGroups: NavGroup[] = [
  {
    label: "Command",
    labelAr: "القيادة",
    items: [
      { href: "/", label: "Command center", labelAr: "مركز القيادة", icon: LayoutDashboard, capability: "dashboard:view_admin" },
      { href: "/modules", label: "All workspaces", labelAr: "جميع الوحدات", icon: Grid2X2, capability: "dashboard:view_admin" },
    ],
  },
  {
    label: "Workforce",
    labelAr: "القوى العاملة",
    items: [
      { href: "/employees", label: "People", labelAr: "الموظفون", icon: Users, capability: "people:view_company" },
      { href: "/departments", label: "Organization", labelAr: "الهيكل التنظيمي", icon: Building2, capability: "people:view_company" },
      { href: "/leave", label: "Time & leave", labelAr: "الوقت والإجازات", icon: CalendarCheck, capability: "attendance:view_company" },
      { href: "/payroll", label: "Payroll", labelAr: "الرواتب", icon: BriefcaseBusiness, capability: "payroll:view_company" },
      { href: "/documents", label: "Documents", labelAr: "المستندات", icon: FileText, capability: "documents:view_company" },
    ],
  },
  {
    label: "Talent",
    labelAr: "المواهب",
    items: [
      { href: "/recruitment", label: "Recruitment", labelAr: "التوظيف", icon: CircleUserRound, capability: "recruitment:view" },
      { href: "/retention", label: "Performance & growth", labelAr: "الأداء والنمو", icon: HeartHandshake, capability: "performance:view_team" },
      { href: "/modules/engagement-retention", label: "Engagement", labelAr: "المشاركة", icon: BarChart3, capability: "reports:view_company" },
    ],
  },
  {
    label: "Saudi & AI",
    labelAr: "السعودية والذكاء",
    items: [
      { href: "/compliance", label: "Compliance", labelAr: "الامتثال", icon: ShieldCheck, capability: "compliance:manage" },
      { href: "/qiwa", label: "Qiwa workspace", labelAr: "منصة قوى", icon: Landmark, capability: "integrations:manage" },
      { href: "/ai", label: "AI intelligence", labelAr: "الذكاء الاصطناعي", icon: Brain, capability: "reports:view_company" },
    ],
  },
];

const employeeNavGroups = [
  {
    label: "My workspace",
    labelAr: "مساحتي",
    items: [
      { href: "/", label: "My day", labelAr: "يومي", icon: LayoutDashboard },
      { href: "/profile", label: "My profile", labelAr: "ملفي", icon: CircleUserRound },
      { href: "/modules/time-leave-attendance", label: "My leave", labelAr: "إجازاتي", icon: CalendarCheck },
      { href: "/modules/documents-certificates", label: "My documents", labelAr: "مستنداتي", icon: FileText },
      { href: "/modules/performance-goals", label: "My goals", labelAr: "أهدافي", icon: HeartHandshake },
      { href: "/modules/learning-skills", label: "My learning", labelAr: "تعلمي", icon: BookOpenCheck },
      { href: "/modules/travel-expenses", label: "My expenses", labelAr: "مصروفاتي", icon: WalletCards },
    ],
  },
];

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { preferredLanguage } = useRegulatoryContext();
  const isArabic = preferredLanguage === "ar";
  const role = (user.role ?? "employee") as AppRole;
  const groups = user.role === "employee"
    ? employeeNavGroups
    : adminNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.capability || can(role, item.capability)),
        }))
        .filter((group) => group.items.length > 0);
  const canManageSettings = can(role, "settings:manage");

  return (
    <aside className="flex h-screen w-[278px] shrink-0 flex-col overflow-hidden bg-[#071b14] text-white">
      <div className="px-5 pb-4 pt-5">
        <BrandLockup inverse priority />
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            <div>
              <p className="text-xs font-medium text-white">{user.role === "employee" ? "Employee self-service" : "Saudi workspace"}</p>
              <p className="text-[10px] text-white/40">Rukn Energy · fictional demo</p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-amber-300" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
              {isArabic ? group.labelAr : group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white text-emerald-950" : "text-white/58 hover:bg-white/[0.07] hover:text-white"}`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-emerald-800" : "text-white/42 group-hover:text-amber-300"}`} />
                    <span className="flex-1 truncate font-medium">{isArabic ? item.labelAr : item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-emerald-700 rtl-flip" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {canManageSettings && (
          <Link href="/settings" onClick={onNavigate} className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/55 transition hover:bg-white/[0.07] hover:text-white">
            <Settings className="h-[18px] w-[18px]" />
            <span className="flex-1">{isArabic ? "الإعدادات" : "Settings"}</span>
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-xs font-bold text-emerald-950">{user.name?.[0]?.toUpperCase() ?? "U"}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name ?? "Team member"}</p>
            <p className="truncate text-[10px] capitalize text-white/40">{user.role?.replaceAll("_", " ") ?? "employee"}</p>
          </div>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-lg p-2 text-white/35 transition hover:bg-white/10 hover:text-white" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
