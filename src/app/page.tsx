import Link from "next/link";

export default function Home() {
  return (
    <main className="page-section">
      <div className="app-shell page-grid">
        <section
          className="panel"
          style={{
            padding: "40px",
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "2fr 1fr",
          }}
        >
          <div style={{ display: "grid", gap: "20px" }}>
            <span className="status-chip">Base de proyecto inicial lista</span>
            <div style={{ display: "grid", gap: "12px", maxWidth: "760px" }}>
              <h1 style={{ fontSize: "clamp(2.8rem, 6vw, 5.3rem)", lineHeight: 1 }}>
                Informes mensuales por publicador, con historial real de estado.
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "1.08rem", lineHeight: 1.7 }}>
                Esta base ya contempla congregaciones multi-tenant, roles con restricciones
                por grupo, historial de tipo de publicador y un unico informe por mes y año.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link className="auth-button-fallback" href="/auth/sign-in">
                Ingresar con Neon Auth
              </Link>
              <Link className="pill-link" href="/dashboard">
                Ver dashboard base
              </Link>
            </div>
          </div>

          <aside
            style={{
              borderRadius: "24px",
              padding: "22px",
              background: "linear-gradient(180deg, rgba(143, 62, 22, 0.09), rgba(255, 250, 241, 0.75))",
              border: "1px solid rgba(143, 62, 22, 0.12)",
              display: "grid",
              gap: "16px",
              alignContent: "start",
            }}
          >
            <h2 style={{ fontSize: "1.2rem" }}>Reglas de negocio modeladas</h2>
            <div className="empty-state">
              `publicador` informa participacion, cursos y observaciones.
            </div>
            <div className="empty-state">
              `precursor auxiliar`, `regular` y `especial` incluyen horas y marcan
              participacion automaticamente.
            </div>
            <div className="empty-state">
              El tipo de publicador se define por vigencia, no solo por valor actual.
            </div>
          </aside>
        </section>

        <section
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {[
            {
              title: "Tenants y usuarios",
              body: "Superadmin administra congregaciones. Secretario administra usuarios del tenant.",
            },
            {
              title: "Grupos de predicacion",
              body: "Superintendentes y auxiliares solo cargan informes del grupo asignado.",
            },
            {
              title: "Historial mensual",
              body: "Cada informe guarda mes, año, grupo y estado efectivo del publicador en ese periodo.",
            },
            {
              title: "Consulta global",
              body: "Todos los usuarios del tenant pueden revisar historial y resumenes mensuales; anciano solo visualiza.",
            },
          ].map((card) => (
            <article
              className="panel"
              key={card.title}
              style={{ padding: "24px", display: "grid", gap: "10px" }}
            >
              <h2 style={{ fontSize: "1.25rem" }}>{card.title}</h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>{card.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
