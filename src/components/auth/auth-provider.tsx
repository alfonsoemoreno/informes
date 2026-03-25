"use client";

import { NeonAuthUIProvider, type AuthLocalization } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";

type AuthProviderProps = {
  children: React.ReactNode;
};

const authLocalizationEs: Partial<AuthLocalization> = {
  ACCOUNT: "Cuenta",
  SETTINGS: "Configuracion",
  SECURITY: "Seguridad",
  EMAIL: "Correo electronico",
  EMAIL_DESCRIPTION: "Ingresa el correo que quieres usar para iniciar sesion.",
  NAME: "Nombre",
  NAME_DESCRIPTION: "Ingresa tu nombre completo o un nombre visible.",
  CHANGE_PASSWORD: "Cambiar contrasena",
  CHANGE_PASSWORD_DESCRIPTION: "Ingresa tu contrasena actual y una nueva contrasena.",
  CURRENT_PASSWORD: "Contrasena actual",
  NEW_PASSWORD: "Nueva contrasena",
  CONFIRM_PASSWORD: "Confirmar contrasena",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  CANCEL: "Cancelar",
  SAVE: "Guardar",
  SESSIONS: "Sesiones",
  SESSIONS_DESCRIPTION: "Administra tus sesiones activas y revoca accesos.",
  CURRENT_SESSION: "Sesion actual",
  PASSKEYS: "Claves de acceso",
  PASSKEYS_DESCRIPTION: "Administra tus claves de acceso para un inicio de sesion seguro.",
  API_KEYS: "Claves API",
  API_KEYS_DESCRIPTION: "Administra tus claves API para acceso seguro.",
  DELETE_ACCOUNT: "Eliminar cuenta",
  DELETE_ACCOUNT_DESCRIPTION:
    "Elimina permanentemente tu cuenta y todo su contenido. Esta accion no se puede deshacer.",
  SIGN_OUT: "Cerrar sesion",
  UPDATED_SUCCESSFULLY: "Actualizado correctamente.",
  REQUEST_FAILED: "La solicitud fallo.",
  IS_REQUIRED: "es obligatorio",
  IS_INVALID: "no es valido",
  SESSION_EXPIRED: "Tu sesion ha expirado.",
};

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/dashboard"
      localization={authLocalizationEs}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
