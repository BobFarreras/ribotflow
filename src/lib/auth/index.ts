/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/auth/index.ts
 * Description: Central Auth.js v5 configuration. Uses JWT session strategy
 *              so that CredentialsProvider (email/password login) works.
 *              We manually insert a row into the `sessions` table on
 *              every sign-in so that the "Active Sessions" UI still
 *              has data to display. The session callback enriches the
 *              JWT token with companyId, role, and travel rate.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, companies, sessions } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/utils/crypto";
import type { Role } from "@/types";
import { randomUUID } from "crypto";
import { headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user) {
        token.sub = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.name = user.name;
        token.email = user.email;

        // Pull travelRatePerKm once and persist it in the token
        // so the session callback never needs to hit the DB.
        try {
          const [company] = await db
            .select({ travelRatePerKm: companies.travelRatePerKm })
            .from(companies)
            .where(eq(companies.id, user.companyId as string))
            .limit(1);
          if (company) {
            token.travelRatePerKm = company.travelRatePerKm;
          }
        } catch {
          // ignore
        }

        // Bump lastActiveAt
        try {
          await db
            .update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id as string));
        } catch {
          // best-effort
        }

        // Create a session row manually so the Active Sessions UI has data.
        // Auth.js does NOT manage this table when strategy === "jwt".
        try {
          const h = await headers();
          const userAgent = h.get("user-agent") ?? null;
          const ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null;
          await db.insert(sessions).values({
            sessionToken: randomUUID(),
            userId: user.id as string,
            expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
            userAgent,
            ipAddress,
            createdAt: new Date(),
            lastUsedAt: new Date(),
          });
        } catch {
          // best-effort
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Security: verify the role stored in the token still matches the
        // database. If an OWNER changed this user's role, the token is stale
        // and must be rejected (forces a re-login).
        try {
          const [u] = await db
            .select({ role: users.role, status: users.status })
            .from(users)
            .where(eq(users.id, token.sub))
            .limit(1);

          if (!u || u.status !== "active" || u.role !== token.role) {
            // Return a stripped session so the client treats it as logged-out
            return { expires: new Date(0).toISOString() } as typeof session;
          }
        } catch {
          // On DB error, still allow the session (fail-open) so the user
          // is not locked out during a transient DB outage.
        }

        session.user.id = token.sub;
        session.user.role = token.role as Role;
        session.user.companyId = token.companyId as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.travelRatePerKm =
          token.travelRatePerKm != null ? String(token.travelRatePerKm) : null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
});
