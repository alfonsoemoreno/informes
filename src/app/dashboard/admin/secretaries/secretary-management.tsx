"use client";

import { useMemo, useState } from "react";
import {
  createSecretaryAction,
  updateSecretaryAction,
} from "@/app/dashboard/admin/secretaries/actions";
import { AddCircleIcon, BadgeIcon } from "@/components/superadmin/icons";

type SecretaryItem = {
  id: string;
  email: string;
  displayName: string;
  secretaryMembership: {
    tenantName: string;
  } | null;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SecretaryManagement({ secretaries }: { secretaries: SecretaryItem[] }) {
  const [search, setSearch] = useState("");
  const [editingSecretaryId, setEditingSecretaryId] = useState<string | null>(null);

  const editingSecretary =
    secretaries.find((secretary) => secretary.id === editingSecretaryId) ?? null;

  const filteredSecretaries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return secretaries;
    }

    return secretaries.filter((secretary) => {
      const tenantName = secretary.secretaryMembership?.tenantName.toLowerCase() ?? "";

      return (
        secretary.displayName.toLowerCase().includes(query) ||
        secretary.email.toLowerCase().includes(query) ||
        tenantName.includes(query)
      );
    });
  }, [search, secretaries]);

  return (
    <>
      <section className="jworg-page-header jworg-page-header-simple">
        <div>
          <h1>Gestion de Secretarios</h1>
          <p>
            Administre las credenciales y el acceso de los secretarios responsables de las
            congregaciones asignadas.
          </p>
        </div>
        <button
          className="jworg-primary-cta"
          type="button"
          onClick={() => document.getElementById("secretary-form-card")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <AddCircleIcon className="jworg-primary-cta-icon" />
          Registrar Nuevo Secretario
        </button>
      </section>

      <div className="jworg-secretaries-grid">
        <section className="jworg-secretaries-table-shell">
          <div className="jworg-secretaries-table-header">
            <h2>Listado Activo</h2>
            <div className="jworg-secretaries-search">
              <input
                aria-label="Buscar secretario"
                type="search"
                placeholder="Buscar secretario..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {filteredSecretaries.length === 0 ? (
            <div className="empty-state">No hay secretarios que coincidan con la busqueda.</div>
          ) : (
            <div className="jworg-table-wrap">
              <table className="jworg-table">
                <thead>
                  <tr>
                    <th>Nombre completo</th>
                    <th>Correo electronico</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSecretaries.map((secretary) => (
                    <tr key={secretary.id}>
                      <td>
                        <div className="jworg-secretary-name-cell">
                          <div className="jworg-secretary-avatar">{getInitials(secretary.displayName)}</div>
                          <div>
                            <strong>{secretary.displayName}</strong>
                            <span>
                              {secretary.secretaryMembership?.tenantName ?? "Sin congregacion asignada"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="jworg-secretary-email">{secretary.email}</span>
                      </td>
                      <td>
                        <span className={secretary.secretaryMembership ? "jworg-status active" : "jworg-status inactive"}>
                          {secretary.secretaryMembership ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="jworg-secretary-action"
                          type="button"
                          onClick={() => setEditingSecretaryId(secretary.id)}
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
        </section>

        <aside id="secretary-form-card" className="jworg-secretary-form-card">
          <div className="jworg-secretary-form-header">
            <div className="jworg-assignment-icon-shell">
              <BadgeIcon className="jworg-assignment-icon" />
            </div>
            <h2>Nuevo Registro</h2>
          </div>

          <form action={createSecretaryAction} className="jworg-secretary-form">
            <div className="field">
              <label htmlFor="displayName">Nombre Completo</label>
              <input id="displayName" name="displayName" placeholder="Ej. Juan Perez" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email Institucional</label>
              <input id="email" name="email" type="email" placeholder="email@predicacion.org" required />
            </div>
            <div className="field">
              <label htmlFor="password">Clave Inicial</label>
              <input id="password" name="password" type="password" placeholder="Minimo 8 caracteres" required />
            </div>
            <div className="jworg-secretary-form-actions">
              <button className="jworg-secretary-submit" type="submit">
                Finalizar Registro
              </button>
              <p>Se enviara un correo de activacion automaticamente.</p>
            </div>
          </form>
        </aside>
      </div>

      {editingSecretary ? (
        <div className="modal-backdrop" onClick={() => setEditingSecretaryId(null)} role="presentation">
          <div
            className="modal-card jworg-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-secretary-title"
          >
            <div className="jworg-modal-header">
              <div className="jworg-modal-heading">
                <span className="eyebrow">Editar secretario</span>
                <h2 id="edit-secretary-title">{editingSecretary.displayName}</h2>
              </div>
              <button className="jworg-modal-close" type="button" onClick={() => setEditingSecretaryId(null)}>
                Cerrar
              </button>
            </div>

            <form action={updateSecretaryAction} className="form-grid jworg-modal-form">
              <input type="hidden" name="appUserId" value={editingSecretary.id} />
              <div className="field">
                <label htmlFor="edit-secretary-name">Nombre</label>
                <input
                  id="edit-secretary-name"
                  name="displayName"
                  defaultValue={editingSecretary.displayName}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-secretary-email">Correo</label>
                <input id="edit-secretary-email" value={editingSecretary.email} disabled readOnly />
              </div>
              <div className="field">
                <label htmlFor="edit-secretary-password">Nueva clave</label>
                <input
                  id="edit-secretary-password"
                  name="password"
                  type="password"
                  placeholder="Solo si deseas cambiarla"
                />
              </div>
              <div className="jworg-modal-actions">
                <button className="jworg-modal-secondary" type="button" onClick={() => setEditingSecretaryId(null)}>
                  Cancelar
                </button>
                <button className="jworg-primary-cta jworg-modal-primary" type="submit">
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
