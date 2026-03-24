import { getCurrentAppContext } from "@/lib/app-context";
import { SuperadminShell } from "@/components/superadmin/shell";
import { TenantShell } from "@/components/tenant/shell";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentAppContext();
  const isSuperadmin = Boolean(context.appUser?.isSuperadmin);

  if (isSuperadmin) {
    return (
      <SuperadminShell
        userLabel={context.authSession?.user.name ?? context.authSession?.user.email ?? "Admin"}
      >
        {children}
      </SuperadminShell>
    );
  }

  const membership = context.activeMembership;

  if (!membership || !context.authSession?.user) {
    return <main className="page-section"><div className="app-shell">{children}</div></main>;
  }

  return (
    <TenantShell
      tenantName={membership.tenantName}
      userLabel={context.authSession.user.name ?? context.authSession.user.email ?? "Usuario"}
      userEmail={context.authSession.user.email}
      role={membership.role}
    >
      {children}
    </TenantShell>
  );
}
