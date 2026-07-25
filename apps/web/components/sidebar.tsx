"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  FileCheck2,
  GitBranch,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MapPin,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { BrandLockup } from "~/components/brand/brand-lockup";

type NavIcon = typeof LayoutDashboard;

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  onNavigate?: () => void;
}

const navItems: Array<{ href: string; label: string; icon: NavIcon; employee?: boolean }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/designations", label: "Designations", icon: BriefcaseBusiness },
  { href: "/departments/organogram", label: "Organogram", icon: GitBranch, employee: true },
  { href: "/attendance/me", label: "Punch in/out", icon: MapPin, employee: true },
  { href: "/attendance/portal", label: "Attendance portal", icon: CalendarCheck },
  { href: "/attendance/reports", label: "Attendance reports", icon: BarChart3 },
  { href: "/locations", label: "Locations", icon: MapPinned },
  { href: "/leave", label: "Leave", icon: CalendarCheck, employee: true },
  { href: "/expenses", label: "Expenses", icon: WalletCards, employee: true },
  { href: "/payroll", label: "Payroll", icon: BriefcaseBusiness },
  { href: "/compliance", label: "Saudi compliance", icon: ShieldCheck },
  { href: "/reports", label: "Daily / weekly / monthly", icon: FileCheck2 },
];

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const isEmployee = user.role === "employee";
  const visibleItems = isEmployee ? navItems.filter((item) => item.employee || item.href === "/") : navItems;

  return (
    <aside className="flex h-screen w-[278px] shrink-0 flex-col overflow-hidden bg-[#071b14] text-white">
      <div className="px-5 pb-4 pt-5">
        <BrandLockup inverse priority />
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3">
          <p className="text-xs font-semibold text-white">Rukn Energy Services</p>
          <p className="mt-1 text-[11px] text-white/50">Saudi HR, payroll and compliance</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">Core HR</p>
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? "bg-white text-emerald-950" : "text-white/65 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-emerald-800" : "text-white/45"}`} />
                <span className="truncate font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-300 text-xs font-bold text-emerald-950">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name ?? "Team member"}</p>
            <p className="truncate text-[10px] capitalize text-white/45">{user.role?.replaceAll("_", " ") ?? "employee"}</p>
          </div>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-md p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
