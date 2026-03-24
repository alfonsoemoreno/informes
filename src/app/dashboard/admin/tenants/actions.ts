"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { preachingGroups, tenants } from "@/lib/db/schema";
import { tenantSlugExists } from "@/lib/admin/queries";

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
  timezone: z.string().trim().min(3, "La zona horaria es obligatoria."),
  defaultGroupName: z.string().trim().min(2, "Debes ingresar al menos un grupo inicial."),
});

export async function createTenantAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede crear congregaciones.");
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
    defaultGroupName: formData.get("defaultGroupName"),
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
      timezone: data.timezone,
    })
    .returning();

  await db.insert(preachingGroups).values({
    tenantId: tenant.id,
    name: data.defaultGroupName,
    sortOrder: 1,
  });

  revalidatePath("/dashboard/admin/tenants");
  redirectWithMessage("success", "Congregacion creada correctamente.");
}
