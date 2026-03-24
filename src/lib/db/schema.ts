import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { publisherStatuses, tenantRoles } from "@/lib/domain/reporting";

export const tenantUserRoleEnum = pgEnum("tenant_user_role", tenantRoles);
export const publisherStatusEnum = pgEnum("publisher_status", publisherStatuses);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    isSuperadmin: boolean("is_superadmin").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    authUserIdUnique: uniqueIndex("app_users_auth_user_id_uidx").on(table.authUserId),
    emailUnique: uniqueIndex("app_users_email_uidx").on(table.email),
  }),
);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").default("America/Santiago").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    slugUnique: uniqueIndex("tenants_slug_uidx").on(table.slug),
  }),
);

export const preachingGroups = pgTable(
  "preaching_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantNameUnique: uniqueIndex("preaching_groups_tenant_name_uidx").on(
      table.tenantId,
      table.name,
    ),
  }),
);

export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    appUserId: uuid("app_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    role: tenantUserRoleEnum("role").notNull(),
    groupId: uuid("group_id").references(() => preachingGroups.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantUserUnique: uniqueIndex("tenant_users_tenant_user_uidx").on(
      table.tenantId,
      table.appUserId,
    ),
  }),
);

export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    publisherCode: text("publisher_code"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantFullNameUnique: uniqueIndex("publishers_tenant_full_name_uidx").on(
      table.tenantId,
      table.fullName,
    ),
  }),
);

export const publisherGroupAssignments = pgTable(
  "publisher_group_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => preachingGroups.id, { onDelete: "restrict" }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
);

export const publisherStatusAssignments = pgTable(
  "publisher_status_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "cascade" }),
    status: publisherStatusEnum("status").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
);

export const monthlyReports = pgTable(
  "monthly_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "cascade" }),
    publisherStatus: publisherStatusEnum("publisher_status").notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => preachingGroups.id, { onDelete: "restrict" }),
    reportYear: integer("report_year").notNull(),
    reportMonth: integer("report_month").notNull(),
    participated: boolean("participated").notNull(),
    preachingHours: numeric("preaching_hours", { precision: 6, scale: 2 }),
    bibleStudies: integer("bible_studies").default(0).notNull(),
    notes: text("notes"),
    submittedByTenantUserId: uuid("submitted_by_tenant_user_id")
      .notNull()
      .references(() => tenantUsers.id, { onDelete: "restrict" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantPublisherPeriodUnique: uniqueIndex(
      "monthly_reports_tenant_publisher_period_uidx",
    ).on(table.tenantId, table.publisherId, table.reportYear, table.reportMonth),
    validMonth: check(
      "monthly_reports_report_month_check",
      sql`${table.reportMonth} between 1 and 12`,
    ),
  }),
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  groups: many(preachingGroups),
  tenantUsers: many(tenantUsers),
  publishers: many(publishers),
  reports: many(monthlyReports),
}));

export const preachingGroupsRelations = relations(preachingGroups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [preachingGroups.tenantId],
    references: [tenants.id],
  }),
  tenantUsers: many(tenantUsers),
  assignments: many(publisherGroupAssignments),
  reports: many(monthlyReports),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  appUser: one(appUsers, {
    fields: [tenantUsers.appUserId],
    references: [appUsers.id],
  }),
  group: one(preachingGroups, {
    fields: [tenantUsers.groupId],
    references: [preachingGroups.id],
  }),
  submittedReports: many(monthlyReports),
}));

export const publishersRelations = relations(publishers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [publishers.tenantId],
    references: [tenants.id],
  }),
  groupAssignments: many(publisherGroupAssignments),
  statusAssignments: many(publisherStatusAssignments),
  reports: many(monthlyReports),
}));

export const publisherGroupAssignmentsRelations = relations(
  publisherGroupAssignments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [publisherGroupAssignments.tenantId],
      references: [tenants.id],
    }),
    publisher: one(publishers, {
      fields: [publisherGroupAssignments.publisherId],
      references: [publishers.id],
    }),
    group: one(preachingGroups, {
      fields: [publisherGroupAssignments.groupId],
      references: [preachingGroups.id],
    }),
  }),
);

export const publisherStatusAssignmentsRelations = relations(
  publisherStatusAssignments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [publisherStatusAssignments.tenantId],
      references: [tenants.id],
    }),
    publisher: one(publishers, {
      fields: [publisherStatusAssignments.publisherId],
      references: [publishers.id],
    }),
  }),
);

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  tenant: one(tenants, {
    fields: [monthlyReports.tenantId],
    references: [tenants.id],
  }),
  publisher: one(publishers, {
    fields: [monthlyReports.publisherId],
    references: [publishers.id],
  }),
  group: one(preachingGroups, {
    fields: [monthlyReports.groupId],
    references: [preachingGroups.id],
  }),
  submittedBy: one(tenantUsers, {
    fields: [monthlyReports.submittedByTenantUserId],
    references: [tenantUsers.id],
  }),
}));
