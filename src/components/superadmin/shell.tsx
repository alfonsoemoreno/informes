"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import {
  AccountCircleIcon,
  ApartmentIcon,
  AssignmentIcon,
  BadgeIcon,
  SettingsIcon,
} from "@/components/superadmin/icons";

const navItems = [
  {
    href: "/dashboard/admin/tenants",
    label: "Congregaciones",
    shortLabel: "Congregacion",
    icon: ApartmentIcon,
  },
  {
    href: "/dashboard/admin/secretaries",
    label: "Secretarios",
    shortLabel: "Secretarios",
    icon: BadgeIcon,
  },
  {
    href: "/dashboard/admin/assignments",
    label: "Asignaciones",
    shortLabel: "Asignaciones",
    icon: AssignmentIcon,
  },
];

export function SuperadminShell({
  userLabel,
  children,
}: {
  userLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <div className="superadmin-shell">
      <aside className="superadmin-sidebar">
        <div className="superadmin-sidebar-inner">
          <div className="superadmin-brand">
            <strong>Super Admin</strong>
            <span>Panel de control</span>
          </div>

          <nav className="superadmin-nav">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? "superadmin-nav-link active" : "superadmin-nav-link"}
                >
                  <Icon className="superadmin-nav-icon" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="superadmin-sidebar-footer">
            <Link className="superadmin-settings-link" href="/account/settings">
              <SettingsIcon className="superadmin-settings-icon" />
              <span>Configuracion</span>
            </Link>

            <div className="superadmin-user-card">
              <div className="superadmin-user-badge">
                {userLabel.slice(0, 2).toUpperCase()}
              </div>
              <div className="superadmin-user-copy">
                <strong>{userLabel}</strong>
                <button
                  className="superadmin-signout-link"
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="superadmin-main">
        <header className="superadmin-topbar">
          <div className="superadmin-topbar-brand">
            <strong>Informes de Predicacion</strong>
          </div>

          <nav className="superadmin-topnav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname.startsWith(item.href) ? "superadmin-topnav-link active" : "superadmin-topnav-link"}
              >
                {item.shortLabel}
              </Link>
            ))}
          </nav>

          <div className="superadmin-topbar-user">
            <div className="superadmin-user-menu">
              <Link
                className="superadmin-account-button"
                href="/account/settings"
                aria-label="Cuenta"
              >
                <AccountCircleIcon className="superadmin-account-icon" />
              </Link>
            </div>
          </div>
        </header>

        <div className="superadmin-content">{children}</div>
      </main>
    </div>
  );
}
