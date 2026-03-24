import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import {
  publisherStatuses,
  statusAutoMarksParticipation,
  statusRequiresHours,
  tenantRoles,
} from "@/lib/domain/reporting";

export const dynamic = "force-dynamic";

const roleDescriptions: Record<(typeof tenantRoles)[number], string> = {
  secretary:
    "Administra usuarios del tenant y puede cargar informes de cualquier grupo.",
  elder:
    "Solo consulta historicos y resumenes mensuales de toda la congregacion.",
  group_overseer:
    "Carga informes unicamente para publicadores asignados a su grupo.",
  group_assistant:
    "Carga informes unicamente para publicadores asignados a su grupo.",
};

export default async function DashboardPage() {
  const { data: session } = await getCurrentSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="page-section">
      <div className="app-shell page-grid">
        <section className="panel" style={{ padding: "32px", display: "grid", gap: "18px" }}>
          <span className="eyebrow">Dashboard</span>
          <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.8rem)" }}>
            Bienvenido, {session.user.name ?? session.user.email}
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "760px", lineHeight: 1.7 }}>
            Esta pagina es la base autenticada del sistema. El siguiente paso es
            conectar consultas reales a Neon para listar tenants, publicadores,
            grupos de predicacion e informes mensuales.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "1.2fr 1fr",
          }}
        >
          <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
            <h2 style={{ fontSize: "1.4rem" }}>Roles del tenant</h2>
            {tenantRoles.map((role) => (
              <div className="empty-state" key={role}>
                <strong style={{ display: "block", marginBottom: "8px", textTransform: "capitalize" }}>
                  {role.replaceAll("_", " ")}
                </strong>
                <span>{roleDescriptions[role]}</span>
              </div>
            ))}
          </article>

          <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
            <h2 style={{ fontSize: "1.4rem" }}>Reglas por tipo de publicador</h2>
            {publisherStatuses.map((status) => (
              <div className="empty-state" key={status}>
                <strong style={{ display: "block", marginBottom: "8px", textTransform: "capitalize" }}>
                  {status.replaceAll("_", " ")}
                </strong>
                <span>
                  Horas: {statusRequiresHours(status) ? "si" : "no"}.
                  Participacion automatica:{" "}
                  {statusAutoMarksParticipation(status) ? "si" : "no"}.
                </span>
              </div>
            ))}
          </article>
        </section>
      </div>
    </main>
  );
}
