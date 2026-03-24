import { AccountView } from "@neondatabase/auth/react";

export const dynamicParams = false;

type AccountPageProps = {
  params: Promise<{ path: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { path } = await params;

  return (
    <main className="page-section">
      <div className="app-shell">
        <section className="panel auth-card">
          <div className="auth-card-header">
            <span className="eyebrow">Cuenta</span>
            <h1>Configuracion del usuario</h1>
            <p>
              Esta vista gestiona los datos de autenticacion del usuario. Los permisos
              funcionales del sistema viven en las tablas del tenant.
            </p>
          </div>
          <AccountView path={path} />
        </section>
      </div>
    </main>
  );
}
