"use client";

import { useState } from "react";
import {
  AddCircleIcon,
  ChevronDownIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  GroupUsersIcon,
  LockIcon,
  MailIcon,
  PersonIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/superadmin/icons";
import {
  createTenantUserAction,
  toggleTenantUserActiveAction,
  updateTenantUserMembershipAction,
} from "@/app/dashboard/users/actions";
import { getRoleLabel } from "@/lib/domain/labels";
import { tenantRoles, type TenantRole } from "@/lib/domain/reporting";

type GroupOption = {
  id: string;
  name: string;
};

type TenantUserItem = {
  tenantUserId: string;
  role: TenantRole;
  isActive: boolean;
  email: string;
  displayName: string;
  groupName: string | null;
  groupId: string | null;
};

type UserManagementProps = {
  tenantName: string;
  users: TenantUserItem[];
  groups: GroupOption[];
  canManage: boolean;
  status: string | null;
  message: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserManagement({
  tenantName,
  users,
  groups,
  canManage,
  status,
  message,
}: UserManagementProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const editingUser = users.find((user) => user.tenantUserId === editingUserId) ?? null;

  const filteredUsers = users.filter((user) => {
    const matchesQuery =
      query.length === 0 ||
      user.displayName.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      (user.groupName ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesQuery && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="tenant-users-page">
      <section className="tenant-page-header">
        <div className="tenant-page-heading">
          <span className="tenant-page-eyebrow">Administracion</span>
          <h1>Gestion de Usuarios</h1>
          <p>
            Administra el acceso, los roles y la pertenencia a grupos de todos los
            miembros de {tenantName} desde un panel centralizado.
          </p>
        </div>

        <div className="tenant-page-header-actions">
          <div className="tenant-stat-card">
            <div className="tenant-stat-icon">
              <GroupUsersIcon className="tenant-stat-icon-svg" />
            </div>
            <div>
              <p className="tenant-stat-value">{users.length}</p>
              <p className="tenant-stat-label">Total usuarios</p>
            </div>
          </div>

          {canManage ? (
            <button className="tenant-primary-cta" type="button" onClick={() => setCreateOpen(true)}>
              <AddCircleIcon className="tenant-primary-cta-icon" />
              Nuevo usuario
            </button>
          ) : null}
        </div>
      </section>

      {message ? (
        <section className={status === "success" ? "success-banner" : "error-banner"}>
          {message}
        </section>
      ) : null}

      <section className="tenant-filter-bar">
        <label className="tenant-search-field tenant-search-field-wide">
          <SearchIcon className="tenant-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, correo o grupo..."
          />
        </label>

        <select
          className="tenant-compact-select"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">Todos los roles</option>
          {tenantRoles.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>

        <select
          className="tenant-compact-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </section>

      <section className="tenant-users-table-card">
        <div className="tenant-users-summary-strip">
          <span>{activeCount} activos</span>
          <span>{inactiveCount} inactivos</span>
          <span>{filteredUsers.length} visibles</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">No hay usuarios que coincidan con los filtros actuales.</div>
        ) : (
          <div className="tenant-users-table-wrap">
            <table className="tenant-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  {canManage ? <th>Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.tenantUserId}>
                    <td>
                      <div className="tenant-user-cell">
                        <div className={`tenant-user-avatar-lg ${user.isActive ? "active" : "inactive"}`}>
                          {getInitials(user.displayName)}
                        </div>
                        <div className="tenant-user-cell-copy">
                          <strong>{user.displayName}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tenant-role-chip">{getRoleLabel(user.role)}</span>
                    </td>
                    <td>{user.groupName ?? "Sin grupo"}</td>
                    <td>
                      <span className={user.isActive ? "jworg-status active" : "jworg-status inactive"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {canManage ? (
                      <td>
                        <div className="tenant-row-actions">
                          <button
                            className="tenant-icon-action"
                            type="button"
                            onClick={() => setEditingUserId(user.tenantUserId)}
                            aria-label={`Editar ${user.displayName}`}
                          >
                            <EditIcon className="tenant-row-action-icon" />
                          </button>

                          <form action={toggleTenantUserActiveAction}>
                            <input type="hidden" name="tenantUserId" value={user.tenantUserId} />
                            <button className="tenant-inline-action" type="submit">
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
          </div>
        )}
      </section>

      {canManage && createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="tenant-create-user-modal" aria-label="Registrar nuevo usuario">
            <div className="tenant-create-user-modal-header">
              <div className="tenant-create-user-modal-heading">
                <div className="tenant-create-user-modal-mark">
                  <AddCircleIcon className="tenant-create-user-modal-mark-icon" />
                </div>
                <div>
                  <h2>Registrar Nuevo Usuario</h2>
                  <p>Complete los datos para habilitar el acceso.</p>
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

            <form action={createTenantUserAction} className="tenant-create-user-form">
              <div className="tenant-create-user-form-grid">
                <div className="tenant-modal-field">
                  <label htmlFor="create-displayName">Nombre completo</label>
                  <div className="tenant-modal-input-shell">
                    <PersonIcon className="tenant-modal-input-icon" />
                    <input
                      id="create-displayName"
                      name="displayName"
                      placeholder="Ej. Juan Perez"
                      required
                    />
                  </div>
                </div>

                <div className="tenant-modal-field">
                  <label htmlFor="create-email">Correo electronico</label>
                  <div className="tenant-modal-input-shell">
                    <MailIcon className="tenant-modal-input-icon" />
                    <input
                      id="create-email"
                      name="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="tenant-modal-field">
                  <label htmlFor="create-password">Clave inicial</label>
                  <div className="tenant-modal-input-shell">
                    <LockIcon className="tenant-modal-input-icon" />
                    <input
                      id="create-password"
                      name="password"
                      type={showCreatePassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <button
                      className="tenant-modal-input-trailing"
                      type="button"
                      onClick={() => setShowCreatePassword((value) => !value)}
                      aria-label={showCreatePassword ? "Ocultar clave" : "Mostrar clave"}
                    >
                      <EyeIcon className="tenant-modal-input-trailing-icon" />
                    </button>
                  </div>
                </div>

                <div className="tenant-create-user-two-columns">
                  <div className="tenant-modal-field">
                    <label htmlFor="create-role">Rol</label>
                    <div className="tenant-modal-input-shell">
                      <ShieldIcon className="tenant-modal-input-icon" />
                      <select id="create-role" name="role" defaultValue="elder">
                        {tenantRoles.map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="tenant-modal-select-icon" />
                    </div>
                  </div>

                  <div className="tenant-modal-field">
                    <label htmlFor="create-group">Grupo asociado</label>
                    <div className="tenant-modal-input-shell">
                      <GroupUsersIcon className="tenant-modal-input-icon" />
                      <select id="create-group" name="groupId" defaultValue="">
                        <option value="">Seleccionar...</option>
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
                  Crear Acceso de Usuario
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {canManage && editingUser ? (
        <div className="modal-backdrop" role="presentation">
          <section className="panel modal-card jworg-modal-card tenant-users-modal">
            <div className="jworg-modal-header">
              <div className="jworg-modal-heading">
                <span className="tenant-page-eyebrow">Usuarios</span>
                <h2>Editar usuario</h2>
              </div>
              <button className="jworg-modal-close" type="button" onClick={() => setEditingUserId(null)}>
                Cerrar
              </button>
            </div>

            <form action={updateTenantUserMembershipAction} className="form-grid jworg-modal-form">
              <input type="hidden" name="tenantUserId" value={editingUser.tenantUserId} />

              <div className="form-grid two-columns">
                <div className="field">
                  <label>Usuario</label>
                  <input value={editingUser.displayName} readOnly />
                </div>
                <div className="field">
                  <label>Correo</label>
                  <input value={editingUser.email} readOnly />
                </div>
              </div>

              <div className="form-grid two-columns">
                <div className="field">
                  <label htmlFor="edit-role">Rol</label>
                  <select id="edit-role" name="role" defaultValue={editingUser.role}>
                    {tenantRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="edit-group">Grupo</label>
                  <select id="edit-group" name="groupId" defaultValue={editingUser.groupId ?? ""}>
                    <option value="">Sin grupo</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="jworg-modal-actions">
                <button className="jworg-modal-secondary" type="button" onClick={() => setEditingUserId(null)}>
                  Cancelar
                </button>
                <button className="tenant-primary-cta tenant-primary-cta-small" type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
