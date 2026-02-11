// /dashboard → redirects to role-specific dashboard
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const redirectMap: Record<string, string> = {
    admin: "/dashboard/admin",
    sales_manager: "/dashboard/sales",
    cs_staff: "/dashboard/dsr",
  };

  redirect(redirectMap[role] || "/dashboard/sales");
}
