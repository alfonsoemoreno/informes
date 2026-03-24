import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { monthlyReports, publishers, preachingGroups } from "@/lib/db/schema";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import { canManagePublishers, canSubmitReports } from "@/lib/domain/permissions";
import { publisherStatuses } from "@/lib/domain/reporting";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getCurrentAppContext();

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
        <h1>Usuario autenticado sin congregacion activa</h1>
        <p className="hint">
          El usuario ya existe en Neon Auth y en `app_users`, pero todavia no tiene una
          fila activa en `tenant_users`.
        </p>
      </section>
    );
  }

  const db = getDb();

  const [publisherCountResult, groupCountResult, reportCountResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(publishers)
      .where(eq(publishers.tenantId, membership.tenantId)),
    db
      .select({ value: count() })
      .from(preachingGroups)
      .where(eq(preachingGroups.tenantId, membership.tenantId)),
    db
      .select({ value: count() })
      .from(monthlyReports)
      .where(eq(monthlyReports.tenantId, membership.tenantId)),
  ]);

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "32px", display: "grid", gap: "18px" }}>
        <span className="eyebrow">Dashboard</span>
        <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.8rem)" }}>
          {membership.tenantName}
        </h1>
        <p className="hint">
          Usuario: {context.authSession.user.name ?? context.authSession.user.email}. Rol
          activo: {getRoleLabel(membership.role)}.
          {membership.groupName ? ` Grupo asociado: ${membership.groupName}.` : ""}
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="eyebrow">Publicadores</span>
          <strong>{publisherCountResult[0]?.value ?? 0}</strong>
          <span className="hint">
            {canManagePublishers(membership.role)
              ? "Puedes administrarlos desde el mantenedor."
              : "Disponibles en modo consulta."}
          </span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Grupos</span>
          <strong>{groupCountResult[0]?.value ?? 0}</strong>
          <span className="hint">Grupos de predicacion activos del tenant.</span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Informes</span>
          <strong>{reportCountResult[0]?.value ?? 0}</strong>
          <span className="hint">
            {canSubmitReports(membership.role)
              ? "Puedes registrar nuevos informes mensuales."
              : "Tu rol solo revisa historial y resumenes."}
          </span>
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "1.2fr 1fr",
        }}
      >
        <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Capacidades del rol</h2>
          <div className="empty-state">
            {canManagePublishers(membership.role)
              ? "Este rol puede administrar el mantenedor de publicadores."
              : "Este rol no puede modificar publicadores."}
          </div>
          <div className="empty-state">
            {canSubmitReports(membership.role)
              ? "Este rol puede cargar informes mensuales."
              : "Este rol tiene acceso de solo lectura a informes."}
          </div>
        </article>

        <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Tipos soportados</h2>
          {publisherStatuses.map((status) => (
            <div className="empty-state" key={status}>
              {getPublisherStatusLabel(status)}
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
