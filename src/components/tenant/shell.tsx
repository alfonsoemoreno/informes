"use client";

import Link from "next/link";
import { startTransition, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import type { TenantRole } from "@/lib/domain/reporting";
import { getRoleLabel } from "@/lib/domain/labels";
import {
  AccountCircleIcon,
  ApartmentIcon,
  BookIcon,
  DashboardIcon,
  GroupUsersIcon,
  HubIcon,
  LogoutIcon,
  MenuIcon,
  ReportsIcon,
  SettingsIcon,
} from "@/components/superadmin/icons";

const navItems: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard", label: "Resumen", icon: DashboardIcon },
  { href: "/dashboard/users", label: "Usuarios", icon: GroupUsersIcon },
  { href: "/dashboard/groups", label: "Grupos", icon: HubIcon },
  { href: "/dashboard/publishers", label: "Publicadores", icon: BookIcon },
  { href: "/dashboard/reports", label: "Informes", icon: ReportsIcon },
];

export function TenantShell({
  tenantName,
  userLabel,
  userEmail,
  role,
  children,
}: {
  tenantName: string;
  userLabel: string;
  userEmail: string;
  role: TenantRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await authClient.signOut();
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleNavigate() {
    setIsMenuOpen(false);
  }

  return (
    <div className="tenant-shell">
      <aside className={`tenant-sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
        <div className="tenant-sidebar-inner">
          <div className="tenant-brand">
            <div className="tenant-brand-mark">
              <ApartmentIcon className="tenant-brand-icon" />
            </div>
            <div>
              <p className="tenant-brand-title">{tenantName}</p>
              <p className="tenant-brand-subtitle">Unidad administrativa</p>
            </div>
          </div>

          <nav className="tenant-nav">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? "tenant-nav-link active" : "tenant-nav-link"}
                  onClick={handleNavigate}
                >
                  <Icon className="tenant-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="tenant-sidebar-footer">
            <Link className="tenant-footer-link" href="/account/settings" onClick={handleNavigate}>
              <SettingsIcon className="tenant-footer-icon" />
              <span>Configuracion</span>
            </Link>

            <button className="tenant-footer-link tenant-logout-link" type="button" onClick={handleSignOut}>
              <LogoutIcon className="tenant-footer-icon" />
              <span>{isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="tenant-main">
        <header className="tenant-topbar">
          <div className="tenant-topbar-brand tenant-topbar-brand-row">
            <button
              className="shell-mobile-toggle"
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Abrir menu"
            >
              <MenuIcon className="shell-mobile-toggle-icon" />
            </button>
            <strong>Congregation Admin</strong>
          </div>

          <div className="tenant-topbar-actions">
            <Link className="tenant-account-button" href="/account/settings" aria-label="Cuenta">
              <AccountCircleIcon className="tenant-account-icon" />
            </Link>

            <div className="tenant-user-chip">
              <div className="tenant-user-avatar">{userLabel.slice(0, 2).toUpperCase()}</div>
              <div className="tenant-user-copy">
                <strong>{userLabel}</strong>
                <span>
                  {getRoleLabel(role)} · {userEmail}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="tenant-content">{children}</div>
      </main>

      {isMenuOpen ? (
        <button
          className="shell-mobile-backdrop"
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}
    </div>
  );
}
