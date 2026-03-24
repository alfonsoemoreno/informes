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

  if (context.appUser?.isSuperadmin) {
    redirect("/dashboard/admin/tenants");
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
          <h2>Agregar grupo</h2>
          <p className="hint">
            Los grupos se crean en orden correlativo. Al agregar uno nuevo, el sistema genera
            automaticamente el siguiente disponible.
          </p>
          <form action={createGroupAction} className="form-grid">
            <div className="action-row">
              <button className="primary-button" type="submit">
                Agregar siguiente grupo
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
                <th>Numero</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.sortOrder}</td>
                  <td>{group.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
