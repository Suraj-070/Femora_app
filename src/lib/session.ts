// Server-side helper to get the current authenticated user id
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}
