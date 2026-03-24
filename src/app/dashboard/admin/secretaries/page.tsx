import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listSecretaryUsers } from "@/lib/admin/queries";
import { SecretaryManagement } from "@/app/dashboard/admin/secretaries/secretary-management";

export default async function AdminSecretariesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentAppContext();
  const resolvedSearchParams = (await searchParams) ?? {};
  const status =
    typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const message =
    typeof resolvedSearchParams.message === "string" ? resolvedSearchParams.message : null;

  if (!context.authSession?.user) {
    redirect("/auth/sign-in");
  }

  if (!context.appUser?.isSuperadmin) {
    redirect("/dashboard");
  }

  const secretaries = await listSecretaryUsers();

  return (
    <div className="section-stack">
      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <SecretaryManagement secretaries={secretaries} />
    </div>
  );
}
