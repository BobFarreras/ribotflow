/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/auth/index.ts
 * Description: Central Auth.js v5 configuration. We use the
 *              `database` session strategy so that the user can list and
 *              revoke their own active sessions from /settings/profile.
 *              The session callback enriches the user object with
 *              companyId, role, and travel rate; the events callback
 *              captures best-effort user agent and IP at sign-in.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, companies, sessions } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/utils/crypto";
import type { Role } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            passwordHash: users.passwordHash,
            role: users.role,
            companyId: users.companyId,
            status: users.status,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user.length === 0) return null;

        // Only active users with a password can sign in.
        if (user[0].status !== "active" || !user[0].passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user[0].passwordHash);
        if (!isValid) return null;

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          role: user[0].role as Role,
          companyId: user[0].companyId,
        };
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async session({ session, user }) {
      // `user` is hydrated by the database adapter; we map DB columns to
      // the session.user shape the rest of the app expects.
      if (session.user && user) {
        session.user.id = (user as { id: string }).id;
        // Pull companyId + role + lastActiveAt from the user row
        const [u] = await db
          .select({
            companyId: users.companyId,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1);
        if (u) {
          session.user.companyId = u.companyId;
          session.user.role = u.role as Role;

          try {
            const [company] = await db
              .select({ travelRatePerKm: companies.travelRatePerKm })
              .from(companies)
              .where(eq(companies.id, u.companyId))
              .limit(1);
            if (company) {
              session.user.travelRatePerKm = company.travelRatePerKm;
            }
          } catch {
            // Ignore, travel rate is optional
          }
        }
      }
      return session;
    },
  },
  events: {
    /**
     * Auth.js fires this AFTER a database session has been created.
     * We use it to capture the user agent and IP for the active
     * session list, and to bump `users.lastActiveAt`.
     */
    async signIn({ user }) {
      try {
        await db
          .update(users)
          .set({ lastActiveAt: new Date() })
          .where(eq(users.id, user.id as string));
      } catch {
        // best-effort
      }
    },
    async session({ session }) {
      // No-op hook (kept as a no-op extension point). The actual
      // lastUsedAt bookkeeping lives in the service that needs it.
      // Leaving the hook here documents the lifecycle for future
      // maintainers.
      void session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
});
