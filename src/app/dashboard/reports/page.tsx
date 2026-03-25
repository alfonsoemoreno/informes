import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronDownIcon,
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
  getGroupReportSheet,
  listTenantGroups,
} from "@/lib/reporting/queries";
import { saveGroupMonthlyReportsAction } from "@/app/dashboard/reports/actions";

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;

  return {
    value: month,
    label: new Intl.DateTimeFormat("es-CL", {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, index, 1))),
  };
});

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
  const yearOptions = Array.from(
    { length: currentPeriod.year + 2 - 2020 },
    (_, index) => 2020 + index,
  ).reverse();
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

  const allGroups = await listTenantGroups(membership.tenantId);
  const availableGroups =
    membership.role === "group_overseer" || membership.role === "group_assistant"
      ? allGroups.filter((group) => group.id === membership.groupId)
      : allGroups;

  const selectedGroupId =
    typeof resolvedSearchParams.groupId === "string" &&
    availableGroups.some((group) => group.id === resolvedSearchParams.groupId)
      ? resolvedSearchParams.groupId
      : (availableGroups[0]?.id ?? null);

  const reportSheet = await (selectedGroupId
      ? getGroupReportSheet({
          tenantId: membership.tenantId,
          groupId: selectedGroupId,
          year: selectedYear,
          month: selectedMonth,
        })
      : Promise.resolve([]));

  const canEditSelectedGroup =
    canSubmitReports(membership.role) &&
    (!selectedGroupId ||
      membership.role === "secretary" ||
      membership.groupId === selectedGroupId);

  const selectedGroupName =
    availableGroups.find((group) => group.id === selectedGroupId)?.name ?? "Sin grupo";

  return (
    <div className="reports-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Informes</span>
          <h1>Informes mensuales</h1>
          <p>
            Rol activo: {getRoleLabel(membership.role)}. Selecciona el período y el grupo
            para ver o cargar los informes completos de sus publicadores.
          </p>
        </div>

        <div className="tenant-page-header-actions">
          <Link
            className="tenant-inline-link-button reports-current-link"
            href={`/dashboard/reports?month=${currentPeriod.month}&year=${currentPeriod.year}${
              selectedGroupId ? `&groupId=${selectedGroupId}` : ""
            }`}
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
          <p className="reports-period-subtitle">Grupo seleccionado: {selectedGroupName}</p>
        </div>

        <form method="get" className="reports-period-form">
          <div className="field">
            <label htmlFor="monthFilter">Mes</label>
            <div className="reports-select-shell">
              <select id="monthFilter" name="month" defaultValue={String(selectedMonth)}>
                {monthOptions.map((monthOption) => (
                  <option key={monthOption.value} value={monthOption.value}>
                    {monthOption.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="reports-select-icon" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="yearFilter">Año</label>
            <div className="reports-select-shell">
              <select id="yearFilter" name="year" defaultValue={String(selectedYear)}>
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="reports-select-icon" />
            </div>
          </div>
          <div className="field reports-group-field">
            <label htmlFor="groupFilter">Grupo</label>
            <div className="reports-select-shell">
              <select id="groupFilter" name="groupId" defaultValue={selectedGroupId ?? ""}>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="reports-select-icon" />
            </div>
          </div>
          <button className="tenant-inline-link-button" type="submit">
            Ver grupo
          </button>
        </form>
      </section>

      <section className="tenant-publisher-stats-grid">
        <article className="tenant-publisher-stat">
          <span>Grupo seleccionado</span>
          <strong>{selectedGroupName}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Periodo</span>
          <strong>{formatMonthYear(selectedYear, selectedMonth)}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Publicadores del grupo</span>
          <strong>{reportSheet.length}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Modo</span>
          <strong>{canEditSelectedGroup ? "Edición" : "Consulta"}</strong>
        </article>
      </section>

      <section className="publisher-detail-table-card reports-sheet-card">
        <div className="publisher-detail-table-header">
          <ReportsIcon className="publisher-detail-table-icon" />
          <div>
            <h2>{canEditSelectedGroup ? "Cargar informe" : "Ver informe"}</h2>
            <p>
              {reportSheet.length} publicadores asociados a {selectedGroupName} en{" "}
              {formatMonthYear(selectedYear, selectedMonth)}.
            </p>
          </div>
        </div>

        {selectedGroupId === null ? (
          <div className="empty-state">No hay grupos disponibles para este usuario.</div>
        ) : reportSheet.length === 0 ? (
          <div className="empty-state">
            No hay publicadores vigentes en este grupo para el periodo seleccionado.
          </div>
        ) : (
          <form action={saveGroupMonthlyReportsAction} className="reports-sheet-form">
            <input type="hidden" name="groupId" value={selectedGroupId} />
            <input type="hidden" name="reportMonth" value={selectedMonth} />
            <input type="hidden" name="reportYear" value={selectedYear} />

            <div className="tenant-users-table-wrap">
              <table className="tenant-users-table reports-entry-table">
                <thead>
                  <tr>
                    <th>Publicador</th>
                    <th>Tipo</th>
                    <th className="reports-col-hours">Horas</th>
                    <th className="reports-col-participated">Participó</th>
                    <th className="reports-col-studies">Cursos bíblicos</th>
                    <th className="reports-col-notes">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportSheet.map((entry) => (
                    <tr key={entry.publisherId}>
                      <td>
                        <input type="hidden" name="publisherIds" value={entry.publisherId} />
                        <div className="reports-sheet-publisher">
                          <strong>{entry.fullName}</strong>
                          <span>{entry.publisherCode ?? "Sin código"} · {entry.groupName}</span>
                        </div>
                      </td>
                      <td>{getPublisherStatusLabel(entry.publisherStatus)}</td>
                      <td className="reports-col-hours">
                        <input
                          className="reports-sheet-input reports-sheet-input-compact"
                          name={`preachingHours:${entry.publisherId}`}
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={entry.preachingHours ?? ""}
                          disabled={!canEditSelectedGroup || entry.publisherStatus === "publisher"}
                        />
                      </td>
                      <td className="reports-col-participated">
                        <label className="reports-table-switch">
                          <input
                            name={`participated:${entry.publisherId}`}
                            type="checkbox"
                            defaultChecked={
                              entry.publisherStatus === "publisher"
                                ? entry.participated
                                : true
                            }
                            disabled={!canEditSelectedGroup || entry.publisherStatus !== "publisher"}
                          />
                          <span className="switch-track" aria-hidden="true">
                            <span className="switch-thumb" />
                          </span>
                        </label>
                      </td>
                      <td className="reports-col-studies">
                        <input
                          className="reports-sheet-input reports-sheet-input-compact"
                          name={`bibleStudies:${entry.publisherId}`}
                          type="number"
                          min="0"
                          defaultValue={entry.bibleStudies}
                          disabled={!canEditSelectedGroup}
                        />
                      </td>
                      <td className="reports-col-notes">
                        <input
                          className="reports-sheet-input reports-sheet-input-notes"
                          name={`notes:${entry.publisherId}`}
                          type="text"
                          defaultValue={entry.notes}
                          disabled={!canEditSelectedGroup}
                          placeholder="Observaciones"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canEditSelectedGroup ? (
              <div className="reports-sheet-actions">
                <button className="publisher-detail-primary-button" type="submit">
                  Guardar informes
                </button>
              </div>
            ) : (
              <div className="empty-state">
                Tu rol puede revisar estos informes, pero no modificarlos.
              </div>
            )}
          </form>
        )}
      </section>

    </div>
  );
}
