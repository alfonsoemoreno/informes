import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import {
  AssignmentIcon,
  BookIcon,
  DashboardIcon,
  GroupUsersIcon,
  HubIcon,
  ReportsIcon,
} from "@/components/superadmin/icons";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { monthlyReports, preachingGroups, publishers } from "@/lib/db/schema";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import {
  formatMonthYear,
  formatTheocraticYearLabel,
  getCurrentTheocraticYear,
} from "@/lib/domain/periods";
import { publisherStatuses, statusRequiresHours } from "@/lib/domain/reporting";
import {
  getMonthlySummary,
  getTheocraticYearSummary,
  listRecentReports,
  listTenantPublishers,
  resolvePublisherStateForMonth,
} from "@/lib/reporting/queries";

export const dynamic = "force-dynamic";

function getCurrentPeriod() {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
}

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
      <section className="dashboard-surface-card">
        <div className="dashboard-surface-heading">
          <div>
            <span className="tenant-page-eyebrow">Sin asignacion</span>
            <h2>Usuario autenticado sin congregacion activa</h2>
          </div>
        </div>
        <p className="dashboard-surface-copy">
          El usuario ya existe en Neon Auth y en <code>app_users</code>, pero todavia no
          tiene una fila activa en <code>tenant_users</code>.
        </p>
      </section>
    );
  }

  const db = getDb();
  const currentPeriod = getCurrentPeriod();
  const currentTheocraticYear = getCurrentTheocraticYear();

  const [
    publisherCountResult,
    groupCountResult,
    reportCountResult,
    monthSummary,
    theocraticYearSummary,
    recentReports,
    tenantPublisherRows,
  ] =
    await Promise.all([
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
    getMonthlySummary({
      tenantId: membership.tenantId,
      year: currentPeriod.year,
      month: currentPeriod.month,
    }),
    getTheocraticYearSummary({
      tenantId: membership.tenantId,
      theocraticYear: currentTheocraticYear,
    }),
    listRecentReports(membership.tenantId),
    listTenantPublishers(membership.tenantId),
  ]);

  const currentRosterStates = (
    await Promise.all(
      tenantPublisherRows.map((publisher) =>
        resolvePublisherStateForMonth({
          tenantId: membership.tenantId,
          publisherId: publisher.id,
          year: currentPeriod.year,
          month: currentPeriod.month,
        }),
      ),
    )
  ).filter((value): value is NonNullable<typeof value> => value !== null);

  const publisherCount = publisherCountResult[0]?.value ?? 0;
  const groupCount = groupCountResult[0]?.value ?? 0;
  const reportCount = reportCountResult[0]?.value ?? 0;
  const activeRosterCount = currentRosterStates.length;
  const rosterByStatus = Object.fromEntries(
    publisherStatuses.map((status) => [
      status,
      currentRosterStates.filter((item) => item.status === status).length,
    ]),
  ) as Record<(typeof publisherStatuses)[number], number>;
  const currentReports = monthSummary.totals.totalReports;
  const coverageRate = activeRosterCount > 0 ? (currentReports / activeRosterCount) * 100 : 0;
  const participationRate =
    currentReports > 0 ? (monthSummary.totals.totalParticipated / currentReports) * 100 : 0;
  const averageBibleStudies =
    currentReports > 0 ? monthSummary.totals.totalBibleStudies / currentReports : 0;

  const pioneerRows = monthSummary.byStatus.filter((row) => row.publisherStatus !== "publisher");
  const pioneerReports = pioneerRows.reduce((sum, row) => sum + row.totalReports, 0);
  const pioneerHours = pioneerRows.reduce((sum, row) => sum + row.totalHours, 0);
  const pioneerAverageHours = pioneerReports > 0 ? pioneerHours / pioneerReports : 0;
  const theocraticPioneerRows = theocraticYearSummary.byStatus.filter(
    (row) => row.publisherStatus !== "publisher",
  );
  const theocraticPioneerReports = theocraticPioneerRows.reduce(
    (sum, row) => sum + row.totalReports,
    0,
  );
  const theocraticPioneerHours = theocraticPioneerRows.reduce(
    (sum, row) => sum + row.totalHours,
    0,
  );
  const theocraticPioneerAverageHours =
    theocraticPioneerReports > 0 ? theocraticPioneerHours / theocraticPioneerReports : 0;
  const theocraticAverageBibleStudies =
    theocraticYearSummary.totals.totalReports > 0
      ? theocraticYearSummary.totals.totalBibleStudies /
        theocraticYearSummary.totals.totalReports
      : 0;

  const groupCoverage = monthSummary.byGroup
    .map((group) => ({
      ...group,
      coverage: activeRosterCount > 0 ? (group.totalReports / activeRosterCount) * 100 : 0,
    }))
    .sort((left, right) => right.totalReports - left.totalReports)
    .slice(0, 4);

  return (
    <div className="dashboard-summary-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Resumen</span>
          <h1>{membership.tenantName}</h1>
          <p>
            Usuario activo: {context.authSession.user.name ?? context.authSession.user.email}.
            Rol asignado: {getRoleLabel(membership.role)}.
            {membership.groupName ? ` Grupo asociado: ${membership.groupName}.` : ""}
          </p>
        </div>

        <div className="tenant-page-header-actions">
          <div className="tenant-stat-card">
            <div className="tenant-stat-icon">
              <DashboardIcon className="tenant-stat-icon-svg" />
            </div>
            <div>
              <p className="tenant-stat-value">{formatMonthYear(currentPeriod.year, currentPeriod.month)}</p>
              <p className="tenant-stat-label">Periodo analizado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-summary-grid">
        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card-icon">
            <BookIcon className="dashboard-summary-card-icon-svg" />
          </div>
          <div>
            <span>Cobertura</span>
            <strong>{coverageRate.toFixed(0)}%</strong>
            <p>
              {currentReports} informes del mes sobre {activeRosterCount} publicadores con estado
              vigente.
            </p>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card-icon">
            <HubIcon className="dashboard-summary-card-icon-svg" />
          </div>
          <div>
            <span>Participacion</span>
            <strong>{participationRate.toFixed(0)}%</strong>
            <p>{monthSummary.totals.totalParticipated} informes marcaron actividad de predicacion.</p>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card-icon">
            <ReportsIcon className="dashboard-summary-card-icon-svg" />
          </div>
          <div>
            <span>Promedio pioneros</span>
            <strong>{pioneerAverageHours.toFixed(1)} h</strong>
            <p>
              Promedio de horas entre auxiliares, regulares y especiales que reportaron este mes.
            </p>
          </div>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card-icon">
            <DashboardIcon className="dashboard-summary-card-icon-svg" />
          </div>
          <div>
            <span>Cursos por informe</span>
            <strong>{averageBibleStudies.toFixed(1)}</strong>
            <p>
              {monthSummary.totals.totalBibleStudies} cursos registrados en {currentReports} informes.
            </p>
          </div>
        </article>
      </section>

      <section className="dashboard-summary-layout">
        <article className="dashboard-surface-card">
          <div className="dashboard-surface-heading">
            <div>
              <span className="tenant-page-eyebrow">Analitica ministerial</span>
              <h2>Promedios por tipo de publicador</h2>
            </div>
            <Link className="tenant-inline-link-button" href="/dashboard/reports">
              Ver informes
            </Link>
          </div>

          <div className="tenant-users-table-wrap">
            <table className="tenant-users-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Padron</th>
                  <th>Informes</th>
                  <th>Cobertura</th>
                  <th>Prom. horas</th>
                  <th>Prom. cursos</th>
                </tr>
              </thead>
              <tbody>
                {publisherStatuses.map((status) => {
                  const row =
                    monthSummary.byStatus.find((item) => item.publisherStatus === status) ?? null;
                  const rosterCount = rosterByStatus[status] ?? 0;
                  const coverage = rosterCount > 0 ? ((row?.totalReports ?? 0) / rosterCount) * 100 : 0;
                  const averageHours =
                    row && row.totalReports > 0 ? row.totalHours / row.totalReports : 0;
                  const averageStudies =
                    row && row.totalReports > 0 ? row.totalBibleStudies / row.totalReports : 0;

                  return (
                    <tr key={status}>
                      <td>{getPublisherStatusLabel(status)}</td>
                      <td>{rosterCount}</td>
                      <td>{row?.totalReports ?? 0}</td>
                      <td>{coverage.toFixed(0)}%</td>
                      <td>{statusRequiresHours(status) ? `${averageHours.toFixed(1)} h` : "N/A"}</td>
                      <td>{averageStudies.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <div className="dashboard-side-stack">
          <article className="dashboard-surface-card">
            <div className="dashboard-surface-heading">
              <div>
                <span className="tenant-page-eyebrow">Año teocrático</span>
                <h2>{formatTheocraticYearLabel(currentTheocraticYear)}</h2>
              </div>
            </div>

            <div className="dashboard-capabilities">
              <div className="dashboard-capability-item">
                <strong>Informes acumulados</strong>
                <p>
                  {theocraticYearSummary.totals.totalReports} informes registrados entre
                  septiembre y agosto.
                </p>
              </div>

              <div className="dashboard-capability-item">
                <strong>Horas acumuladas</strong>
                <p>
                  {theocraticYearSummary.totals.totalHours.toFixed(1)} horas registradas en el
                  año teocrático.
                </p>
              </div>

              <div className="dashboard-capability-item">
                <strong>Promedio de horas de precursores</strong>
                <p>
                  {theocraticPioneerAverageHours.toFixed(1)} horas promedio entre auxiliares,
                  regulares y especiales.
                </p>
              </div>

              <div className="dashboard-capability-item">
                <strong>Promedio de cursos por informe</strong>
                <p>
                  {theocraticAverageBibleStudies.toFixed(1)} cursos por informe en el acumulado
                  anual.
                </p>
              </div>
            </div>
          </article>

          <article className="dashboard-surface-card">
            <div className="dashboard-surface-heading">
              <div>
                <span className="tenant-page-eyebrow">Grupos</span>
                <h2>Grupos con mayor actividad</h2>
              </div>
            </div>

            <div className="dashboard-status-list">
              {groupCoverage.length === 0 ? (
                <div className="dashboard-status-item">Todavia no hay informes en este periodo.</div>
              ) : (
                groupCoverage.map((group) => (
                  <div className="dashboard-status-item" key={group.groupId}>
                    <strong>{group.groupName}</strong>
                    <span>
                      {group.totalReports} informes · {group.totalHours.toFixed(1)} horas ·{" "}
                      {group.totalBibleStudies} cursos
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-surface-card dashboard-summary-footnote">
        <span className="tenant-page-eyebrow">Base congregacional</span>
        <p className="dashboard-surface-copy">
          Totales estructurales de la congregacion y contexto operativo del usuario actual.
        </p>
        <div className="tenant-users-summary-strip">
          <span>{publisherCount} publicadores</span>
          <span>{groupCount} grupos</span>
          <span>{reportCount} informes historicos</span>
          <span>{activeRosterCount} activos este mes</span>
          <span>{getRoleLabel(membership.role)}</span>
        </div>
      </section>

      <section className="reports-summary-grid">
        <article className="publisher-detail-table-card">
          <div className="publisher-detail-table-header">
            <GroupUsersIcon className="publisher-detail-table-icon" />
            <div>
              <h2>Resumen por grupo</h2>
              <p>{monthSummary.byGroup.length} grupos</p>
            </div>
          </div>

          {monthSummary.byGroup.length === 0 ? (
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
                  {monthSummary.byGroup.map((group) => (
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
              <p>{monthSummary.byStatus.length} tipos</p>
            </div>
          </div>

          {monthSummary.byStatus.length === 0 ? (
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
                  {monthSummary.byStatus.map((item) => (
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
                      Participó: {report.participated ? "Sí" : "No"} · Horas:{" "}
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
