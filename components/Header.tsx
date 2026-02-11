"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle: () => void;
}

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  cs_staff: "CS Staff",
};

const roleColorMap: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  sales_manager: "bg-blue-100 text-blue-800",
  cs_staff: "bg-green-100 text-green-800",
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const role = session?.user?.role || "";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb / Page title area */}
      <div className="flex-1" />

      {/* User info */}
      {session?.user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium leading-none">
              {session.user.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </div>
          <Badge
            variant="outline"
            className={roleColorMap[role] || ""}
          >
            {roleLabelMap[role] || role}
          </Badge>
          <Link href="/change-password">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Change Password">
              <Lock className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
