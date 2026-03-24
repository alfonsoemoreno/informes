"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { appUsers, tenantUsers } from "@/lib/db/schema";
import { findTenantUser } from "@/lib/admin/queries";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/admin/assignments?${searchParams.toString()}`);
}

const assignSecretarySchema = z.object({
  tenantId: z.string().uuid(),
  appUserId: z.string().uuid(),
});

export async function assignSecretaryToTenantAction(formData: FormData) {
  const context = await getCurrentAppContext();

  if (!context.appUser?.isSuperadmin) {
    redirectWithMessage("error", "Solo un superadmin puede asignar secretarios.");
  }

  const parsed = assignSecretarySchema.safeParse({
    tenantId: formData.get("tenantId"),
    appUserId: formData.get("appUserId"),
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

  if (!appUser || appUser.userType !== "secretary") {
    redirectWithMessage("error", "Solo puedes asociar usuarios creados como secretario.");
  }

  await db
    .update(tenantUsers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tenantUsers.tenantId, data.tenantId),
        eq(tenantUsers.role, "secretary"),
        ne(tenantUsers.appUserId, data.appUserId),
      ),
    );

  await db
    .update(tenantUsers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tenantUsers.appUserId, data.appUserId),
        eq(tenantUsers.role, "secretary"),
        ne(tenantUsers.tenantId, data.tenantId),
      ),
    );

  const existingMembership = await findTenantUser({
    tenantId: data.tenantId,
    appUserId: data.appUserId,
  });

  if (existingMembership) {
    await db
      .update(tenantUsers)
      .set({
        role: "secretary",
        groupId: null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tenantUsers.id, existingMembership.id));
  } else {
    await db.insert(tenantUsers).values({
      tenantId: data.tenantId,
      appUserId: data.appUserId,
      role: "secretary",
      groupId: null,
      isActive: true,
    });
  }

  revalidatePath("/dashboard/admin/tenants");
  revalidatePath("/dashboard/admin/secretaries");
  revalidatePath("/dashboard/admin/assignments");
  redirectWithMessage("success", "Secretario asociado correctamente a la congregación.");
}
