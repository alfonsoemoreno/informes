"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { preachingGroups } from "@/lib/db/schema";
import { canManageGroups } from "@/lib/domain/permissions";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/groups?${searchParams.toString()}`);
}

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "El nombre del grupo es obligatorio."),
  code: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function createGroupAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManageGroups(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar grupos.");
  }

  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();

  const [existing] = await db
    .select({ id: preachingGroups.id })
    .from(preachingGroups)
    .where(
      and(
        eq(preachingGroups.tenantId, membership.tenantId),
        eq(preachingGroups.name, data.name),
      ),
    )
    .limit(1);

  if (existing) {
    redirectWithMessage("error", "Ya existe un grupo con ese nombre en la congregacion.");
  }

  await db.insert(preachingGroups).values({
    tenantId: membership.tenantId,
    name: data.name,
    code: data.code || null,
    sortOrder: data.sortOrder,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/publishers");

  redirectWithMessage("success", "Grupo creado correctamente.");
}
