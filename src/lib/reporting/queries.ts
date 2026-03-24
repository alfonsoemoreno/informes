import { and, asc, count, desc, eq, sql, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  monthlyReports,
  preachingGroups,
  publisherGroupAssignments,
  publishers,
  publisherStatusAssignments,
  tenantUsers,
} from "@/lib/db/schema";
import { getMonthBounds, overlapsPeriod } from "@/lib/domain/periods";
import { publisherStatuses, type PublisherStatus } from "@/lib/domain/reporting";

function isPublisherStatus(value: string): value is PublisherStatus {
  return publisherStatuses.includes(value as PublisherStatus);
}

export async function resolvePublisherStateForMonth(input: {
  tenantId: string;
  publisherId: string;
  year: number;
  month: number;
}) {
  const db = getDb();
  const { monthStart, monthEnd } = getMonthBounds(input.year, input.month);

  const [publisher] = await db
    .select()
    .from(publishers)
    .where(
      and(
        eq(publishers.id, input.publisherId),
        eq(publishers.tenantId, input.tenantId),
        eq(publishers.isActive, true),
      ),
    )
    .limit(1);

  if (!publisher) {
    return null;
  }

  const [groupAssignment, statusAssignment] = await Promise.all([
    db
      .select()
      .from(publisherGroupAssignments)
      .where(
        and(
          eq(publisherGroupAssignments.tenantId, input.tenantId),
          eq(publisherGroupAssignments.publisherId, input.publisherId),
        ),
      )
      .orderBy(desc(publisherGroupAssignments.effectiveFrom)),
    db
      .select()
      .from(publisherStatusAssignments)
      .where(
        and(
          eq(publisherStatusAssignments.tenantId, input.tenantId),
          eq(publisherStatusAssignments.publisherId, input.publisherId),
        ),
      )
      .orderBy(desc(publisherStatusAssignments.effectiveFrom)),
  ]);

  const activeGroupAssignment =
    groupAssignment.find((item) =>
      overlapsPeriod(item.effectiveFrom, item.effectiveTo, monthStart, monthEnd),
    ) ?? null;

  const activeStatusAssignment =
    statusAssignment.find((item) =>
      overlapsPeriod(item.effectiveFrom, item.effectiveTo, monthStart, monthEnd),
    ) ?? null;

  if (!activeGroupAssignment || !activeStatusAssignment || !isPublisherStatus(activeStatusAssignment.status)) {
    return null;
  }

  const [group] = await db
    .select()
    .from(preachingGroups)
    .where(eq(preachingGroups.id, activeGroupAssignment.groupId))
    .limit(1);

  if (!group) {
    return null;
  }

  return {
    publisher,
    group,
    status: activeStatusAssignment.status,
  };
}

export async function listTenantPublishers(tenantId: string) {
  const db = getDb();

  return db
    .select({
      id: publishers.id,
      fullName: publishers.fullName,
      firstName: publishers.firstName,
      lastName: publishers.lastName,
      publisherCode: publishers.publisherCode,
      isActive: publishers.isActive,
      createdAt: publishers.createdAt,
    })
    .from(publishers)
    .where(eq(publishers.tenantId, tenantId))
    .orderBy(asc(publishers.fullName));
}

export async function listTenantGroups(tenantId: string) {
  const db = getDb();

  return db
    .select({
      id: preachingGroups.id,
      name: preachingGroups.name,
      code: preachingGroups.code,
      sortOrder: preachingGroups.sortOrder,
    })
    .from(preachingGroups)
    .where(and(eq(preachingGroups.tenantId, tenantId), eq(preachingGroups.isActive, true)))
    .orderBy(asc(preachingGroups.sortOrder), asc(preachingGroups.name));
}

export async function listAccessiblePublishersForReports(input: {
  tenantId: string;
  role: (typeof tenantUsers.$inferSelect)["role"];
  groupId: string | null;
  year: number;
  month: number;
}) {
  const publishers = await listTenantPublishers(input.tenantId);
  const states = await Promise.all(
    publishers.map(async (publisher) => {
      const resolved = await resolvePublisherStateForMonth({
        tenantId: input.tenantId,
        publisherId: publisher.id,
        year: input.year,
        month: input.month,
      });

      if (!resolved) {
        return null;
      }

      if (
        (input.role === "group_overseer" || input.role === "group_assistant") &&
        input.groupId &&
        resolved.group.id !== input.groupId
      ) {
        return null;
      }

      return {
        id: publisher.id,
        fullName: publisher.fullName,
        groupId: resolved.group.id,
        groupName: resolved.group.name,
        status: resolved.status,
      };
    }),
  );

  return states.filter((value): value is NonNullable<typeof value> => value !== null);
}

export async function listRecentReports(tenantId: string, limit = 12) {
  const db = getDb();

  return db
    .select({
      id: monthlyReports.id,
      reportYear: monthlyReports.reportYear,
      reportMonth: monthlyReports.reportMonth,
      publisherStatus: monthlyReports.publisherStatus,
      participated: monthlyReports.participated,
      preachingHours: monthlyReports.preachingHours,
      bibleStudies: monthlyReports.bibleStudies,
      notes: monthlyReports.notes,
      submittedAt: monthlyReports.submittedAt,
      publisherName: publishers.fullName,
      groupName: preachingGroups.name,
    })
    .from(monthlyReports)
    .innerJoin(publishers, eq(monthlyReports.publisherId, publishers.id))
    .innerJoin(preachingGroups, eq(monthlyReports.groupId, preachingGroups.id))
    .where(eq(monthlyReports.tenantId, tenantId))
    .orderBy(desc(monthlyReports.reportYear), desc(monthlyReports.reportMonth), desc(monthlyReports.submittedAt))
    .limit(limit);
}

export async function getPublisherDetails(input: {
  tenantId: string;
  publisherId: string;
}) {
  const db = getDb();

  const [publisher] = await db
    .select()
    .from(publishers)
    .where(and(eq(publishers.id, input.publisherId), eq(publishers.tenantId, input.tenantId)))
    .limit(1);

  if (!publisher) {
    return null;
  }

  const [groupHistory, statusHistory, reports] = await Promise.all([
    db
      .select({
        id: publisherGroupAssignments.id,
        effectiveFrom: publisherGroupAssignments.effectiveFrom,
        effectiveTo: publisherGroupAssignments.effectiveTo,
        notes: publisherGroupAssignments.notes,
        groupName: preachingGroups.name,
        groupId: preachingGroups.id,
      })
      .from(publisherGroupAssignments)
      .innerJoin(preachingGroups, eq(publisherGroupAssignments.groupId, preachingGroups.id))
      .where(
        and(
          eq(publisherGroupAssignments.tenantId, input.tenantId),
          eq(publisherGroupAssignments.publisherId, input.publisherId),
        ),
      )
      .orderBy(desc(publisherGroupAssignments.effectiveFrom)),
    db
      .select({
        id: publisherStatusAssignments.id,
        effectiveFrom: publisherStatusAssignments.effectiveFrom,
        effectiveTo: publisherStatusAssignments.effectiveTo,
        notes: publisherStatusAssignments.notes,
        status: publisherStatusAssignments.status,
      })
      .from(publisherStatusAssignments)
      .where(
        and(
          eq(publisherStatusAssignments.tenantId, input.tenantId),
          eq(publisherStatusAssignments.publisherId, input.publisherId),
        ),
      )
      .orderBy(desc(publisherStatusAssignments.effectiveFrom)),
    db
      .select({
        id: monthlyReports.id,
        reportYear: monthlyReports.reportYear,
        reportMonth: monthlyReports.reportMonth,
        publisherStatus: monthlyReports.publisherStatus,
        participated: monthlyReports.participated,
        preachingHours: monthlyReports.preachingHours,
        bibleStudies: monthlyReports.bibleStudies,
        notes: monthlyReports.notes,
        groupName: preachingGroups.name,
      })
      .from(monthlyReports)
      .innerJoin(preachingGroups, eq(monthlyReports.groupId, preachingGroups.id))
      .where(
        and(
          eq(monthlyReports.tenantId, input.tenantId),
          eq(monthlyReports.publisherId, input.publisherId),
        ),
      )
      .orderBy(desc(monthlyReports.reportYear), desc(monthlyReports.reportMonth)),
  ]);

  return {
    publisher,
    groupHistory,
    statusHistory,
    reports,
  };
}

export async function getMonthlySummary(input: {
  tenantId: string;
  year: number;
  month: number;
}) {
  const db = getDb();

  const [totals] = await db
    .select({
      totalReports: count(monthlyReports.id),
      totalParticipated: sum(sql<number>`case when ${monthlyReports.participated} then 1 else 0 end`),
      totalHours: sum(sql<number>`coalesce(${monthlyReports.preachingHours}, 0)`),
      totalBibleStudies: sum(monthlyReports.bibleStudies),
    })
    .from(monthlyReports)
    .where(
      and(
        eq(monthlyReports.tenantId, input.tenantId),
        eq(monthlyReports.reportYear, input.year),
        eq(monthlyReports.reportMonth, input.month),
      ),
    );

  const [byGroup, byStatus] = await Promise.all([
    db
      .select({
        groupId: preachingGroups.id,
        groupName: preachingGroups.name,
        totalReports: count(monthlyReports.id),
        totalParticipated: sum(sql<number>`case when ${monthlyReports.participated} then 1 else 0 end`),
        totalHours: sum(sql<number>`coalesce(${monthlyReports.preachingHours}, 0)`),
        totalBibleStudies: sum(monthlyReports.bibleStudies),
      })
      .from(monthlyReports)
      .innerJoin(preachingGroups, eq(monthlyReports.groupId, preachingGroups.id))
      .where(
        and(
          eq(monthlyReports.tenantId, input.tenantId),
          eq(monthlyReports.reportYear, input.year),
          eq(monthlyReports.reportMonth, input.month),
        ),
      )
      .groupBy(preachingGroups.id, preachingGroups.name)
      .orderBy(asc(preachingGroups.name)),
    db
      .select({
        publisherStatus: monthlyReports.publisherStatus,
        totalReports: count(monthlyReports.id),
        totalParticipated: sum(sql<number>`case when ${monthlyReports.participated} then 1 else 0 end`),
        totalHours: sum(sql<number>`coalesce(${monthlyReports.preachingHours}, 0)`),
        totalBibleStudies: sum(monthlyReports.bibleStudies),
      })
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.tenantId, input.tenantId),
          eq(monthlyReports.reportYear, input.year),
          eq(monthlyReports.reportMonth, input.month),
        ),
      )
      .groupBy(monthlyReports.publisherStatus)
      .orderBy(asc(monthlyReports.publisherStatus)),
  ]);

  return {
    totals: {
      totalReports: Number(totals?.totalReports ?? 0),
      totalParticipated: Number(totals?.totalParticipated ?? 0),
      totalHours: Number(totals?.totalHours ?? 0),
      totalBibleStudies: Number(totals?.totalBibleStudies ?? 0),
    },
    byGroup: byGroup.map((row) => ({
      ...row,
      totalReports: Number(row.totalReports ?? 0),
      totalParticipated: Number(row.totalParticipated ?? 0),
      totalHours: Number(row.totalHours ?? 0),
      totalBibleStudies: Number(row.totalBibleStudies ?? 0),
    })),
    byStatus: byStatus.map((row) => ({
      ...row,
      totalReports: Number(row.totalReports ?? 0),
      totalParticipated: Number(row.totalParticipated ?? 0),
      totalHours: Number(row.totalHours ?? 0),
      totalBibleStudies: Number(row.totalBibleStudies ?? 0),
    })),
  };
}
