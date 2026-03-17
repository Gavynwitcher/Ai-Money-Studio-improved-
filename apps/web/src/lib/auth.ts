import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

function verifyPassword(password: string, stored: string) {
  const [prefix, salt, hash] = stored.split(":");
  if (prefix !== "scrypt" || !salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, "base64");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("base64")}`;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) return null;
        if (!verifyPassword(credentials.password, user.passwordHash)) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      }
    })
  ],
  pages: {
    signIn: "/signin"
  }
};
