import Link from "next/link";
import { getCurrentAppContext } from "@/lib/app-context";
import { SuperadminShell } from "@/components/superadmin/shell";

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

  return (
    <main className="page-section">
      <div className="app-shell section-stack">
        <nav className="subnav">
          <>
            <Link className="subnav-link" href="/dashboard">
              Resumen
            </Link>
            <Link className="subnav-link" href="/dashboard/users">
              Usuarios
            </Link>
            <Link className="subnav-link" href="/dashboard/groups">
              Grupos
            </Link>
            <Link className="subnav-link" href="/dashboard/publishers">
              Publicadores
            </Link>
            <Link className="subnav-link" href="/dashboard/reports">
              Informes mensuales
            </Link>
          </>
        </nav>
        {children}
      </div>
    </main>
  );
}
