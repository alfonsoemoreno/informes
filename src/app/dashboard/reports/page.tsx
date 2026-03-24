import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import {
  canSubmitReports,
  canViewCongregationReports,
} from "@/lib/domain/permissions";
import { formatMonthYear } from "@/lib/domain/periods";
import { listAccessiblePublishersForReports, listRecentReports } from "@/lib/reporting/queries";
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

  if (!context.authSession?.user) {
    redirect("/auth/sign-in");
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

  const period = getCurrentPeriod();
  const [accessiblePublishers, recentReports] = await Promise.all([
    listAccessiblePublishersForReports({
      tenantId: membership.tenantId,
      role: membership.role,
      groupId: membership.groupId,
      year: period.year,
      month: period.month,
    }),
    listRecentReports(membership.tenantId),
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
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

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
                  <input id="reportMonth" name="reportMonth" type="number" min="1" max="12" defaultValue={period.month} required />
                </div>
                <div className="field">
                  <label htmlFor="reportYear">Anio</label>
                  <input id="reportYear" name="reportYear" type="number" defaultValue={period.year} required />
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
