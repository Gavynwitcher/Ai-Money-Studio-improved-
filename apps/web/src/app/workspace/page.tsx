import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ClientWorkspace } from "@/components/dashboard/client-workspace";
import { Container } from "@/components/ui/container";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Client Workspace",
  robots: {
    index: false,
    follow: false
  }
};

export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/workspace");
  }

  const userName = session.user.name?.trim() || session.user.email;

  return (
    <section className="page-section pt-12">
      <Container>
        <ClientWorkspace userName={userName} userEmail={session.user.email} />
      </Container>
    </section>
  );
}
