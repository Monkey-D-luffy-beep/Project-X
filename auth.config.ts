import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    managerId?: string | null;
    mustChangePassword: boolean;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      managerId?: string | null;
      mustChangePassword: boolean;
    };
  }
}

// Edge-safe config — NO Prisma / bcrypt imports
// Used by middleware for JWT reading only
export default {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  providers: [], // providers added in auth.ts (Node.js only)
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerId = user.managerId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.managerId = token.managerId;
      session.user.mustChangePassword = token.mustChangePassword;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard && !isLoggedIn) return false; // redirects to signIn page
      return true;
    },
  },
} satisfies NextAuthConfig;
