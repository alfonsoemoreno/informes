"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { preachingGroups } from "@/lib/db/schema";
import { canManageGroups } from "@/lib/domain/permissions";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/groups?${searchParams.toString()}`);
}

export async function createGroupAction() {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManageGroups(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar grupos.");
  }

  const db = getDb();
  const [aggregate] = await db
    .select({
      maxSortOrder: sql<number>`coalesce(max(${preachingGroups.sortOrder}), 0)`,
    })
    .from(preachingGroups)
    .where(eq(preachingGroups.tenantId, membership.tenantId))
    .limit(1);

  let nextGroupNumber = (aggregate?.maxSortOrder ?? 0) + 1;

  while (true) {
    const [existing] = await db
      .select({ id: preachingGroups.id })
      .from(preachingGroups)
      .where(
        and(
          eq(preachingGroups.tenantId, membership.tenantId),
          eq(preachingGroups.sortOrder, nextGroupNumber),
        ),
      )
      .orderBy(desc(preachingGroups.createdAt))
      .limit(1);

    if (!existing) {
      break;
    }

    nextGroupNumber += 1;
  }

  await db.insert(preachingGroups).values({
    tenantId: membership.tenantId,
    name: `Grupo ${nextGroupNumber}`,
    code: String(nextGroupNumber),
    sortOrder: nextGroupNumber,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/publishers");

  redirectWithMessage("success", "Grupo creado correctamente.");
}
