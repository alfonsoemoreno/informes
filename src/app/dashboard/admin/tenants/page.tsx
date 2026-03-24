import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { listAllTenants } from "@/lib/admin/queries";
import { createTenantAction } from "@/app/dashboard/admin/tenants/actions";

export default async function AdminTenantsPage({
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
    return (
      <section className="panel" style={{ padding: "28px" }}>
        <div className="empty-state">Esta seccion solo esta disponible para superadmins.</div>
      </section>
    );
  }

  const tenantList = await listAllTenants();

  return (
    <div className="section-stack">
      <section className="panel" style={{ padding: "28px", display: "grid", gap: "12px" }}>
        <span className="eyebrow">Superadmin</span>
        <h1>Congregaciones</h1>
        <p className="hint">
          Desde aqui se crean y administran los tenants del sistema. Por ahora se incluye alta
          de congregacion con un grupo inicial.
        </p>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="panel" style={{ padding: "28px", display: "grid", gap: "18px" }}>
        <h2>Crear congregacion</h2>
        <form action={createTenantAction} className="form-grid">
          <div className="form-grid two-columns">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" required />
            </div>
          </div>

          <div className="form-grid two-columns">
            <div className="field">
              <label htmlFor="timezone">Zona horaria</label>
              <input id="timezone" name="timezone" defaultValue="America/Santiago" required />
            </div>
            <div className="field">
              <label htmlFor="defaultGroupName">Primer grupo</label>
              <input id="defaultGroupName" name="defaultGroupName" defaultValue="Grupo 1" required />
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit">
              Crear congregacion
            </button>
          </div>
        </form>
      </section>

      <section className="panel" style={{ padding: "28px" }}>
        <div className="action-row" style={{ justifyContent: "space-between", marginBottom: "18px" }}>
          <h2>Tenants existentes</h2>
          <span className="hint">{tenantList.length} congregaciones</span>
        </div>

        {tenantList.length === 0 ? (
          <div className="empty-state">Todavia no existen congregaciones registradas.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Timezone</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tenantList.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.slug}</td>
                  <td>{tenant.timezone}</td>
                  <td>{tenant.isActive ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
