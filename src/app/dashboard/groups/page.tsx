import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listTenantGroups } from "@/lib/reporting/queries";
import { getRoleLabel } from "@/lib/domain/labels";
import { canManageGroups } from "@/lib/domain/permissions";
import { createGroupAction } from "@/app/dashboard/groups/actions";

export default async function GroupsPage({
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
        <p className="hint">Debes pertenecer a una congregacion para administrar grupos.</p>
      </section>
    );
  }

  const groups = await listTenantGroups(membership.tenantId);

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <span className="eyebrow">Grupos</span>
        <h1>Grupos de predicacion</h1>
        <p className="hint">
          Rol activo: {getRoleLabel(membership.role)}. Los grupos definen el alcance de carga
          para superintendentes y auxiliares.
        </p>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      {canManageGroups(membership.role) ? (
        <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
          <h2>Crear grupo</h2>
          <form action={createGroupAction} className="form-grid">
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="name">Nombre</label>
                <input id="name" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="code">Codigo</label>
                <input id="code" name="code" />
              </div>
            </div>
            <div className="field" style={{ maxWidth: "180px" }}>
              <label htmlFor="sortOrder">Orden</label>
              <input id="sortOrder" name="sortOrder" type="number" defaultValue="0" min="0" />
            </div>
            <div className="action-row">
              <button className="primary-button" type="submit">
                Guardar grupo
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel" style={{ padding: "28px" }}>
        <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
          <h2>Listado de grupos</h2>
          <span className="hint">{groups.length} grupos activos</span>
        </div>
        {groups.length === 0 ? (
          <div className="empty-state">Todavia no hay grupos creados en esta congregacion.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Codigo</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>{group.code ?? "Sin codigo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
