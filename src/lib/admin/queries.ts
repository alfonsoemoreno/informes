import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appUsers, preachingGroups, tenantUsers, tenants } from "@/lib/db/schema";

export async function listTenantUsers(tenantId: string) {
  const db = getDb();

  return db
    .select({
      tenantUserId: tenantUsers.id,
      appUserId: appUsers.id,
      role: tenantUsers.role,
      isActive: tenantUsers.isActive,
      email: appUsers.email,
      displayName: appUsers.displayName,
      groupName: preachingGroups.name,
      groupId: tenantUsers.groupId,
      createdAt: tenantUsers.createdAt,
    })
    .from(tenantUsers)
    .innerJoin(appUsers, eq(tenantUsers.appUserId, appUsers.id))
    .leftJoin(preachingGroups, eq(tenantUsers.groupId, preachingGroups.id))
    .where(eq(tenantUsers.tenantId, tenantId))
    .orderBy(asc(appUsers.displayName), asc(appUsers.email));
}

export async function listAllTenants() {
  const db = getDb();

  const tenantList = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      timezone: tenants.timezone,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(asc(tenants.name));

  const enriched = await Promise.all(
    tenantList.map(async (tenant) => {
      const [secretary] = await db
        .select({
          tenantUserId: tenantUsers.id,
          email: appUsers.email,
          displayName: appUsers.displayName,
          isActive: tenantUsers.isActive,
        })
        .from(tenantUsers)
        .innerJoin(appUsers, eq(tenantUsers.appUserId, appUsers.id))
        .where(
          and(
            eq(tenantUsers.tenantId, tenant.id),
            eq(tenantUsers.role, "secretary"),
          ),
        )
        .limit(1);

      return {
        ...tenant,
        secretary: secretary ?? null,
      };
    }),
  );

  return enriched;
}

export async function tenantSlugExists(slug: string) {
  const db = getDb();

  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return existing.length > 0;
}

export async function findAppUserByEmail(email: string) {
  const db = getDb();

  const [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  return user ?? null;
}

export async function findTenantUser(input: { tenantId: string; appUserId: string }) {
  const db = getDb();

  const [membership] = await db
    .select()
    .from(tenantUsers)
    .where(
      and(eq(tenantUsers.tenantId, input.tenantId), eq(tenantUsers.appUserId, input.appUserId)),
    )
    .limit(1);

  return membership ?? null;
}

export async function findTenantUserById(input: { tenantId: string; tenantUserId: string }) {
  const db = getDb();

  const [membership] = await db
    .select()
    .from(tenantUsers)
    .where(
      and(eq(tenantUsers.tenantId, input.tenantId), eq(tenantUsers.id, input.tenantUserId)),
    )
    .limit(1);

  return membership ?? null;
}

export async function listSecretaryUsers() {
  const db = getDb();

  const users = await db
    .select({
      id: appUsers.id,
      authUserId: appUsers.authUserId,
      email: appUsers.email,
      displayName: appUsers.displayName,
      userType: appUsers.userType,
      isSuperadmin: appUsers.isSuperadmin,
      createdAt: appUsers.createdAt,
    })
    .from(appUsers)
    .where(eq(appUsers.userType, "secretary"))
    .orderBy(asc(appUsers.displayName), asc(appUsers.email));

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [membership] = await db
        .select({
          tenantUserId: tenantUsers.id,
          tenantId: tenants.id,
          tenantName: tenants.name,
          tenantSlug: tenants.slug,
          isActive: tenantUsers.isActive,
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
        .where(
          and(eq(tenantUsers.appUserId, user.id), eq(tenantUsers.role, "secretary")),
        )
        .limit(1);

      return {
        ...user,
        secretaryMembership: membership ?? null,
      };
    }),
  );

  return enriched;
}
