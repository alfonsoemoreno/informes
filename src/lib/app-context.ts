import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { appUsers, preachingGroups, tenantUsers, tenants } from "@/lib/db/schema";

export const getCurrentAppContext = cache(async () => {
  const { data: authSession } = await getCurrentSession();

  if (!authSession?.user) {
    return {
      authSession: null,
      appUser: null,
      memberships: [],
      activeMembership: null,
    };
  }

  const db = getDb();

  let [appUser] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.authUserId, authSession.user.id))
    .limit(1);

  if (!appUser) {
    [appUser] = await db
      .insert(appUsers)
      .values({
        authUserId: authSession.user.id,
        email: authSession.user.email,
        displayName: authSession.user.name ?? authSession.user.email,
      })
      .returning();
  }

  const memberships = await db
    .select({
      tenantUserId: tenantUsers.id,
      role: tenantUsers.role,
      groupId: tenantUsers.groupId,
      tenantId: tenants.id,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      groupName: preachingGroups.name,
    })
    .from(tenantUsers)
    .innerJoin(
      tenants,
      and(eq(tenantUsers.tenantId, tenants.id), eq(tenants.isActive, true)),
    )
    .leftJoin(preachingGroups, eq(tenantUsers.groupId, preachingGroups.id))
    .where(and(eq(tenantUsers.appUserId, appUser.id), eq(tenantUsers.isActive, true)))
    .orderBy(asc(tenants.name));

  return {
    authSession,
    appUser,
    memberships,
    activeMembership: memberships[0] ?? null,
  };
});
