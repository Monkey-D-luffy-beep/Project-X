import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = nextUrl.pathname === "/login";
  const isOnChangePassword = nextUrl.pathname === "/change-password";

  // Redirect unauthenticated users to login
  if ((isOnDashboard || isOnChangePassword) && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Force password change for mustChangePassword users
  if (isLoggedIn && (session.user as { mustChangePassword?: boolean }).mustChangePassword) {
    if (isOnChangePassword || nextUrl.pathname === "/api/auth/change-password") {
      return;
    }
    if (isOnDashboard || isOnLogin) {
      return Response.redirect(new URL("/change-password", nextUrl));
    }
  }

  // Redirect authenticated users away from login to their role-based dashboard
  if (isOnLogin && isLoggedIn) {
    const role = (session.user as { role?: string }).role;
    const redirectMap: Record<string, string> = {
      admin: "/dashboard/admin",
      sales_manager: "/dashboard/sales",
      cs_staff: "/dashboard/dsr",
    };
    const target = redirectMap[role || ""] || "/dashboard/sales";
    return Response.redirect(new URL(target, nextUrl));
  }

  // Redirect authenticated users away from change-password if they don't need it
  if (isOnChangePassword && isLoggedIn && !(session.user as { mustChangePassword?: boolean }).mustChangePassword) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Enforce role-based access to dashboard sections
  if (isOnDashboard && isLoggedIn) {
    const role = (session.user as { role?: string }).role;
    const path = nextUrl.pathname;

    if (role === "admin") return;

    if (role === "sales_manager" && !path.startsWith("/dashboard/sales")) {
      return Response.redirect(new URL("/dashboard/sales", nextUrl));
    }

    if (role === "cs_staff" && !path.startsWith("/dashboard/dsr")) {
      return Response.redirect(new URL("/dashboard/dsr", nextUrl));
    }
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/change-password"],
};
