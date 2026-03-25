import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ApartmentIcon,
  AssignmentIcon,
  BadgeIcon,
  BookIcon,
  GroupUsersIcon,
  ReportsIcon,
} from "@/components/superadmin/icons";
import { getCurrentAppContext } from "@/lib/app-context";
import {
  getPublisherReportingStateLabel,
  getPublisherStatusLabel,
} from "@/lib/domain/labels";
import { formatMonthYear } from "@/lib/domain/periods";
import { canManagePublishers } from "@/lib/domain/permissions";
import { publisherStatuses } from "@/lib/domain/reporting";
import {
  getPublisherDetails,
  getPublisherReportingStates,
  listTenantGroups,
} from "@/lib/reporting/queries";
import {
  addPublisherGroupAssignmentAction,
  addPublisherStatusAssignmentAction,
} from "@/app/dashboard/publishers/actions";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Actual";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCurrentPeriod() {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
}

export default async function PublisherDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ publisherId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { publisherId } = await params;
  const context = await getCurrentAppContext();
  const resolvedSearchParams = (await searchParams) ?? {};
  const status =
    typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const message =
    typeof resolvedSearchParams.message === "string" ? resolvedSearchParams.message : null;

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
        <p className="hint">Debes pertenecer a una congregacion para ver publicadores.</p>
      </section>
    );
  }

  const currentPeriod = getCurrentPeriod();

  const [groups, details, reportingStates] = await Promise.all([
    listTenantGroups(membership.tenantId),
    getPublisherDetails({
      tenantId: membership.tenantId,
      publisherId,
    }),
    getPublisherReportingStates({
      tenantId: membership.tenantId,
      currentYear: currentPeriod.year,
      currentMonth: currentPeriod.month,
      publisherIds: [publisherId],
    }),
  ]);

  if (!details) {
    notFound();
  }

  const currentGroup = details.groupHistory[0] ?? null;
  const currentStatus = details.statusHistory[0] ?? null;
  const canManage = canManagePublishers(membership.role);
  const reportingState = reportingStates.get(details.publisher.id) ?? "up_to_date";

  return (
    <div className="publisher-detail-page">
      <section className="publisher-detail-hero">
        <div className="publisher-detail-hero-main">
          <div className="publisher-detail-breadcrumb">
            <span>Publicadores</span>
            <span>/</span>
            <span>Detalle</span>
          </div>

          <div className="publisher-detail-identity">
            <div className="publisher-detail-avatar">{getInitials(details.publisher.fullName)}</div>
            <div className="publisher-detail-identity-copy">
              <h1>{details.publisher.fullName}</h1>
              <p>
                Codigo {details.publisher.publisherCode ?? "Sin codigo"} ·{" "}
                {currentStatus
                  ? getPublisherStatusLabel(currentStatus.status)
                  : "Sin estado vigente"}
              </p>
              <div className={`publisher-reporting-chip tone-${reportingState} publisher-detail-reporting-chip`}>
                {getPublisherReportingStateLabel(reportingState)}
              </div>
            </div>
          </div>

          <div className="publisher-detail-summary-grid">
            <article className="publisher-detail-summary-card">
              <span>Grupo actual</span>
              <strong>{currentGroup?.groupName ?? "Sin grupo"}</strong>
            </article>
            <article className="publisher-detail-summary-card">
              <span>Tipo vigente</span>
              <strong>
                {currentStatus
                  ? getPublisherStatusLabel(currentStatus.status)
                  : "Sin estado"}
              </strong>
            </article>
            <article className="publisher-detail-summary-card">
              <span>Informes historicos</span>
              <strong>{details.reports.length}</strong>
            </article>
            <article className="publisher-detail-summary-card">
              <span>Estado de informes</span>
              <strong>{getPublisherReportingStateLabel(reportingState)}</strong>
            </article>
          </div>
        </div>

        <div className="publisher-detail-hero-side">
          <Link className="tenant-inline-link-button" href="/dashboard/publishers">
            Volver al listado
          </Link>
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="publisher-detail-layout">
        <aside className="publisher-detail-sidebar">
          <section className="publisher-detail-side-card">
            <div className="publisher-detail-side-card-header">
              <BookIcon className="publisher-detail-side-icon" />
              <div>
                <h2>Ficha del publicador</h2>
                <p>Vista consolidada del estado ministerial y su historial.</p>
              </div>
            </div>

            <div className="publisher-detail-facts">
              <div>
                <span>Codigo interno</span>
                <strong>{details.publisher.publisherCode ?? "Sin codigo"}</strong>
              </div>
              <div>
                <span>Grupo actual</span>
                <strong>{currentGroup?.groupName ?? "Sin grupo vigente"}</strong>
              </div>
              <div>
                <span>Tipo actual</span>
                <strong>
                  {currentStatus
                    ? getPublisherStatusLabel(currentStatus.status)
                    : "Sin estado vigente"}
                </strong>
              </div>
              <div>
                <span>Estado de informes</span>
                <strong>{getPublisherReportingStateLabel(reportingState)}</strong>
              </div>
            </div>
          </section>

          {canManage ? (
            <>
              <section className="publisher-detail-form-card">
                <div className="publisher-detail-form-header">
                  <ApartmentIcon className="publisher-detail-side-icon" />
                  <h2>Cambiar grupo</h2>
                </div>

                <form action={addPublisherGroupAssignmentAction} className="publisher-detail-form">
                  <input type="hidden" name="publisherId" value={details.publisher.id} />

                  <div className="field">
                    <label htmlFor="groupId">Grupo destino</label>
                    <select id="groupId" name="groupId" required defaultValue="">
                      <option value="" disabled>
                        Seleccionar...
                      </option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="groupEffectiveFrom">Fecha de vigencia</label>
                    <input
                      id="groupEffectiveFrom"
                      name="effectiveFrom"
                      type="date"
                      defaultValue={todayIsoDate()}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="groupNotes">Observaciones</label>
                    <textarea id="groupNotes" name="notes" rows={3} />
                  </div>

                  <button className="publisher-detail-primary-button" type="submit">
                    Guardar cambio
                  </button>
                </form>
              </section>

              <section className="publisher-detail-form-card">
                <div className="publisher-detail-form-header">
                  <BadgeIcon className="publisher-detail-side-icon" />
                  <h2>Cambiar tipo</h2>
                </div>

                <form action={addPublisherStatusAssignmentAction} className="publisher-detail-form">
                  <input type="hidden" name="publisherId" value={details.publisher.id} />

                  <div className="field">
                    <label htmlFor="status">Nuevo tipo</label>
                    <select id="status" name="status" defaultValue="publisher">
                      {publisherStatuses.map((value) => (
                        <option key={value} value={value}>
                          {getPublisherStatusLabel(value)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="statusEffectiveFrom">Fecha de vigencia</label>
                    <input
                      id="statusEffectiveFrom"
                      name="effectiveFrom"
                      type="date"
                      defaultValue={todayIsoDate()}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="statusNotes">Observaciones</label>
                    <textarea id="statusNotes" name="notes" rows={3} />
                  </div>

                  <button className="publisher-detail-primary-button" type="submit">
                    Guardar cambio
                  </button>
                </form>
              </section>
            </>
          ) : null}
        </aside>

        <div className="publisher-detail-main">
          <div className="publisher-detail-history-grid">
            <section className="publisher-detail-table-card">
              <div className="publisher-detail-table-header">
                <GroupUsersIcon className="publisher-detail-table-icon" />
                <div>
                  <h2>Historial de grupos</h2>
                  <p>{details.groupHistory.length} vigencias registradas</p>
                </div>
              </div>

              {details.groupHistory.length === 0 ? (
                <div className="empty-state">Sin historial de grupos.</div>
              ) : (
                <div className="tenant-users-table-wrap">
                  <table className="tenant-users-table">
                    <thead>
                      <tr>
                        <th>Grupo</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.groupHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.groupName}</td>
                          <td>{formatDate(entry.effectiveFrom)}</td>
                          <td>{formatDate(entry.effectiveTo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="publisher-detail-table-card">
              <div className="publisher-detail-table-header">
                <AssignmentIcon className="publisher-detail-table-icon" />
                <div>
                  <h2>Historial de tipos</h2>
                  <p>{details.statusHistory.length} vigencias registradas</p>
                </div>
              </div>

              {details.statusHistory.length === 0 ? (
                <div className="empty-state">Sin historial de tipos.</div>
              ) : (
                <div className="tenant-users-table-wrap">
                  <table className="tenant-users-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.statusHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{getPublisherStatusLabel(entry.status)}</td>
                          <td>{formatDate(entry.effectiveFrom)}</td>
                          <td>{formatDate(entry.effectiveTo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="publisher-detail-table-card">
            <div className="publisher-detail-table-header">
              <ReportsIcon className="publisher-detail-table-icon" />
              <div>
                <h2>Informes historicos de predicacion</h2>
                <p>{details.reports.length} informes registrados</p>
              </div>
            </div>

            {details.reports.length === 0 ? (
              <div className="empty-state">Todavia no hay informes para este publicador.</div>
            ) : (
              <div className="tenant-users-table-wrap">
                <table className="tenant-users-table">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Grupo</th>
                      <th>Tipo</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatMonthYear(report.reportYear, report.reportMonth)}</td>
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
      </section>
    </div>
  );
}
