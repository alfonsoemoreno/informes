"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3.75A2.25 2.25 0 0 0 4.75 6v12A2.25 2.25 0 0 0 7 20.25h10A2.25 2.25 0 0 0 19.25 18V9.31a2.25 2.25 0 0 0-.66-1.59l-3.31-3.31a2.25 2.25 0 0 0-1.59-.66H7Zm6 1.58c.18.04.35.13.48.26l3.18 3.18c.13.13.22.3.26.48H14.5A1.5 1.5 0 0 1 13 7.75V5.33Zm-5.5 6.92a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LoginArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.53 4.97a.75.75 0 0 1 1.06 0l6.5 6.5a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 1 1-1.06-1.06l5.22-5.22H4.75a.75.75 0 0 1 0-1.5h11l-5.22-5.22a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setPending(true);
    setError(null);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (result.error) {
      setPending(false);
      setError(result.error.message ?? "No fue posible iniciar sesión.");
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="login-brand-mark">
          <DocumentIcon />
        </div>
        <h1>Informes de Predicacion</h1>
        <p>Ingresa a tu cuenta para continuar</p>
      </div>

      <section className="login-card" aria-label="Ingreso al sistema">
        <form
          action={handleSubmit}
          className="login-form"
        >
          <div className="login-field">
            <label htmlFor="email">Correo electronico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <div className="login-field-row">
              <label htmlFor="password">Contrasena</label>
              <span className="login-inline-help">Contacta a tu secretario</span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="login-message error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={pending}>
            <span>{pending ? "Ingresando..." : "Ingresar"}</span>
            <LoginArrowIcon />
          </button>
        </form>

        <div className="login-divider" />

        <div className="login-support-copy">
          <p>
            Si no tienes acceso o necesitas ayuda para entrar, contacta al secretario
            de tu congregacion.
          </p>
        </div>
      </section>

      <div className="login-secondary-actions" aria-hidden="true">
        <button type="button">Espanol</button>
        <span>•</span>
        <button type="button">Ayuda</button>
        <span>•</span>
        <button type="button">Privacidad</button>
      </div>

      <footer className="login-footer">
        <span className="login-footer-dot" />
        Congregacion
      </footer>
    </div>
  );
}
