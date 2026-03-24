import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="page-section">
      <div className="app-shell section-stack">
        <nav className="subnav">
          <Link className="subnav-link" href="/dashboard">
            Resumen
          </Link>
          <Link className="subnav-link" href="/dashboard/publishers">
            Publicadores
          </Link>
          <Link className="subnav-link" href="/dashboard/reports">
            Informes mensuales
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
