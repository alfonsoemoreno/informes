"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function redirectWithMessage(input: {
  status: "error" | "success";
  message: string;
  month?: string;
  year?: string;
  groupId?: string;
}): never {
  const searchParams = new URLSearchParams({
    status: input.status,
    message: input.message,
  });

  if (input.month) {
    searchParams.set("month", input.month);
  }

  if (input.year) {
    searchParams.set("year", input.year);
  }

  if (input.groupId) {
    searchParams.set("groupId", input.groupId);
  }

  redirect(`/dashboard/reports?${searchParams.toString()}`);
}

const bulkReportSchema = z.object({
  groupId: z.string().uuid("Debes seleccionar un grupo."),
  reportYear: z.coerce.number().int().min(2020).max(2100),
  reportMonth: z.coerce.number().int().min(1).max(12),
});

export async function saveGroupMonthlyReportsAction(formData: FormData) {
  const context = await getCurrentAppContext();
  const membership = context.activeMembership;

  const basePayload = {
    groupId: String(formData.get("groupId") ?? ""),
    reportYear: String(formData.get("reportYear") ?? ""),
    reportMonth: String(formData.get("reportMonth") ?? ""),
  };

  if (!membership || !canSubmitReports(membership.role)) {
    redirectWithMessage({
      status: "error",
      message: "No tienes permisos para cargar informes.",
      month: basePayload.reportMonth,
      year: basePayload.reportYear,
      groupId: basePayload.groupId,
    });
  }

  const parsed = bulkReportSchema.safeParse(basePayload);

  if (!parsed.success) {
    redirectWithMessage({
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos invalidos.",
      month: basePayload.reportMonth,
      year: basePayload.reportYear,
      groupId: basePayload.groupId,
    });
  }

  const data = parsed.data;

  if (
    (membership.role === "group_overseer" || membership.role === "group_assistant") &&
    membership.groupId &&
    membership.groupId !== data.groupId
  ) {
    redirectWithMessage({
      status: "error",
      message: "Solo puedes cargar informes del grupo asociado a tu usuario.",
      month: String(data.reportMonth),
      year: String(data.reportYear),
      groupId: data.groupId,
    });
  }

  const publisherIds = formData
    .getAll("publisherIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (publisherIds.length === 0) {
    redirectWithMessage({
      status: "error",
      message: "No hay publicadores para el grupo y periodo seleccionados.",
      month: String(data.reportMonth),
      year: String(data.reportYear),
      groupId: data.groupId,
    });
  }

  const db = getDb();

  for (const publisherId of publisherIds) {
    const resolved = await resolvePublisherStateForMonth({
      tenantId: membership.tenantId,
      publisherId,
      year: data.reportYear,
      month: data.reportMonth,
    });

    if (!resolved || resolved.group.id !== data.groupId) {
      redirectWithMessage({
        status: "error",
        message:
          "Existe un publicador sin grupo o tipo vigente para el periodo seleccionado.",
        month: String(data.reportMonth),
        year: String(data.reportYear),
        groupId: data.groupId,
      });
    }

    const requiresHours = statusRequiresHours(resolved.status);
    const autoParticipates = statusAutoMarksParticipation(resolved.status);
    const participated = autoParticipates
      ? true
      : formData.get(`participated:${publisherId}`) === "on";

    const hoursValue = String(formData.get(`preachingHours:${publisherId}`) ?? "").trim();
    const bibleStudiesValue = String(formData.get(`bibleStudies:${publisherId}`) ?? "0").trim();
    const notesValue = String(formData.get(`notes:${publisherId}`) ?? "").trim();
    const preachingHours =
      hoursValue.length > 0 ? Number(hoursValue.replace(",", ".")) : null;
    const bibleStudies = Number(bibleStudiesValue === "" ? "0" : bibleStudiesValue);

    if (requiresHours && (preachingHours === null || Number.isNaN(preachingHours))) {
      redirectWithMessage({
        status: "error",
        message:
          "Las horas son obligatorias para precursores auxiliares, regulares y especiales.",
        month: String(data.reportMonth),
        year: String(data.reportYear),
        groupId: data.groupId,
      });
    }

    if (!requiresHours && preachingHours !== null) {
      redirectWithMessage({
        status: "error",
        message: "Los publicadores no deben informar horas en este formulario.",
        month: String(data.reportMonth),
        year: String(data.reportYear),
        groupId: data.groupId,
      });
    }

    if (preachingHours !== null && !Number.isInteger(preachingHours)) {
      redirectWithMessage({
        status: "error",
        message: "Las horas deben ingresarse como números enteros, sin decimales.",
        month: String(data.reportMonth),
        year: String(data.reportYear),
        groupId: data.groupId,
      });
    }

    if (Number.isNaN(bibleStudies) || bibleStudies < 0) {
      redirectWithMessage({
        status: "error",
        message: "La cantidad de cursos bíblicos no es válida.",
        month: String(data.reportMonth),
        year: String(data.reportYear),
        groupId: data.groupId,
      });
    }

    await db
      .insert(monthlyReports)
      .values({
        tenantId: membership.tenantId,
        publisherId,
        publisherStatus: resolved.status,
        groupId: data.groupId,
        reportYear: data.reportYear,
        reportMonth: data.reportMonth,
        participated,
        preachingHours: preachingHours === null ? null : String(preachingHours),
        bibleStudies,
        notes: notesValue.length > 0 ? notesValue : null,
        submittedByTenantUserId: membership.tenantUserId,
      })
      .onConflictDoUpdate({
        target: [
          monthlyReports.tenantId,
          monthlyReports.publisherId,
          monthlyReports.reportYear,
          monthlyReports.reportMonth,
        ],
        set: {
          publisherStatus: resolved.status,
          groupId: data.groupId,
          participated,
          preachingHours: preachingHours === null ? null : String(preachingHours),
          bibleStudies,
          notes: notesValue.length > 0 ? notesValue : null,
          submittedByTenantUserId: membership.tenantUserId,
          updatedAt: new Date(),
        },
      });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");

  redirectWithMessage({
    status: "success",
    message: "Informes del grupo guardados correctamente.",
    month: String(data.reportMonth),
    year: String(data.reportYear),
    groupId: data.groupId,
  });
}
