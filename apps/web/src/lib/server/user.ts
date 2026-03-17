import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { randomBytes, scryptSync } from "crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("base64")}`;
}

export async function resolveActiveUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) return user.id;
  }

  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@research.local" },
    select: { id: true }
  });
  if (demoUser) return demoUser.id;

  const firstUser = await prisma.user.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
  if (firstUser) return firstUser.id;

  const bootstrapEmail = process.env.BOOTSTRAP_USER_EMAIL ?? "local@research.local";
  const bootstrapPassword = process.env.BOOTSTRAP_USER_PASSWORD ?? "localdev123!";
  const createdUser = await prisma.user.create({
    data: {
      email: bootstrapEmail,
      name: "Local Research User",
      passwordHash: hashPassword(bootstrapPassword)
    },
    select: { id: true }
  });
  return createdUser.id;
}
