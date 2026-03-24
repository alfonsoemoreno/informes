import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAppContext } from "@/lib/app-context";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import {
  canSubmitReports,
  canViewCongregationReports,
} from "@/lib/domain/permissions";
import { formatMonthYear } from "@/lib/domain/periods";
import {
  getMonthlySummary,
  listAccessiblePublishersForReports,
  listRecentReports,
} from "@/lib/reporting/queries";
import { createMonthlyReportAction } from "@/app/dashboard/reports/actions";

function getCurrentPeriod() {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
}

export default async function ReportsPage({
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
  const currentPeriod = getCurrentPeriod();
  const selectedMonth =
    typeof resolvedSearchParams.month === "string"
      ? Number(resolvedSearchParams.month)
      : currentPeriod.month;
  const selectedYear =
    typeof resolvedSearchParams.year === "string"
      ? Number(resolvedSearchParams.year)
      : currentPeriod.year;

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
        <p className="hint">
          El usuario autenticado todavia no tiene una asignacion activa dentro de una congregacion.
        </p>
      </section>
    );
  }

  if (!canViewCongregationReports(membership.role)) {
    return (
      <section className="panel" style={{ padding: "28px" }}>
        <div className="empty-state">Tu rol no puede acceder a los informes.</div>
      </section>
    );
  }

  const [accessiblePublishers, recentReports, summary] = await Promise.all([
    listAccessiblePublishersForReports({
      tenantId: membership.tenantId,
      role: membership.role,
      groupId: membership.groupId,
      year: selectedYear,
      month: selectedMonth,
    }),
    listRecentReports(membership.tenantId),
    getMonthlySummary({
      tenantId: membership.tenantId,
      year: selectedYear,
      month: selectedMonth,
    }),
  ]);

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <span className="eyebrow">Informes</span>
        <h1>Informes mensuales</h1>
        <p className="hint">
          Rol activo: {getRoleLabel(membership.role)}. Los precursores marcan
          participacion automaticamente y exigen horas; los publicadores solo informan
          participacion, cursos y observaciones.
        </p>
        <div className="action-row">
          <span className="status-chip">
            Resumen de {formatMonthYear(selectedYear, selectedMonth)}
          </span>
          <Link
            className="secondary-button"
            href={`/dashboard/reports?month=${currentPeriod.month}&year=${currentPeriod.year}`}
          >
            Ir al mes actual
          </Link>
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <h2>Resumen mensual</h2>
          <form method="get" className="action-row">
            <div className="field" style={{ minWidth: "110px" }}>
              <label htmlFor="monthFilter">Mes</label>
              <input
                id="monthFilter"
                name="month"
                type="number"
                min="1"
                max="12"
                defaultValue={selectedMonth}
              />
            </div>
            <div className="field" style={{ minWidth: "130px" }}>
              <label htmlFor="yearFilter">Anio</label>
              <input id="yearFilter" name="year" type="number" defaultValue={selectedYear} />
            </div>
            <button className="secondary-button" type="submit">
              Ver resumen
            </button>
          </form>
        </div>

        <div className="metrics-grid">
          <article className="metric-card">
            <span className="eyebrow">Informes</span>
            <strong>{summary.totals.totalReports}</strong>
            <span className="hint">Informes cargados en el período.</span>
          </article>
          <article className="metric-card">
            <span className="eyebrow">Participaron</span>
            <strong>{summary.totals.totalParticipated}</strong>
            <span className="hint">Publicadores que marcaron participación.</span>
          </article>
          <article className="metric-card">
            <span className="eyebrow">Horas</span>
            <strong>{summary.totals.totalHours}</strong>
            <span className="hint">Suma de horas reportadas por precursores.</span>
          </article>
          <article className="metric-card">
            <span className="eyebrow">Cursos</span>
            <strong>{summary.totals.totalBibleStudies}</strong>
            <span className="hint">Cursos bíblicos conducidos en el mes.</span>
          </article>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <article className="panel" style={{ padding: "28px" }}>
          <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
            <h2>Resumen por grupo</h2>
            <span className="hint">{summary.byGroup.length} grupos</span>
          </div>
          {summary.byGroup.length === 0 ? (
            <div className="empty-state">No hay informes para este período.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Informes</th>
                  <th>Participaron</th>
                  <th>Horas</th>
                  <th>Cursos</th>
                </tr>
              </thead>
              <tbody>
                {summary.byGroup.map((group) => (
                  <tr key={group.groupId}>
                    <td>{group.groupName}</td>
                    <td>{group.totalReports}</td>
                    <td>{group.totalParticipated}</td>
                    <td>{group.totalHours}</td>
                    <td>{group.totalBibleStudies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="panel" style={{ padding: "28px" }}>
          <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
            <h2>Resumen por tipo</h2>
            <span className="hint">{summary.byStatus.length} tipos</span>
          </div>
          {summary.byStatus.length === 0 ? (
            <div className="empty-state">No hay informes para este período.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Informes</th>
                  <th>Participaron</th>
                  <th>Horas</th>
                  <th>Cursos</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStatus.map((item) => (
                  <tr key={item.publisherStatus}>
                    <td>{getPublisherStatusLabel(item.publisherStatus)}</td>
                    <td>{item.totalReports}</td>
                    <td>{item.totalParticipated}</td>
                    <td>{item.totalHours}</td>
                    <td>{item.totalBibleStudies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>

      {canSubmitReports(membership.role) ? (
        <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2>Cargar informe</h2>
          <form action={createMonthlyReportAction} className="form-grid">
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="publisherId">Publicador</label>
                <select id="publisherId" name="publisherId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un publicador
                  </option>
                  {accessiblePublishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.fullName} · {publisher.groupName} · {getPublisherStatusLabel(publisher.status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid two-columns">
                <div className="field">
                  <label htmlFor="reportMonth">Mes</label>
                  <input id="reportMonth" name="reportMonth" type="number" min="1" max="12" defaultValue={selectedMonth} required />
                </div>
                <div className="field">
                  <label htmlFor="reportYear">Anio</label>
                  <input id="reportYear" name="reportYear" type="number" defaultValue={selectedYear} required />
                </div>
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="preachingHours">Horas</label>
                <input id="preachingHours" name="preachingHours" type="number" min="0" step="0.25" />
              </div>
              <div className="field">
                <label htmlFor="bibleStudies">Cursos biblicos</label>
                <input id="bibleStudies" name="bibleStudies" type="number" min="0" defaultValue="0" required />
              </div>
            </div>

            <div className="checkbox-field">
              <input id="participated" name="participated" type="checkbox" />
              <label htmlFor="participated">
                Participo este mes en alguna actividad de predicacion
              </label>
            </div>

            <div className="field">
              <label htmlFor="notes">Observaciones</label>
              <textarea id="notes" name="notes" />
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                Guardar informe
              </button>
              <span className="hint">
                Los permisos se validan al guardar. Si eres superintendente o auxiliar de
                grupo, solo se aceptan publicadores de tu grupo.
              </span>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel" style={{ padding: "24px" }}>
          <div className="empty-state">
            Tu rol es de solo lectura. Puedes revisar historial y resumenes, pero no subir informes.
          </div>
        </section>
      )}

      <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <h2>Historial reciente</h2>
          <span className="hint">{recentReports.length} informes recientes</span>
        </div>

        {recentReports.length === 0 ? (
          <div className="empty-state">Todavia no hay informes registrados en este tenant.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Publicador</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id}>
                  <td>{formatMonthYear(report.reportYear, report.reportMonth)}</td>
                  <td>{report.publisherName}</td>
                  <td>{report.groupName}</td>
                  <td>{getPublisherStatusLabel(report.publisherStatus)}</td>
                  <td>
                    Participo: {report.participated ? "Si" : "No"} · Horas:{" "}
                    {report.preachingHours ?? "-"} · Cursos: {report.bibleStudies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
