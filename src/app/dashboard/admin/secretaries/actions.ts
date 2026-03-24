"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getAuthServer } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { findAppUserByEmail } from "@/lib/admin/queries";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/admin/secretaries?${searchParams.toString()}`);
}

const createSecretarySchema = z.object({
  displayName: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("Debes ingresar un correo valido."),
  password: z.string().min(8, "La clave inicial debe tener al menos 8 caracteres."),
});

const updateSecretarySchema = z.object({
  appUserId: z.string().uuid(),
  displayName: z.string().trim().min(2, "El nombre es obligatorio."),
  password: z.string().optional(),
});

export async function createSecretaryAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede crear secretarios.");
  }

  const parsed = createSecretarySchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const existing = await findAppUserByEmail(data.email);

  if (existing) {
    redirectWithMessage("error", "Ya existe un usuario con ese correo.");
  }

  const authServer = await getAuthServer();
  const result = await authServer.admin.createUser({
    email: data.email,
    password: data.password,
    name: data.displayName,
  });

  if (result.error || !result.data?.user) {
    redirectWithMessage(
      "error",
      result.error?.message ?? "No fue posible crear el secretario en Neon Auth.",
    );
  }

  await db.insert(appUsers).values({
    authUserId: result.data.user.id,
    email: result.data.user.email,
    displayName: result.data.user.name,
    userType: "secretary",
    isSuperadmin: false,
  });

  revalidatePath("/dashboard/admin/secretaries");
  revalidatePath("/dashboard/admin/assignments");
  redirectWithMessage("success", "Secretario creado correctamente.");
}

export async function updateSecretaryAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede actualizar secretarios.");
  }

  const parsed = updateSecretarySchema.safeParse({
    appUserId: formData.get("appUserId"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const [appUser] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, data.appUserId))
    .limit(1);

  if (!appUser) {
    redirectWithMessage("error", "No se encontro el secretario.");
  }

  const authServer = await getAuthServer();
  const updateResult = await authServer.admin.updateUser({
    userId: appUser.authUserId,
    data: {
      name: data.displayName,
    },
  });

  if (updateResult.error) {
    redirectWithMessage(
      "error",
      updateResult.error.message ?? "No fue posible actualizar el nombre del secretario.",
    );
  }

  if (data.password && data.password.trim().length > 0) {
    const passwordResult = await authServer.admin.setUserPassword({
      userId: appUser.authUserId,
      newPassword: data.password,
    });

    if (passwordResult.error) {
      redirectWithMessage(
        "error",
        passwordResult.error.message ?? "No fue posible actualizar la clave del secretario.",
      );
    }
  }

  await db
    .update(appUsers)
    .set({
      displayName: data.displayName,
      userType: "secretary",
      updatedAt: new Date(),
    })
    .where(eq(appUsers.id, data.appUserId));

  revalidatePath("/dashboard/admin/secretaries");
  revalidatePath("/dashboard/admin/assignments");
  redirectWithMessage("success", "Secretario actualizado correctamente.");
}
