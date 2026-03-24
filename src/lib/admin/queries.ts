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

  return db
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
