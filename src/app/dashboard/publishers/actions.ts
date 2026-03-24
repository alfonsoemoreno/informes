"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import {
  preachingGroups,
  publisherGroupAssignments,
  publishers,
  publisherStatusAssignments,
} from "@/lib/db/schema";
import { canManagePublishers } from "@/lib/domain/permissions";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({
    status,
    message,
  });

  redirect(`/dashboard/publishers?${searchParams.toString()}`);
}

function redirectToPublisherDetails(
  publisherId: string,
  status: "error" | "success",
  message: string,
): never {
  const searchParams = new URLSearchParams({ status, message });
  redirect(`/dashboard/publishers/${publisherId}?${searchParams.toString()}`);
}

function getPreviousAssignmentEnd(effectiveFrom: Date) {
  return new Date(effectiveFrom.getTime() - 1);
}

const createPublisherSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio."),
  lastName: z.string().trim().min(1, "El apellido es obligatorio."),
  publisherCode: z.string().trim().optional(),
  groupId: z.string().uuid("Debes seleccionar un grupo."),
  status: z.enum(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"]),
  effectiveFrom: z.string().min(1, "La vigencia inicial es obligatoria."),
  notes: z.string().trim().optional(),
});

const changeGroupSchema = z.object({
  publisherId: z.string().uuid(),
  groupId: z.string().uuid("Debes seleccionar un grupo."),
  effectiveFrom: z.string().min(1, "La vigencia es obligatoria."),
  notes: z.string().trim().optional(),
});

const changeStatusSchema = z.object({
  publisherId: z.string().uuid(),
  status: z.enum(["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"]),
  effectiveFrom: z.string().min(1, "La vigencia es obligatoria."),
  notes: z.string().trim().optional(),
});

export async function createPublisherAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManagePublishers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar publicadores.");
  }

  const parsed = createPublisherSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    publisherCode: formData.get("publisherCode"),
    groupId: formData.get("groupId"),
    status: formData.get("status"),
    effectiveFrom: formData.get("effectiveFrom"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "error",
      parsed.error.issues[0]?.message ?? "Datos invalidos.",
    );
  }

  const data = parsed.data;

  const db = getDb();

  const [group] = await db
    .select()
    .from(preachingGroups)
    .where(
      and(
        eq(preachingGroups.id, data.groupId),
        eq(preachingGroups.tenantId, membership.tenantId),
        eq(preachingGroups.isActive, true),
      ),
    )
    .limit(1);

  if (!group) {
    redirectWithMessage(
      "error",
      "El grupo seleccionado no existe en el tenant activo.",
    );
  }

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const fullName = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  const [publisher] = await db
    .insert(publishers)
    .values({
      tenantId: membership.tenantId,
      firstName,
      lastName,
      fullName,
      publisherCode: data.publisherCode || null,
    })
    .returning();

  const effectiveFrom = new Date(`${data.effectiveFrom}T00:00:00.000Z`);

  await db.insert(publisherGroupAssignments).values({
    tenantId: membership.tenantId,
    publisherId: publisher.id,
    groupId: group.id,
    effectiveFrom,
    notes: data.notes || null,
  });

  await db.insert(publisherStatusAssignments).values({
    tenantId: membership.tenantId,
    publisherId: publisher.id,
    status: data.status,
    effectiveFrom,
    notes: data.notes || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/publishers");
  revalidatePath("/dashboard/reports");

  redirectWithMessage("success", "Publicador creado correctamente.");
}

export async function addPublisherGroupAssignmentAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManagePublishers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar publicadores.");
  }

  const parsed = changeGroupSchema.safeParse({
    publisherId: formData.get("publisherId"),
    groupId: formData.get("groupId"),
    effectiveFrom: formData.get("effectiveFrom"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const effectiveFrom = new Date(`${data.effectiveFrom}T00:00:00.000Z`);

  const [group] = await db
    .select()
    .from(preachingGroups)
    .where(
      and(
        eq(preachingGroups.id, data.groupId),
        eq(preachingGroups.tenantId, membership.tenantId),
        eq(preachingGroups.isActive, true),
      ),
    )
    .limit(1);

  if (!group) {
    redirectToPublisherDetails(
      data.publisherId,
      "error",
      "El grupo seleccionado no existe en el tenant activo.",
    );
  }

  const [currentOpenAssignment] = await db
    .select()
    .from(publisherGroupAssignments)
    .where(
      and(
        eq(publisherGroupAssignments.tenantId, membership.tenantId),
        eq(publisherGroupAssignments.publisherId, data.publisherId),
        isNull(publisherGroupAssignments.effectiveTo),
      ),
    )
    .orderBy(desc(publisherGroupAssignments.effectiveFrom))
    .limit(1);

  if (currentOpenAssignment) {
    await db
      .update(publisherGroupAssignments)
      .set({
        effectiveTo: getPreviousAssignmentEnd(effectiveFrom),
        updatedAt: new Date(),
      })
      .where(eq(publisherGroupAssignments.id, currentOpenAssignment.id));
  }

  await db.insert(publisherGroupAssignments).values({
    tenantId: membership.tenantId,
    publisherId: data.publisherId,
    groupId: group.id,
    effectiveFrom,
    notes: data.notes || null,
  });

  revalidatePath("/dashboard/publishers");
  revalidatePath(`/dashboard/publishers/${data.publisherId}`);
  revalidatePath("/dashboard/reports");

  redirectToPublisherDetails(data.publisherId, "success", "Grupo actualizado correctamente.");
}

export async function addPublisherStatusAssignmentAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canManagePublishers(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para administrar publicadores.");
  }

  const parsed = changeStatusSchema.safeParse({
    publisherId: formData.get("publisherId"),
    status: formData.get("status"),
    effectiveFrom: formData.get("effectiveFrom"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirectWithMessage("error", parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const data = parsed.data;
  const db = getDb();
  const effectiveFrom = new Date(`${data.effectiveFrom}T00:00:00.000Z`);

  const [currentOpenAssignment] = await db
    .select()
    .from(publisherStatusAssignments)
    .where(
      and(
        eq(publisherStatusAssignments.tenantId, membership.tenantId),
        eq(publisherStatusAssignments.publisherId, data.publisherId),
        isNull(publisherStatusAssignments.effectiveTo),
      ),
    )
    .orderBy(desc(publisherStatusAssignments.effectiveFrom))
    .limit(1);

  if (currentOpenAssignment) {
    await db
      .update(publisherStatusAssignments)
      .set({
        effectiveTo: getPreviousAssignmentEnd(effectiveFrom),
        updatedAt: new Date(),
      })
      .where(eq(publisherStatusAssignments.id, currentOpenAssignment.id));
  }

  await db.insert(publisherStatusAssignments).values({
    tenantId: membership.tenantId,
    publisherId: data.publisherId,
    status: data.status,
    effectiveFrom,
    notes: data.notes || null,
  });

  revalidatePath("/dashboard/publishers");
  revalidatePath(`/dashboard/publishers/${data.publisherId}`);
  revalidatePath("/dashboard/reports");

  redirectToPublisherDetails(
    data.publisherId,
    "success",
    "Tipo de publicador actualizado correctamente.",
  );
}
