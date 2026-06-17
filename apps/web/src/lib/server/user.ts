import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
export async function resolveActiveUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) return user.id;
  }

  throw new Error("AUTH_REQUIRED");
}

export function isAuthRequiredError(error: unknown) {
  return error instanceof Error && error.message === "AUTH_REQUIRED";
}
