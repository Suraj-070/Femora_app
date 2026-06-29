import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthScreen } from "@/components/femora/auth-screen";
import { AppShell } from "@/components/femora/app-shell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <AuthScreen />;
  }

  const user = {
    id: (session.user as { id?: string }).id ?? "",
    email: session.user.email ?? "",
    name: session.user.name ?? null,
  };

  return <AppShell user={user} />;
}
