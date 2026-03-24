import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listTenantUsers } from "@/lib/admin/queries";
import { listTenantGroups } from "@/lib/reporting/queries";
import { canManageTenantUsers } from "@/lib/domain/permissions";
import { UserManagement } from "@/app/dashboard/users/user-management";

export default async function TenantUsersPage({
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

  if (context.appUser?.isSuperadmin) {
    redirect("/dashboard/admin/tenants");
  }

  const membership = context.activeMembership;

  if (!membership) {
    return (
      <section className="panel" style={{ padding: "28px" }}>
        <h1>Sin tenant asignado</h1>
        <p className="hint">Debes estar asignado a una congregacion para administrar usuarios.</p>
      </section>
    );
  }

  const [groups, users] = await Promise.all([
    listTenantGroups(membership.tenantId),
    listTenantUsers(membership.tenantId),
  ]);

  return (
    <UserManagement
      tenantName={membership.tenantName}
      users={users}
      groups={groups}
      canManage={canManageTenantUsers(membership.role)}
      status={status}
      message={message}
    />
  );
}
