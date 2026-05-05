import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="max-w-xs mx-auto px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">nickel</h1>
      <LoginForm />
    </main>
  );
}
