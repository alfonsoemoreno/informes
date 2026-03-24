import { AuthView } from "@neondatabase/auth/react";

export const dynamicParams = false;

type AuthPageProps = {
  params: Promise<{ path: string }>;
};

export default async function AuthPage({ params }: AuthPageProps) {
  const { path } = await params;

  return (
    <main className="page-section">
      <div className="app-shell">
        <section className="panel auth-card">
          <div className="auth-card-header">
            <span className="eyebrow">Neon Auth</span>
            <h1>Acceso a la congregacion</h1>
            <p>
              El login y el alta de usuarios se apoyan en Neon Auth. Luego, cada
              usuario se asocia al tenant y a un unico rol dentro de la congregacion.
            </p>
          </div>
          <AuthView path={path} />
        </section>
      </div>
    </main>
  );
}
