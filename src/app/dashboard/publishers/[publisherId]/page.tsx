import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import { formatMonthYear } from "@/lib/domain/periods";
import { canManagePublishers } from "@/lib/domain/permissions";
import { publisherStatuses } from "@/lib/domain/reporting";
import { listTenantGroups, getPublisherDetails } from "@/lib/reporting/queries";
import {
  addPublisherGroupAssignmentAction,
  addPublisherStatusAssignmentAction,
} from "@/app/dashboard/publishers/actions";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Vigente";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
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

  const [groups, details] = await Promise.all([
    listTenantGroups(membership.tenantId),
    getPublisherDetails({
      tenantId: membership.tenantId,
      publisherId,
    }),
  ]);

  if (!details) {
    notFound();
  }

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: "8px" }}>
            <span className="eyebrow">Publicador</span>
            <h1>{details.publisher.fullName}</h1>
            <p className="hint">
              Rol activo: {getRoleLabel(membership.role)}. Codigo:{" "}
              {details.publisher.publisherCode ?? "Sin codigo"}.
            </p>
          </div>
          <Link className="secondary-button" href="/dashboard/publishers">
            Volver al listado
          </Link>
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      {canManagePublishers(membership.role) ? (
        <section
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
            <h2>Cambiar grupo</h2>
            <form action={addPublisherGroupAssignmentAction} className="form-grid">
              <input type="hidden" name="publisherId" value={details.publisher.id} />
              <div className="field">
                <label htmlFor="groupId">Grupo</label>
                <select id="groupId" name="groupId" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un grupo
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="groupEffectiveFrom">Vigencia desde</label>
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
                <textarea id="groupNotes" name="notes" />
              </div>
              <button className="primary-button" type="submit">
                Guardar cambio de grupo
              </button>
            </form>
          </article>

          <article className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
            <h2>Cambiar tipo</h2>
            <form action={addPublisherStatusAssignmentAction} className="form-grid">
              <input type="hidden" name="publisherId" value={details.publisher.id} />
              <div className="field">
                <label htmlFor="status">Tipo de publicador</label>
                <select id="status" name="status" defaultValue="publisher">
                  {publisherStatuses.map((value) => (
                    <option key={value} value={value}>
                      {getPublisherStatusLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="statusEffectiveFrom">Vigencia desde</label>
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
                <textarea id="statusNotes" name="notes" />
              </div>
              <button className="primary-button" type="submit">
                Guardar cambio de tipo
              </button>
            </form>
          </article>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <article className="panel" style={{ padding: "28px" }}>
          <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
            <h2>Historial de grupos</h2>
            <span className="hint">{details.groupHistory.length} vigencias</span>
          </div>

          {details.groupHistory.length === 0 ? (
            <div className="empty-state">Sin historial de grupos.</div>
          ) : (
            <table className="data-table">
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
          )}
        </article>

        <article className="panel" style={{ padding: "28px" }}>
          <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
            <h2>Historial de tipos</h2>
            <span className="hint">{details.statusHistory.length} vigencias</span>
          </div>

          {details.statusHistory.length === 0 ? (
            <div className="empty-state">Sin historial de tipos.</div>
          ) : (
            <table className="data-table">
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
          )}
        </article>
      </section>

      <section className="panel" style={{ padding: "28px" }}>
        <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
          <h2>Informes historicos</h2>
          <span className="hint">{details.reports.length} informes</span>
        </div>

        {details.reports.length === 0 ? (
          <div className="empty-state">Todavia no hay informes para este publicador.</div>
        ) : (
          <table className="data-table">
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
        )}
      </section>
    </div>
  );
}
