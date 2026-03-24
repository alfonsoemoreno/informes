"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAppContext } from "@/lib/app-context";
import { getDb } from "@/lib/db";
import { monthlyReports } from "@/lib/db/schema";
import { canSubmitReports } from "@/lib/domain/permissions";
import {
  statusAutoMarksParticipation,
  statusRequiresHours,
} from "@/lib/domain/reporting";
import { resolvePublisherStateForMonth } from "@/lib/reporting/queries";

function redirectWithMessage(status: "error" | "success", message: string): never {
  const searchParams = new URLSearchParams({
    status,
    message,
  });

  redirect(`/dashboard/reports?${searchParams.toString()}`);
}

const createReportSchema = z.object({
  publisherId: z.string().uuid("Debes seleccionar un publicador."),
  reportYear: z.coerce.number().int().min(2020).max(2100),
  reportMonth: z.coerce.number().int().min(1).max(12),
  participated: z.boolean(),
  preachingHours: z.string().optional(),
  bibleStudies: z.coerce.number().int().min(0).max(1000),
  notes: z.string().trim().optional(),
});

export async function createMonthlyReportAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  if (!membership || !canSubmitReports(membership.role)) {
    redirectWithMessage("error", "No tienes permisos para cargar informes.");
  }

  const parsed = createReportSchema.safeParse({
    publisherId: formData.get("publisherId"),
    reportYear: formData.get("reportYear"),
    reportMonth: formData.get("reportMonth"),
    participated: formData.get("participated") === "on",
    preachingHours: formData.get("preachingHours"),
    bibleStudies: formData.get("bibleStudies"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "error",
      parsed.error.issues[0]?.message ?? "Datos invalidos.",
    );
  }

  const data = parsed.data;
  const { publisherId, reportYear, reportMonth, bibleStudies } = data;

  const resolved = await resolvePublisherStateForMonth({
    tenantId: membership.tenantId,
    publisherId,
    year: reportYear,
    month: reportMonth,
  });

  if (!resolved) {
    redirectWithMessage(
      "error",
      "No existe un grupo y tipo de publicador vigentes para ese publicador en el mes informado.",
    );
  }

  if (
    (membership.role === "group_overseer" || membership.role === "group_assistant") &&
    membership.groupId &&
    resolved.group.id !== membership.groupId
  ) {
    redirectWithMessage(
      "error",
      "Solo puedes cargar informes del grupo asociado a tu usuario.",
    );
  }

  const requiresHours = statusRequiresHours(resolved.status);
  const autoParticipates = statusAutoMarksParticipation(resolved.status);
  const participated = autoParticipates ? true : data.participated;

  const preachingHours =
    data.preachingHours && data.preachingHours.trim() !== ""
      ? Number(data.preachingHours)
      : null;

  if (requiresHours && (preachingHours === null || Number.isNaN(preachingHours))) {
    redirectWithMessage(
      "error",
      "Las horas son obligatorias para precursores auxiliares, regulares y especiales.",
    );
  }

  if (!requiresHours && preachingHours !== null) {
    redirectWithMessage(
      "error",
      "Los publicadores no deben informar horas en este formulario.",
    );
  }

  const db = getDb();

  const existing = await db
    .select({ id: monthlyReports.id })
    .from(monthlyReports)
    .where(
      and(
        eq(monthlyReports.tenantId, membership.tenantId),
        eq(monthlyReports.publisherId, publisherId),
        eq(monthlyReports.reportYear, reportYear),
        eq(monthlyReports.reportMonth, reportMonth),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    redirectWithMessage(
      "error",
      "Ya existe un informe para ese publicador en el mes y anio seleccionados.",
    );
  }

  await db.insert(monthlyReports).values({
    tenantId: membership.tenantId,
    publisherId,
    publisherStatus: resolved.status,
    groupId: resolved.group.id,
    reportYear,
    reportMonth,
    participated,
    preachingHours: preachingHours === null ? null : String(preachingHours),
    bibleStudies,
    notes: data.notes || null,
    submittedByTenantUserId: membership.tenantUserId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");

  redirectWithMessage("success", "Informe mensual guardado correctamente.");
}
