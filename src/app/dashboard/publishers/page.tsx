import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { getPublisherStatusLabel, getRoleLabel } from "@/lib/domain/labels";
import { canManagePublishers } from "@/lib/domain/permissions";
import { publisherStatuses } from "@/lib/domain/reporting";
import {
  listTenantGroups,
  listTenantPublishers,
  resolvePublisherStateForMonth,
} from "@/lib/reporting/queries";
import { createPublisherAction } from "@/app/dashboard/publishers/actions";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function PublishersPage({
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

  if (context.appUser?.isSuperadmin) {
    redirect("/dashboard/admin/tenants");
  }

  const membership = context.activeMembership;

  if (!membership) {
    return (
      <section className="panel" style={{ padding: "28px" }}>
        <h1>Sin tenant asignado</h1>
        <p className="hint">
          El usuario existe en Neon Auth, pero todavia no tiene una asignacion activa
          dentro de una congregacion.
        </p>
      </section>
    );
  }

  const [groups, tenantPublishers] = await Promise.all([
    listTenantGroups(membership.tenantId),
    listTenantPublishers(membership.tenantId),
  ]);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const publishers = await Promise.all(
    tenantPublishers.map(async (publisher) => {
      const currentState = await resolvePublisherStateForMonth({
        tenantId: membership.tenantId,
        publisherId: publisher.id,
        year,
        month,
      });

      return {
        ...publisher,
        currentGroupName: currentState?.group.name ?? "Sin grupo vigente",
        currentStatus: currentState?.status ?? null,
      };
    }),
  );

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <span className="eyebrow">Mantenedor</span>
        <h1>Publicadores de {membership.tenantName}</h1>
        <p className="hint">
          Rol activo: {getRoleLabel(membership.role)}. El secretario administra la ficha
          del publicador, su grupo y el inicio del estado ministerial vigente.
        </p>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      {canManagePublishers(membership.role) ? (
        <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2>Crear publicador</h2>
          <form action={createPublisherAction} className="form-grid">
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="firstName">Nombre</label>
                <input id="firstName" name="firstName" required />
              </div>
              <div className="field">
                <label htmlFor="lastName">Apellido</label>
                <input id="lastName" name="lastName" required />
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="publisherCode">Codigo interno</label>
                <input id="publisherCode" name="publisherCode" />
              </div>
              <div className="field">
                <label htmlFor="groupId">Grupo de predicacion</label>
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
            </div>

            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="status">Tipo de publicador</label>
                <select id="status" name="status" defaultValue="publisher">
                  {publisherStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getPublisherStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="effectiveFrom">Vigencia desde</label>
                <input id="effectiveFrom" name="effectiveFrom" type="date" defaultValue={todayIsoDate()} required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="notes">Observaciones iniciales</label>
              <textarea id="notes" name="notes" />
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                Guardar publicador
              </button>
              <span className="hint">
                Si el estado cambia en el futuro, se debe agregar una nueva vigencia en la
                historia del publicador.
              </span>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel" style={{ padding: "24px" }}>
          <div className="empty-state">
            Tu rol no puede crear o editar publicadores. Esta vista queda disponible en modo consulta.
          </div>
        </section>
      )}

      <section className="panel" style={{ padding: "28px" }}>
        <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
          <h2>Listado actual</h2>
          <span className="hint">{publishers.length} publicadores registrados</span>
        </div>

        {publishers.length === 0 ? (
          <div className="empty-state">
            Todavia no hay publicadores cargados en esta congregacion.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Publicador</th>
                <th>Grupo vigente</th>
                <th>Estado vigente</th>
                <th>Codigo</th>
              </tr>
            </thead>
            <tbody>
              {publishers.map((publisher) => (
                <tr key={publisher.id}>
                  <td>{publisher.fullName}</td>
                  <td>{publisher.currentGroupName}</td>
                  <td>
                    {publisher.currentStatus
                      ? getPublisherStatusLabel(publisher.currentStatus)
                      : "Sin estado vigente"}
                  </td>
                  <td>
                    <div className="action-row">
                      <span>{publisher.publisherCode ?? "Sin codigo"}</span>
                      <Link className="secondary-button" href={`/dashboard/publishers/${publisher.id}`}>
                        Ver detalle
                      </Link>
                    </div>
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
