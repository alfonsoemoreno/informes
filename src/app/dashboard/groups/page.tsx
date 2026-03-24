import { redirect } from "next/navigation";
import { AddCircleIcon, ApartmentIcon, GroupUsersIcon, InfoIcon } from "@/components/superadmin/icons";
import { getCurrentAppContext } from "@/lib/app-context";
import { listTenantGroups } from "@/lib/reporting/queries";
import { getRoleLabel } from "@/lib/domain/labels";
import { canManageGroups } from "@/lib/domain/permissions";
import { createGroupAction } from "@/app/dashboard/groups/actions";

const groupIcons = [ApartmentIcon, GroupUsersIcon, InfoIcon];

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
  const nextGroupNumber = (groups.at(-1)?.sortOrder ?? 0) + 1;
  const canManage = canManageGroups(membership.role);

  return (
    <div className="tenant-groups-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Administracion</span>
          <h1>Gestion de Grupos</h1>
          <p>
            Administra la secuencia de grupos de predicacion de {membership.tenantName}. Los
            grupos se generan correlativamente y determinan el alcance operativo para
            superintendentes y auxiliares.
          </p>
        </div>

        <div className="tenant-page-header-actions">
          <div className="tenant-stat-card">
            <div className="tenant-stat-icon">
              <ApartmentIcon className="tenant-stat-icon-svg" />
            </div>
            <div>
              <p className="tenant-stat-value">{groups.length}</p>
              <p className="tenant-stat-label">Grupos activos</p>
            </div>
          </div>

          {canManage ? (
            <form action={createGroupAction}>
              <button className="tenant-primary-cta" type="submit">
                <AddCircleIcon className="tenant-primary-cta-icon" />
                Agregar Grupo {nextGroupNumber}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="tenant-groups-hero">
        <div className="tenant-groups-hero-copy">
          <span className="tenant-groups-badge">Secuencia automatica</span>
          <h2>El siguiente grupo disponible es el {nextGroupNumber}</h2>
          <p>
            Rol activo: {getRoleLabel(membership.role)}. La numeracion es continua y el
            sistema toma siempre el siguiente correlativo libre.
          </p>
          {canManage ? (
            <form action={createGroupAction}>
              <button className="tenant-groups-secondary-cta" type="submit">
                Crear Grupo {nextGroupNumber}
              </button>
            </form>
          ) : null}
        </div>

        <div className="tenant-groups-hero-panel">
          <p className="tenant-groups-hero-panel-label">Cobertura actual</p>
          <strong>{groups.length} grupos registrados</strong>
          <span>
            Estructura activa para la congregacion. Cada nuevo grupo se agrega al final de la
            secuencia.
          </span>
        </div>
      </section>

      {groups.length === 0 ? (
        <section className="tenant-groups-empty">
          <p>No hay grupos creados todavia en esta congregacion.</p>
        </section>
      ) : (
        <section className="tenant-groups-grid">
          {groups.map((group, index) => {
            const Icon = groupIcons[index % groupIcons.length];

            return (
              <article className="tenant-group-card" key={group.id}>
                <div className="tenant-group-card-top">
                  <div className="tenant-group-card-icon-shell">
                    <Icon className="tenant-group-card-icon" />
                  </div>
                  <span className="tenant-group-card-number">
                    {String(group.sortOrder).padStart(2, "0")}
                  </span>
                </div>

                <div className="tenant-group-card-body">
                  <h3>{group.name}</h3>
                  <p>Grupo secuencial del tenant, disponible para asignaciones y reportes.</p>
                  <div className="tenant-group-card-meta">
                    <span>Codigo {group.code}</span>
                    <span>Orden {group.sortOrder}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
