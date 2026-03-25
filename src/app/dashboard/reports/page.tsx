import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AssignmentIcon,
  GroupUsersIcon,
  ReportsIcon,
} from "@/components/superadmin/icons";
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

  const canSubmit = canSubmitReports(membership.role);

  return (
    <div className="reports-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Informes</span>
          <h1>Informes mensuales</h1>
          <p>
            Rol activo: {getRoleLabel(membership.role)}. Los precursores marcan participacion
            automaticamente y exigen horas; los publicadores solo informan participacion,
            cursos y observaciones.
          </p>
        </div>

        <div className="tenant-page-header-actions">
          <div className="tenant-stat-card">
            <div className="tenant-stat-icon">
              <ReportsIcon className="tenant-stat-icon-svg" />
            </div>
            <div>
              <p className="tenant-stat-value">{summary.totals.totalReports}</p>
              <p className="tenant-stat-label">Informes del periodo</p>
            </div>
          </div>

          <Link
            className="tenant-inline-link-button reports-current-link"
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

      <section className="reports-period-card">
        <div>
          <span className="tenant-page-eyebrow">Periodo activo</span>
          <h2>{formatMonthYear(selectedYear, selectedMonth)}</h2>
        </div>

        <form method="get" className="reports-period-form">
          <div className="field">
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
          <div className="field">
            <label htmlFor="yearFilter">Anio</label>
            <input id="yearFilter" name="year" type="number" defaultValue={selectedYear} />
          </div>
          <button className="tenant-inline-link-button" type="submit">
            Ver resumen
          </button>
        </form>
      </section>

      <section className="tenant-publisher-stats-grid">
        <article className="tenant-publisher-stat">
          <span>Informes</span>
          <strong>{summary.totals.totalReports}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Participaron</span>
          <strong>{summary.totals.totalParticipated}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Horas</span>
          <strong>{summary.totals.totalHours}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Cursos</span>
          <strong>{summary.totals.totalBibleStudies}</strong>
        </article>
      </section>

      <section className="reports-summary-grid">
        <article className="publisher-detail-table-card">
          <div className="publisher-detail-table-header">
            <GroupUsersIcon className="publisher-detail-table-icon" />
            <div>
              <h2>Resumen por grupo</h2>
              <p>{summary.byGroup.length} grupos</p>
            </div>
          </div>

          {summary.byGroup.length === 0 ? (
            <div className="empty-state">No hay informes para este periodo.</div>
          ) : (
            <div className="tenant-users-table-wrap">
              <table className="tenant-users-table">
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
            </div>
          )}
        </article>

        <article className="publisher-detail-table-card">
          <div className="publisher-detail-table-header">
            <AssignmentIcon className="publisher-detail-table-icon" />
            <div>
              <h2>Resumen por tipo</h2>
              <p>{summary.byStatus.length} tipos</p>
            </div>
          </div>

          {summary.byStatus.length === 0 ? (
            <div className="empty-state">No hay informes para este periodo.</div>
          ) : (
            <div className="tenant-users-table-wrap">
              <table className="tenant-users-table">
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
            </div>
          )}
        </article>
      </section>

      {canSubmit ? (
        <section className="publisher-detail-form-card reports-form-card">
          <div className="publisher-detail-form-header">
            <ReportsIcon className="publisher-detail-side-icon" />
            <h2>Cargar informe</h2>
          </div>

          <form action={createMonthlyReportAction} className="reports-form">
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

            <div className="reports-form-grid">
              <div className="field">
                <label htmlFor="reportMonth">Mes</label>
                <input
                  id="reportMonth"
                  name="reportMonth"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue={selectedMonth}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="reportYear">Anio</label>
                <input
                  id="reportYear"
                  name="reportYear"
                  type="number"
                  defaultValue={selectedYear}
                  required
                />
              </div>
            </div>

            <div className="reports-form-grid">
              <div className="field">
                <label htmlFor="preachingHours">Horas</label>
                <input id="preachingHours" name="preachingHours" type="number" min="0" step="0.25" />
              </div>
              <div className="field">
                <label htmlFor="bibleStudies">Cursos biblicos</label>
                <input
                  id="bibleStudies"
                  name="bibleStudies"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
              </div>
            </div>

            <label className="reports-checkbox">
              <input id="participated" name="participated" type="checkbox" />
              <span>Participo este mes en alguna actividad de predicacion</span>
            </label>

            <div className="field">
              <label htmlFor="notes">Observaciones</label>
              <textarea id="notes" name="notes" rows={3} />
            </div>

            <button className="publisher-detail-primary-button" type="submit">
              Guardar informe
            </button>
          </form>
        </section>
      ) : (
        <section className="publisher-detail-table-card">
          <div className="empty-state">
            Tu rol es de solo lectura. Puedes revisar historial y resumenes, pero no subir informes.
          </div>
        </section>
      )}

      <section className="publisher-detail-table-card">
        <div className="publisher-detail-table-header">
          <ReportsIcon className="publisher-detail-table-icon" />
          <div>
            <h2>Historial reciente</h2>
            <p>{recentReports.length} informes recientes</p>
          </div>
        </div>

        {recentReports.length === 0 ? (
          <div className="empty-state">Todavia no hay informes registrados en este tenant.</div>
        ) : (
          <div className="tenant-users-table-wrap">
            <table className="tenant-users-table">
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
          </div>
        )}
      </section>
    </div>
  );
}
