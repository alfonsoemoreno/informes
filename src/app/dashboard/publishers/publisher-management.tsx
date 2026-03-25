"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AddCircleIcon,
  ChevronDownIcon,
  CloseIcon,
  GroupUsersIcon,
  PersonIcon,
  SearchIcon,
} from "@/components/superadmin/icons";
import { createPublisherAction } from "@/app/dashboard/publishers/actions";
import { getPublisherStatusLabel } from "@/lib/domain/labels";
import { publisherStatuses, type PublisherStatus } from "@/lib/domain/reporting";

type GroupOption = {
  id: string;
  name: string;
};

type PublisherItem = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  publisherCode: string | null;
  currentGroupName: string;
  currentStatus: PublisherStatus | null;
};

type PublisherManagementProps = {
  publishers: PublisherItem[];
  groups: GroupOption[];
  canManage: boolean;
  status: string | null;
  message: string | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusTone(status: PublisherStatus | null) {
  switch (status) {
    case "regular_pioneer":
      return "regular";
    case "auxiliary_pioneer":
      return "auxiliary";
    case "special_pioneer":
      return "special";
    default:
      return "publisher";
  }
}

export function PublisherManagement({
  publishers,
  groups,
  canManage,
  status,
  message,
}: PublisherManagementProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredPublishers = publishers.filter((publisher) => {
    const matchesQuery =
      query.length === 0 ||
      publisher.fullName.toLowerCase().includes(query.toLowerCase()) ||
      publisher.currentGroupName.toLowerCase().includes(query.toLowerCase()) ||
      (publisher.publisherCode ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "none" && publisher.currentStatus === null) ||
      publisher.currentStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const regularCount = publishers.filter((publisher) => publisher.currentStatus === "regular_pioneer").length;
  const auxiliaryCount = publishers.filter((publisher) => publisher.currentStatus === "auxiliary_pioneer").length;

  return (
    <div className="tenant-publishers-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Directorio</span>
          <h1>Gestion de Publicadores</h1>
          <p>
            Administre el registro y estado ministerial de los publicadores de la congregacion
            de manera centralizada.
          </p>
        </div>

        {canManage ? (
          <button className="tenant-primary-cta" type="button" onClick={() => setCreateOpen(true)}>
            <AddCircleIcon className="tenant-primary-cta-icon" />
            Nuevo Publicador
          </button>
        ) : null}
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="tenant-publisher-stats-grid">
        <article className="tenant-publisher-stat">
          <span>Total publicadores</span>
          <strong>{publishers.length}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Precursores regulares</span>
          <strong>{regularCount}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Auxiliares activos</span>
          <strong>{auxiliaryCount}</strong>
        </article>
        <article className="tenant-publisher-stat">
          <span>Grupos activos</span>
          <strong>{groups.length}</strong>
        </article>
      </section>

      <section className="tenant-filter-bar">
        <label className="tenant-search-field tenant-search-field-wide">
          <SearchIcon className="tenant-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar publicador..."
          />
        </label>

        <select
          className="tenant-compact-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="publisher">Publicador</option>
          <option value="auxiliary_pioneer">Precursor auxiliar</option>
          <option value="regular_pioneer">Precursor regular</option>
          <option value="special_pioneer">Precursor especial</option>
          <option value="none">Sin estado vigente</option>
        </select>
      </section>

      <section className="tenant-publishers-table-card">
        {filteredPublishers.length === 0 ? (
          <div className="empty-state">No hay publicadores que coincidan con la búsqueda actual.</div>
        ) : (
          <div className="tenant-users-table-wrap">
            <table className="tenant-users-table">
              <thead>
                <tr>
                  <th>Publicador</th>
                  <th>Grupo</th>
                  <th>Estado ministerial</th>
                  <th>Codigo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPublishers.map((publisher) => (
                  <tr key={publisher.id}>
                    <td>
                      <div className="tenant-user-cell">
                        <div className={`tenant-user-avatar-lg ${publisher.currentStatus ? "active" : "inactive"}`}>
                          {getInitials(publisher.fullName)}
                        </div>
                        <div className="tenant-user-cell-copy">
                          <strong>{publisher.fullName}</strong>
                          <span>{publisher.publisherCode ?? "Sin codigo interno"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tenant-publisher-group-chip">{publisher.currentGroupName}</span>
                    </td>
                    <td>
                      <div className={`tenant-publisher-status tone-${getStatusTone(publisher.currentStatus)}`}>
                        <span className="tenant-publisher-status-dot" />
                        <span>
                          {publisher.currentStatus
                            ? getPublisherStatusLabel(publisher.currentStatus)
                            : "Sin estado vigente"}
                        </span>
                      </div>
                    </td>
                    <td>{publisher.publisherCode ?? "Sin codigo"}</td>
                    <td>
                      <Link className="tenant-inline-link-button" href={`/dashboard/publishers/${publisher.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canManage && createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="tenant-create-user-modal" aria-label="Registrar nuevo publicador">
            <div className="tenant-create-user-modal-header">
              <div className="tenant-create-user-modal-heading">
                <div className="tenant-create-user-modal-mark">
                  <AddCircleIcon className="tenant-create-user-modal-mark-icon" />
                </div>
                <div>
                  <h2>Registrar Nuevo Publicador</h2>
                  <p>Complete la ficha inicial para incorporarlo al directorio.</p>
                </div>
              </div>
              <button
                className="tenant-create-user-modal-close"
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Cerrar"
              >
                <CloseIcon className="tenant-create-user-modal-close-icon" />
              </button>
            </div>

            <form action={createPublisherAction} className="tenant-create-user-form">
              <div className="tenant-create-user-two-columns">
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-firstName">Nombre</label>
                  <div className="tenant-modal-input-shell">
                    <PersonIcon className="tenant-modal-input-icon" />
                    <input id="publisher-firstName" name="firstName" placeholder="Nombre" required />
                  </div>
                </div>
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-lastName">Apellido</label>
                  <div className="tenant-modal-input-shell">
                    <PersonIcon className="tenant-modal-input-icon" />
                    <input id="publisher-lastName" name="lastName" placeholder="Apellido" required />
                  </div>
                </div>
              </div>

              <div className="tenant-create-user-two-columns">
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-code">Codigo interno</label>
                  <div className="tenant-modal-input-shell">
                    <PersonIcon className="tenant-modal-input-icon" />
                    <input id="publisher-code" name="publisherCode" placeholder="Opcional" />
                  </div>
                </div>
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-groupId">Grupo</label>
                  <div className="tenant-modal-input-shell">
                    <GroupUsersIcon className="tenant-modal-input-icon" />
                    <select id="publisher-groupId" name="groupId" defaultValue="" required>
                      <option value="" disabled>
                        Seleccionar...
                      </option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="tenant-modal-select-icon" />
                  </div>
                </div>
              </div>

              <div className="tenant-create-user-two-columns">
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-status">Tipo de publicador</label>
                  <div className="tenant-modal-input-shell">
                    <GroupUsersIcon className="tenant-modal-input-icon" />
                    <select id="publisher-status" name="status" defaultValue="publisher">
                      {publisherStatuses.map((publisherStatus) => (
                        <option key={publisherStatus} value={publisherStatus}>
                          {getPublisherStatusLabel(publisherStatus)}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="tenant-modal-select-icon" />
                  </div>
                </div>
                <div className="tenant-modal-field">
                  <label htmlFor="publisher-effectiveFrom">Vigencia desde</label>
                  <div className="tenant-modal-input-shell">
                    <PersonIcon className="tenant-modal-input-icon" />
                    <input
                      id="publisher-effectiveFrom"
                      name="effectiveFrom"
                      type="date"
                      defaultValue={todayIsoDate()}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="tenant-modal-field">
                <label htmlFor="publisher-notes">Observaciones iniciales</label>
                <div className="tenant-modal-input-shell">
                  <textarea id="publisher-notes" name="notes" className="tenant-modal-textarea" />
                </div>
              </div>

              <div className="tenant-create-user-modal-actions">
                <button
                  className="tenant-create-user-modal-secondary"
                  type="button"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancelar
                </button>
                <button className="tenant-create-user-modal-primary" type="submit">
                  Guardar publicador
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
