// src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import type { Adapter } from "next-auth/adapters";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
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
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: 10 login attempts per 15 minutes per email address.
        // Keying on email (not IP) is more effective for credential stuffing —
        // attackers rotate IPs but stay on the same target email.
        const rl = rateLimit(`login:${normalizedEmail}`, 10, 15 * 60 * 1000);
        if (!rl.allowed) {
          // NextAuth swallows the error message; returning null shows a generic
          // "Invalid credentials" which is intentional (don't leak rate-limit state).
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
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
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
