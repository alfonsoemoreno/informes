import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listTenantUsers } from "@/lib/admin/queries";
import { listTenantGroups } from "@/lib/reporting/queries";
import { getRoleLabel } from "@/lib/domain/labels";
import { canManageTenantUsers } from "@/lib/domain/permissions";
import { tenantRoles } from "@/lib/domain/reporting";
import {
  createTenantUserAction,
  toggleTenantUserActiveAction,
  updateTenantUserMembershipAction,
} from "@/app/dashboard/users/actions";

export default async function TenantUsersPage({
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
        <p className="hint">Debes estar asignado a una congregacion para administrar usuarios.</p>
      </section>
    );
  }

  const [groups, users] = await Promise.all([
    listTenantGroups(membership.tenantId),
    listTenantUsers(membership.tenantId),
  ]);

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <span className="eyebrow">Usuarios</span>
        <h1>Usuarios de {membership.tenantName}</h1>
        <p className="hint">
          El secretario puede crear y actualizar accesos del tenant. Cada usuario del tenant
          tiene un solo rol y, si corresponde, un grupo asociado.
        </p>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      {canManageTenantUsers(membership.role) ? (
        <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2>Crear o reasignar usuario</h2>
          <form action={createTenantUserAction} className="form-grid">
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="displayName">Nombre</label>
                <input id="displayName" name="displayName" required />
              </div>
              <div className="field">
                <label htmlFor="email">Correo</label>
                <input id="email" name="email" type="email" required />
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="password">Clave inicial</label>
                <input id="password" name="password" type="password" required />
              </div>
              <div className="field">
                <label htmlFor="role">Rol</label>
                <select id="role" name="role" defaultValue="elder">
                  {tenantRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="groupId">Grupo asociado</label>
              <select id="groupId" name="groupId" defaultValue="">
                <option value="">Sin grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                Guardar usuario
              </button>
              <span className="hint">
                Si el correo ya existe en la app, se reutiliza el usuario local y solo se actualiza
                su pertenencia al tenant.
              </span>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel" style={{ padding: "24px" }}>
          <div className="empty-state">
            Tu rol no puede administrar usuarios. Esta vista queda en modo consulta.
          </div>
        </section>
      )}

      <section className="panel" style={{ padding: "28px" }}>
        <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
          <h2>Accesos del tenant</h2>
          <span className="hint">{users.length} usuarios</span>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">Todavia no hay usuarios asignados a esta congregacion.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Grupo</th>
                <th>Estado</th>
                {canManageTenantUsers(membership.role) ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.tenantUserId}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td>{getRoleLabel(user.role)}</td>
                  <td>{user.groupName ?? "Sin grupo"}</td>
                  <td>{user.isActive ? "Activo" : "Inactivo"}</td>
                  {canManageTenantUsers(membership.role) ? (
                    <td>
                      <div className="section-stack">
                        <form action={updateTenantUserMembershipAction} className="form-grid">
                          <input type="hidden" name="tenantUserId" value={user.tenantUserId} />
                          <div className="form-grid two-columns">
                            <div className="field">
                              <label htmlFor={`role-${user.tenantUserId}`}>Rol</label>
                              <select
                                id={`role-${user.tenantUserId}`}
                                name="role"
                                defaultValue={user.role}
                              >
                                {tenantRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {getRoleLabel(role)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="field">
                              <label htmlFor={`group-${user.tenantUserId}`}>Grupo</label>
                              <select
                                id={`group-${user.tenantUserId}`}
                                name="groupId"
                                defaultValue={user.groupId ?? ""}
                              >
                                <option value="">Sin grupo</option>
                                {groups.map((group) => (
                                  <option key={group.id} value={group.id}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button className="secondary-button" type="submit">
                            Actualizar
                          </button>
                        </form>

                        <form action={toggleTenantUserActiveAction}>
                          <input type="hidden" name="tenantUserId" value={user.tenantUserId} />
                          <button className="secondary-button" type="submit">
                            {user.isActive ? "Desactivar" : "Reactivar"}
                          </button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
