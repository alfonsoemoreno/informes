import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamicParams = false;

type AuthPageProps = {
  params: Promise<{ path: string }>;
};

export default async function AuthPage({ params }: AuthPageProps) {
  const { path } = await params;
  const { data: session } = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  if (path !== "sign-in") {
    redirect("/");
  }

  return (
    <main className="login-shell">
      <LoginForm />
    </main>
  );
}
