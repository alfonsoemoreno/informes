"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getAuthServer } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { appUsers, tenantUsers } from "@/lib/db/schema";
import { canManageTenantUsers } from "@/lib/domain/permissions";
import { findAppUserByEmail, findTenantUser, findTenantUserById } from "@/lib/admin/queries";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/users?${searchParams.toString()}`);
}

const createTenantUserSchema = z
  .object({
    email: z.string().trim().email("Debes ingresar un correo valido."),
    displayName: z.string().trim().min(2, "El nombre es obligatorio."),
    password: z.string().min(8, "La clave inicial debe tener al menos 8 caracteres."),
    role: z.enum(["secretary", "elder", "group_overseer", "group_assistant"]),
    groupId: z.string().uuid().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      (data.role === "group_overseer" || data.role === "group_assistant") &&
      (!data.groupId || data.groupId.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["groupId"],
        message: "Superintendentes y auxiliares deben estar asociados a un grupo.",
      });
    }
  });

export async function createTenantUserAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManageTenantUsers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar usuarios del tenant.");
  }

  const parsed = createTenantUserSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    role: formData.get("role"),
    groupId: formData.get("groupId"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();

  let localAppUser = await findAppUserByEmail(data.email);

  if (!localAppUser) {
    const authServer = await getAuthServer();
    const result = await authServer.admin.createUser({
      email: data.email,
      password: data.password,
      name: data.displayName,
    });

    if (result.error || !result.data?.user) {
      redirectWithMessage(
        "error",
        result.error?.message ?? "No fue posible crear el usuario en Neon Auth.",
      );
    }

    const [createdUser] = await db
      .insert(appUsers)
      .values({
        authUserId: result.data.user.id,
        email: result.data.user.email,
        displayName: result.data.user.name,
      })
      .returning();

    localAppUser = createdUser;
  }

  const existingMembership = await findTenantUser({
    tenantId: membership.tenantId,
    appUserId: localAppUser.id,
  });

  if (existingMembership) {
    await db
      .update(tenantUsers)
      .set({
        role: data.role,
        groupId: data.groupId || null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tenantUsers.id, existingMembership.id));
  } else {
    await db.insert(tenantUsers).values({
      tenantId: membership.tenantId,
      appUserId: localAppUser.id,
      role: data.role,
      groupId: data.groupId || null,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");

  redirectWithMessage("success", "Usuario del tenant guardado correctamente.");
}

const updateTenantUserSchema = z
  .object({
    tenantUserId: z.string().uuid(),
    role: z.enum(["secretary", "elder", "group_overseer", "group_assistant"]),
    groupId: z.string().uuid().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      (data.role === "group_overseer" || data.role === "group_assistant") &&
      (!data.groupId || data.groupId.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["groupId"],
        message: "Superintendentes y auxiliares deben estar asociados a un grupo.",
      });
    }
  });

const toggleTenantUserSchema = z.object({
  tenantUserId: z.string().uuid(),
});

export async function updateTenantUserMembershipAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManageTenantUsers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar usuarios del tenant.");
  }

  const parsed = updateTenantUserSchema.safeParse({
    tenantUserId: formData.get("tenantUserId"),
    role: formData.get("role"),
    groupId: formData.get("groupId"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const tenantUser = await findTenantUserById({
    tenantId: membership.tenantId,
    tenantUserId: data.tenantUserId,
  });

  if (!tenantUser) {
    redirectWithMessage("error", "No se encontro el usuario del tenant.");
  }

  await db
    .update(tenantUsers)
    .set({
      role: data.role,
      groupId: data.groupId || null,
      updatedAt: new Date(),
    })
    .where(eq(tenantUsers.id, data.tenantUserId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/reports");

  redirectWithMessage("success", "Asignacion de usuario actualizada correctamente.");
}

export async function toggleTenantUserActiveAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManageTenantUsers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar usuarios del tenant.");
  }

  const parsed = toggleTenantUserSchema.safeParse({
    tenantUserId: formData.get("tenantUserId"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", "Solicitud invalida.");
  }

  const data = parsed.data;
  const db = getDb();
  const tenantUser = await findTenantUserById({
    tenantId: membership.tenantId,
    tenantUserId: data.tenantUserId,
  });

  if (!tenantUser) {
    redirectWithMessage("error", "No se encontro el usuario del tenant.");
  }

  if (tenantUser.id === membership.tenantUserId) {
    redirectWithMessage("error", "No puedes desactivar tu propia asignacion activa.");
  }

  await db
    .update(tenantUsers)
    .set({
      isActive: !tenantUser.isActive,
      updatedAt: new Date(),
    })
    .where(eq(tenantUsers.id, tenantUser.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");

  redirectWithMessage(
    "success",
    tenantUser.isActive ? "Usuario desactivado correctamente." : "Usuario reactivado correctamente.",
  );
}
