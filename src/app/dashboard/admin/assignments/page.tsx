import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listAllTenants, listSecretaryUsers } from "@/lib/admin/queries";
import { assignSecretaryToTenantAction } from "@/app/dashboard/admin/assignments/actions";
import { CheckCircleIcon, DeleteIcon, InfoIcon, LinkIcon } from "@/components/superadmin/icons";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminAssignmentsPage({
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

  if (!context.appUser?.isSuperadmin) {
    redirect("/dashboard");
  }

  const [tenantList, secretaries] = await Promise.all([
    listAllTenants(),
    listSecretaryUsers(),
  ]);
  const assignedCount = tenantList.filter((tenant) => tenant.secretary).length;

  return (
    <div className="section-stack">
      <section className="jworg-page-header jworg-page-header-simple">
        <div>
          <h1>Asignaciones Administrativas</h1>
          <p>
            Gestione la vinculacion de secretarios responsables para cada una de las
            congregaciones registradas en el sistema.
          </p>
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <div className="jworg-assignment-grid">
        <section className="jworg-assignment-card">
          <div className="jworg-assignment-card-header">
            <div className="jworg-assignment-icon-shell">
              <LinkIcon className="jworg-assignment-icon" />
            </div>
            <h2>Vincular Secretario</h2>
          </div>

          <form action={assignSecretaryToTenantAction} className="jworg-assignment-form">
            <div className="field">
              <label htmlFor="tenantId">Seleccionar congregacion</label>
              <select id="tenantId" name="tenantId" required defaultValue="">
                <option value="" disabled>
                  Elegir congregacion...
                </option>
                {tenantList.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="appUserId">Seleccionar secretario</label>
              <select id="appUserId" name="appUserId" required defaultValue="">
                <option value="" disabled>
                  Elegir secretario...
                </option>
                {secretaries.map((secretary) => (
                  <option key={secretary.id} value={secretary.id}>
                    {secretary.displayName} · {secretary.email}
                  </option>
                ))}
              </select>
            </div>

            <button className="jworg-assignment-submit" type="submit">
              <CheckCircleIcon className="jworg-assignment-submit-icon" />
              Confirmar Vinculacion
            </button>
          </form>

          <div className="jworg-assignment-note">
            <InfoIcon className="jworg-assignment-note-icon" />
            <p>
              La vinculacion otorgará acceso total al secretario sobre los informes mensuales de
              la congregacion seleccionada.
            </p>
          </div>
        </section>

        <section className="jworg-assignment-table-shell">
          <div className="jworg-assignment-table-header">
            <h2>Estado Actual</h2>
            <span className="jworg-assignment-badge">{assignedCount} activos</span>
          </div>

          {tenantList.length === 0 ? (
            <div className="empty-state">Todavía no hay congregaciones creadas.</div>
          ) : (
            <div className="jworg-table-wrap">
              <table className="jworg-table">
                <thead>
                  <tr>
                    <th>Congregacion</th>
                    <th>Secretario responsable</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantList.map((tenant, index) => (
                    <tr key={tenant.id}>
                      <td>
                        <div className="jworg-assignment-congregation">
                          <strong>{tenant.name}</strong>
                          <span>ID: CONG-{String(index + 1).padStart(3, "0")}</span>
                        </div>
                      </td>
                      <td>
                        {tenant.secretary ? (
                          <div className="jworg-assignment-secretary">
                            <div className="jworg-assignment-secretary-badge">
                              {getInitials(tenant.secretary.displayName)}
                            </div>
                            <span>{tenant.secretary.displayName}</span>
                          </div>
                        ) : (
                          <div className="jworg-assignment-secretary">
                            <div className="jworg-assignment-secretary-badge muted">--</div>
                            <span className="jworg-assignment-empty">Sin Asignar</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            tenant.secretary
                              ? "jworg-status active"
                              : "jworg-status inactive"
                          }
                        >
                          {tenant.secretary ? "Asignado" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <button className="jworg-assignment-delete" type="button" aria-label="Eliminar asignacion">
                          <DeleteIcon className="jworg-assignment-delete-icon" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
