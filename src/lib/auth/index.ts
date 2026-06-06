/**
 * Creation/modification date: 21/05/2026
 * Path: src/lib/auth/index.ts
 * Description: Central Auth.js v5 configuration. Manages JWT sessions with companyId + role injection.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, companies } from "@/db/schema/auth";
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
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string;
        session.user.role = token.role as Role;

        // Fetch company travel rate for the session
        try {
          const [company] = await db
            .select({ travelRatePerKm: companies.travelRatePerKm })
            .from(companies)
            .where(eq(companies.id, token.companyId as string))
            .limit(1);

          if (company) {
            session.user.travelRatePerKm = company.travelRatePerKm;
          }
        } catch {
          // Ignore, travel rate is optional
        }
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
