"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Mail,
  Users,
  X,
  FilePlus,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    label: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "My Dashboard",
    href: "/dashboard/sales",
    icon: BarChart3,
    roles: ["sales_manager"],
  },
  {
    label: "Import Data",
    href: "/dashboard/sales/import",
    icon: Upload,
    roles: ["sales_manager"],
  },
  {
    label: "Sales Report",
    href: "/dashboard/sales/report",
    icon: FileBarChart,
    roles: ["sales_manager", "admin"],
  },
  {
    label: "DSR Reports",
    href: "/dashboard/dsr",
    icon: Mail,
    roles: ["cs_staff", "admin"],
  },
  {
    label: "New DSR",
    href: "/dashboard/dsr/new",
    icon: FilePlus,
    roles: ["cs_staff"],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role || "";
  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <Image
              src="/logo.webp"
              alt="TigerOps"
              width={36}
              height={36}
              className="rounded"
            />
            <span className="font-bold text-lg">TigerOps</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard/admin" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User info at bottom */}
        <div className="p-3">
          {session?.user && (
            <div className="px-2">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {role.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
