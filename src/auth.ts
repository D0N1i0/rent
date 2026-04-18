// src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import type { Adapter } from "next-auth/adapters";
import type { Role } from "@prisma/client";

// Simple in-process user validation cache (5-minute TTL)
const userValidationCache = new Map<string, { validUntil: number; isValid: boolean }>();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Periodically re-validate that the user still exists and is active
      if (token.id) {
        const cached = userValidationCache.get(token.id as string);
        const now = Date.now();
        if (!cached || cached.validUntil < now) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { isActive: true },
            });
            const isValid = !!(dbUser?.isActive);
            userValidationCache.set(token.id as string, {
              validUntil: now + 5 * 60 * 1000, // 5 minutes
              isValid,
            });
            if (!isValid) {
              // Signal that this token should be invalidated
              return { ...token, invalidated: true };
            }
          } catch {
            // DB error — don't invalidate, allow graceful degradation
          }
        } else if (!cached.isValid) {
          return { ...token, invalidated: true };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.invalidated) {
        // Return empty/minimal session to effectively kill it
        return { ...session, user: { ...session.user, id: "", role: undefined as unknown as Role } };
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
