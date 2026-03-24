import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth/session";

export default async function Home() {
  const { data: session } = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="login-shell">
      <LoginForm />
    </main>
  );
}
