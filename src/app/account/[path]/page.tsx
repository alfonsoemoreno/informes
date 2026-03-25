import { AccountView } from "@neondatabase/auth/react";
import { redirect } from "next/navigation";
import { SuperadminShell } from "@/components/superadmin/shell";
import { TenantShell } from "@/components/tenant/shell";
import { getCurrentAppContext } from "@/lib/app-context";

export const dynamicParams = false;

type AccountPageProps = {
  params: Promise<{ path: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { path } = await params;
  const context = await getCurrentAppContext();

  if (!context.authSession?.user) {
    redirect("/auth/sign-in");
  }

  const content = (
    <div className="account-settings-page">
      <section className="account-settings-hero">
        <span className="tenant-page-eyebrow">Cuenta</span>
        <h1>Configuracion del usuario</h1>
        <p>
          Gestiona los datos de autenticacion del usuario con Neon Auth. Los permisos
          funcionales del sistema siguen viviendo en las tablas del tenant.
        </p>
      </section>

      <section className="account-settings-surface">
        <AccountView path={path} />
      </section>
    </div>
  );

  if (context.appUser?.isSuperadmin) {
    return (
      <SuperadminShell
        userLabel={context.authSession.user.name ?? context.authSession.user.email ?? "Admin"}
      >
        {content}
      </SuperadminShell>
    );
  }

  if (context.activeMembership) {
    return (
      <TenantShell
        tenantName={context.activeMembership.tenantName}
        userLabel={context.authSession.user.name ?? context.authSession.user.email ?? "Usuario"}
        userEmail={context.authSession.user.email}
        role={context.activeMembership.role}
      >
        {content}
      </TenantShell>
    );
  }

  return (
    <main className="page-section">
      <div className="app-shell">
        {content}
      </div>
    </main>
  );
}
