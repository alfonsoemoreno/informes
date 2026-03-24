"use client";

import { useMemo, useState } from "react";
import { createTenantAction, updateTenantAction } from "@/app/dashboard/admin/tenants/actions";
import { AddCircleIcon } from "@/components/superadmin/icons";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  secretary: {
    tenantUserId: string;
    email: string;
    displayName: string;
    isActive: boolean;
  } | null;
};

export function TenantManagement({ tenants }: { tenants: TenantItem[] }) {
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const editingTenant = tenants.find((tenant) => tenant.id === editingTenantId) ?? null;

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tenants;
    }

    return tenants.filter((tenant) => {
      const secretary = tenant.secretary
        ? `${tenant.secretary.displayName} ${tenant.secretary.email}`.toLowerCase()
        : "";

      return (
        tenant.name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query) ||
        secretary.includes(query)
      );
    });
  }, [search, tenants]);

  const activeCount = tenants.filter((tenant) => tenant.isActive).length;
  const inactiveCount = tenants.length - activeCount;
  const assignedCount = tenants.filter((tenant) => tenant.secretary).length;

  return (
    <>
      <section className="jworg-page-header">
        <div>
          <nav className="jworg-breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <span>Congregaciones</span>
          </nav>
          <h1>Gestion de Congregaciones</h1>
          <p>
            Administra las unidades organizativas activas en el sistema, configura sus accesos y
            supervisa su estado operativo.
          </p>
        </div>
        <button className="jworg-primary-cta" type="button" onClick={() => setIsCreateOpen(true)}>
          <AddCircleIcon className="jworg-primary-cta-icon" />
          Nueva Congregacion
        </button>
      </section>

      <section className="jworg-stats-grid">
        <article className="jworg-stat-hero">
          <span className="eyebrow">Resumen del sistema</span>
          <strong>{activeCount} Congregaciones Activas</strong>
          <div className="jworg-stat-split">
            <div>
              <span>Con secretario</span>
              <strong>{assignedCount}</strong>
            </div>
            <div>
              <span>Activas</span>
              <strong>{activeCount}</strong>
            </div>
            <div>
              <span>Inactivas</span>
              <strong>{inactiveCount}</strong>
            </div>
          </div>
        </article>

        <article className="jworg-stat-card">
          <span className="eyebrow">Cobertura</span>
          <strong>{tenants.length}</strong>
          <p>{inactiveCount === 0 ? "Todas las congregaciones estan activas." : `${inactiveCount} congregaciones estan inactivas actualmente.`}</p>
        </article>
      </section>

      <section className="jworg-table-shell">
        <div className="jworg-table-toolbar">
          <div className="jworg-search">
            <input
              aria-label="Buscar congregaciones"
              type="search"
              placeholder="Buscar por nombre o slug..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="jworg-toolbar-meta">
            <span>{filteredTenants.length} resultados</span>
          </div>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="empty-state">No hay congregaciones que coincidan con la búsqueda.</div>
        ) : (
          <div className="jworg-table-wrap">
            <table className="jworg-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Secretario principal</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant, index) => (
                  <tr key={tenant.id}>
                    <td>
                      <div className="jworg-table-name">
                        <div className="jworg-table-icon">{tenant.name.slice(0, 1).toUpperCase()}</div>
                        <div>
                          <strong>{tenant.name}</strong>
                          <span>ID: CONG-{String(index + 1).padStart(3, "0")}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="jworg-slug-chip">{tenant.slug}</span>
                    </td>
                    <td>
                      {tenant.secretary ? (
                        <div className="jworg-secretary-cell">
                          <strong>{tenant.secretary.displayName}</strong>
                          <span>{tenant.secretary.email}</span>
                        </div>
                      ) : (
                        <span className="hint">Sin asignacion</span>
                      )}
                    </td>
                    <td>
                      <span className={tenant.isActive ? "jworg-status active" : "jworg-status inactive"}>
                        {tenant.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="jworg-table-action"
                        type="button"
                        onClick={() => setEditingTenantId(tenant.id)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="jworg-table-footer">
          Mostrando {filteredTenants.length} de {tenants.length} congregaciones
        </div>
      </section>

      {isCreateOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)} role="presentation">
          <div
            className="modal-card jworg-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-tenant-title"
          >
            <div className="jworg-modal-header">
              <div className="jworg-modal-heading">
                <span className="eyebrow">Nueva congregacion</span>
                <h2 id="create-tenant-title">Crear congregacion</h2>
              </div>
              <button className="jworg-modal-close" type="button" onClick={() => setIsCreateOpen(false)}>
                Cerrar
              </button>
            </div>

            <form action={createTenantAction} className="form-grid jworg-modal-form">
              <div className="field">
                <label htmlFor="create-tenant-name">Nombre</label>
                <input id="create-tenant-name" name="name" placeholder="Ej: Central - Madrid" required />
              </div>
              <div className="field">
                <label htmlFor="create-tenant-slug">Slug</label>
                <input id="create-tenant-slug" name="slug" placeholder="central-madrid" required />
              </div>
              <div className="jworg-modal-actions">
                <button className="jworg-modal-secondary" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </button>
                <button className="jworg-primary-cta jworg-modal-primary" type="submit">
                  <AddCircleIcon className="jworg-primary-cta-icon" />
                  Guardar congregacion
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingTenant ? (
        <div
          className="modal-backdrop"
          onClick={() => setEditingTenantId(null)}
          role="presentation"
        >
          <div
            className="modal-card panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-tenant-title"
          >
            <div className="action-row" style={{ justifyContent: "space-between" }}>
              <div>
                <span className="eyebrow">Editar</span>
                <h2 id="edit-tenant-title">{editingTenant.name}</h2>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEditingTenantId(null)}
              >
                Cerrar
              </button>
            </div>

            <form action={updateTenantAction} className="form-grid">
              <input type="hidden" name="tenantId" value={editingTenant.id} />

              <div className="form-grid two-columns">
                <div className="field">
                  <label htmlFor="tenant-name">Nombre</label>
                  <input id="tenant-name" name="name" defaultValue={editingTenant.name} required />
                </div>
                <div className="field">
                  <label htmlFor="tenant-slug">Slug</label>
                  <input id="tenant-slug" name="slug" defaultValue={editingTenant.slug} required />
                </div>
              </div>

              <div className="form-grid">
                <div className="field" style={{ alignSelf: "end" }}>
                  <label htmlFor="tenant-active">Estado del tenant</label>
                  <label className="switch-field" htmlFor="tenant-active">
                    <input
                      id="tenant-active"
                      name="isActive"
                      type="checkbox"
                      defaultChecked={editingTenant.isActive}
                    />
                    <span className="switch-track" aria-hidden="true">
                      <span className="switch-thumb" />
                    </span>
                    <span className="switch-label">Activar tenant</span>
                  </label>
                </div>
              </div>

              <div className="action-row" style={{ justifyContent: "flex-end" }}>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setEditingTenantId(null)}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
