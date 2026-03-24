"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { preachingGroups, tenants } from "@/lib/db/schema";
import { tenantSlugExists } from "@/lib/admin/queries";

const DEFAULT_TENANT_TIMEZONE = "America/Santiago";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/admin/tenants?${searchParams.toString()}`);
}

const createTenantSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la congregacion es obligatorio."),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener minusculas, numeros y guiones."),
});

const updateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().trim().min(2, "El nombre de la congregacion es obligatorio."),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener minusculas, numeros y guiones."),
  isActive: z.boolean(),
});

export async function createTenantAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede crear congregaciones.");
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;

  if (await tenantSlugExists(data.slug)) {
    redirectWithMessage("error", "Ya existe una congregacion con ese slug.");
  }

  const db = getDb();
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: data.name,
      slug: data.slug,
      timezone: DEFAULT_TENANT_TIMEZONE,
    })
    .returning();

  await db.insert(preachingGroups).values({
    tenantId: tenant.id,
    name: "Grupo 1",
    code: "1",
    sortOrder: 1,
  });

  revalidatePath("/dashboard/admin/tenants");
  redirectWithMessage("success", "Congregacion creada correctamente.");
}

export async function updateTenantAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede editar congregaciones.");
  }

  const parsed = updateTenantSchema.safeParse({
    tenantId: formData.get("tenantId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const [existingTenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, data.tenantId))
    .limit(1);

  if (!existingTenant) {
    redirectWithMessage("error", "No se encontro la congregacion.");
  }

  if (existingTenant.slug !== data.slug && (await tenantSlugExists(data.slug))) {
    redirectWithMessage("error", "Ya existe otra congregacion con ese slug.");
  }

  await db
    .update(tenants)
    .set({
      name: data.name,
      slug: data.slug,
      timezone: existingTenant.timezone ?? DEFAULT_TENANT_TIMEZONE,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, data.tenantId));

  revalidatePath("/dashboard/admin/tenants");
  redirectWithMessage("success", "Congregacion actualizada correctamente.");
}
