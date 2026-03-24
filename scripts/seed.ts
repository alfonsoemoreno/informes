import { config } from "dotenv";
import { and, desc, eq } from "drizzle-orm";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthVanillaAdapter } from "@neondatabase/auth/vanilla";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import type { PublisherStatus, TenantRole } from "../src/lib/domain/reporting";

config({ path: ".env.local" });
config();

const DATABASE_URL = process.env.DATABASE_URL;
const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;
const SEED_APP_ORIGIN = process.env.SEED_APP_ORIGIN ?? "http://localhost:3000";

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Configure .env.local before running the seed.");
}

if (!NEON_AUTH_BASE_URL) {
  throw new Error("Missing NEON_AUTH_BASE_URL. Configure .env.local before running the seed.");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });
const auth = createAuthClient(NEON_AUTH_BASE_URL, {
  adapter: BetterAuthVanillaAdapter({
    fetchOptions: {
      headers: {
        origin: SEED_APP_ORIGIN,
      },
    },
  }),
});

const seedConfig = {
  superadmin: {
    name: process.env.SEED_SUPERADMIN_NAME ?? "Super Administrador",
    email: process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@example.com",
    password: process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!",
  },
  tenant: {
    name: process.env.SEED_TENANT_NAME ?? "Congregacion Demo",
    slug: process.env.SEED_TENANT_SLUG ?? "congregacion-demo",
    timezone: process.env.SEED_TENANT_TIMEZONE ?? "America/Santiago",
  },
  users: {
    secretary: {
      name: process.env.SEED_SECRETARY_NAME ?? "Secretario Demo",
      email: process.env.SEED_SECRETARY_EMAIL ?? "secretario@example.com",
      password: process.env.SEED_SECRETARY_PASSWORD ?? "ChangeMe123!",
      role: "secretary" as TenantRole,
    },
    elder: {
      name: process.env.SEED_ELDER_NAME ?? "Anciano Demo",
      email: process.env.SEED_ELDER_EMAIL ?? "anciano@example.com",
      password: process.env.SEED_ELDER_PASSWORD ?? "ChangeMe123!",
      role: "elder" as TenantRole,
    },
    overseer: {
      name: process.env.SEED_OVERSEER_NAME ?? "Superintendente Demo",
      email: process.env.SEED_OVERSEER_EMAIL ?? "superintendente@example.com",
      password: process.env.SEED_OVERSEER_PASSWORD ?? "ChangeMe123!",
      role: "group_overseer" as TenantRole,
    },
    assistant: {
      name: process.env.SEED_ASSISTANT_NAME ?? "Auxiliar Demo",
      email: process.env.SEED_ASSISTANT_EMAIL ?? "auxiliar@example.com",
      password: process.env.SEED_ASSISTANT_PASSWORD ?? "ChangeMe123!",
      role: "group_assistant" as TenantRole,
    },
  },
};

type SeedUser = {
  name: string;
  email: string;
  password: string;
};

async function ensureAuthUser(user: SeedUser) {
  const existingLocal = await db.query.appUsers.findFirst({
    where: eq(schema.appUsers.email, user.email),
  });

  if (existingLocal) {
    return {
      authUserId: existingLocal.authUserId,
      email: existingLocal.email,
      name: existingLocal.displayName,
    };
  }

  const signUpResult = await auth.signUp.email({
    email: user.email,
    password: user.password,
    name: user.name,
    callbackURL: `${SEED_APP_ORIGIN}/dashboard`,
  });

  if (signUpResult.data?.user) {
    return {
      authUserId: signUpResult.data.user.id,
      email: signUpResult.data.user.email,
      name: signUpResult.data.user.name,
    };
  }

  const signInResult = await auth.signIn.email({
    email: user.email,
    password: user.password,
  });

  if (signInResult.data?.user) {
    return {
      authUserId: signInResult.data.user.id,
      email: signInResult.data.user.email,
      name: signInResult.data.user.name,
    };
  }

  throw new Error(
    `No fue posible asegurar el usuario de Neon Auth para ${user.email}. ` +
      `SignUp error: ${signUpResult.error?.message ?? "sin detalle"}. ` +
      `SignIn error: ${signInResult.error?.message ?? "sin detalle"}.`,
  );
}

async function ensureAppUser(
  user: SeedUser,
  options?: { isSuperadmin?: boolean; userType?: "superadmin" | "secretary" | "tenant_user" },
) {
  const authUser = await ensureAuthUser(user);
  const isSuperadmin = options?.isSuperadmin ?? false;
  const userType = options?.userType ?? "tenant_user";

  const [appUser] = await db
    .insert(schema.appUsers)
    .values({
      authUserId: authUser.authUserId,
      email: authUser.email,
      displayName: authUser.name,
      userType,
      isSuperadmin,
    })
    .onConflictDoUpdate({
      target: schema.appUsers.email,
      set: {
        authUserId: authUser.authUserId,
        displayName: authUser.name,
        userType,
        isSuperadmin,
        updatedAt: new Date(),
      },
    })
    .returning();

  return appUser;
}

async function ensureTenant() {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: seedConfig.tenant.name,
      slug: seedConfig.tenant.slug,
      timezone: seedConfig.tenant.timezone,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: {
        name: seedConfig.tenant.name,
        timezone: seedConfig.tenant.timezone,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return tenant;
}

async function ensureGroup(tenantId: string, name: string, sortOrder: number, code?: string) {
  const existing = await db.query.preachingGroups.findFirst({
    where: and(eq(schema.preachingGroups.tenantId, tenantId), eq(schema.preachingGroups.name, name)),
  });

  if (existing) {
    await db
      .update(schema.preachingGroups)
      .set({
        code: code ?? existing.code,
        sortOrder,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.preachingGroups.id, existing.id));

    return existing;
  }

  const [group] = await db
    .insert(schema.preachingGroups)
    .values({
      tenantId,
      name,
      code: code ?? null,
      sortOrder,
      isActive: true,
    })
    .returning();

  return group;
}

async function ensureTenantUser(input: {
  tenantId: string;
  appUserId: string;
  role: TenantRole;
  groupId: string | null;
}) {
  const [tenantUser] = await db
    .insert(schema.tenantUsers)
    .values({
      tenantId: input.tenantId,
      appUserId: input.appUserId,
      role: input.role,
      groupId: input.groupId,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [schema.tenantUsers.tenantId, schema.tenantUsers.appUserId],
      set: {
        role: input.role,
        groupId: input.groupId,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return tenantUser;
}

async function ensurePublisher(input: {
  tenantId: string;
  firstName: string;
  lastName: string;
  publisherCode: string;
  groupId: string;
  status: PublisherStatus;
  effectiveFrom: Date;
}) {
  const fullName = `${input.firstName} ${input.lastName}`;

  let publisher = await db.query.publishers.findFirst({
    where: and(eq(schema.publishers.tenantId, input.tenantId), eq(schema.publishers.fullName, fullName)),
  });

  if (!publisher) {
    [publisher] = await db
      .insert(schema.publishers)
      .values({
        tenantId: input.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName,
        publisherCode: input.publisherCode,
        isActive: true,
      })
      .returning();
  }

  const existingGroupAssignment = await db.query.publisherGroupAssignments.findFirst({
    where: and(
      eq(schema.publisherGroupAssignments.tenantId, input.tenantId),
      eq(schema.publisherGroupAssignments.publisherId, publisher.id),
    ),
    orderBy: [desc(schema.publisherGroupAssignments.effectiveFrom)],
  });

  if (!existingGroupAssignment) {
    await db.insert(schema.publisherGroupAssignments).values({
      tenantId: input.tenantId,
      publisherId: publisher.id,
      groupId: input.groupId,
      effectiveFrom: input.effectiveFrom,
    });
  }

  const existingStatusAssignment = await db.query.publisherStatusAssignments.findFirst({
    where: and(
      eq(schema.publisherStatusAssignments.tenantId, input.tenantId),
      eq(schema.publisherStatusAssignments.publisherId, publisher.id),
    ),
    orderBy: [desc(schema.publisherStatusAssignments.effectiveFrom)],
  });

  if (!existingStatusAssignment) {
    await db.insert(schema.publisherStatusAssignments).values({
      tenantId: input.tenantId,
      publisherId: publisher.id,
      status: input.status,
      effectiveFrom: input.effectiveFrom,
    });
  }

  return publisher;
}

async function ensureMonthlyReport(input: {
  tenantId: string;
  publisherId: string;
  groupId: string;
  publisherStatus: PublisherStatus;
  reportYear: number;
  reportMonth: number;
  participated: boolean;
  preachingHours: string | null;
  bibleStudies: number;
  submittedByTenantUserId: string;
  notes?: string;
}) {
  await db
    .insert(schema.monthlyReports)
    .values({
      ...input,
      notes: input.notes ?? null,
    })
    .onConflictDoNothing({
      target: [
        schema.monthlyReports.tenantId,
        schema.monthlyReports.publisherId,
        schema.monthlyReports.reportYear,
        schema.monthlyReports.reportMonth,
      ],
    });
}

async function main() {
  console.log("Seeding initial data...");

  const superadmin = await ensureAppUser(seedConfig.superadmin, {
    isSuperadmin: true,
    userType: "superadmin",
  });
  console.log(`Superadmin listo: ${superadmin.email}`);

  const tenant = await ensureTenant();
  console.log(`Tenant listo: ${tenant.name}`);

  const group1 = await ensureGroup(tenant.id, "Grupo 1", 1, "G1");
  const group2 = await ensureGroup(tenant.id, "Grupo 2", 2, "G2");

  const secretary = await ensureAppUser(seedConfig.users.secretary, {
    userType: "secretary",
  });
  const elder = await ensureAppUser(seedConfig.users.elder, {
    userType: "tenant_user",
  });
  const overseer = await ensureAppUser(seedConfig.users.overseer, {
    userType: "tenant_user",
  });
  const assistant = await ensureAppUser(seedConfig.users.assistant, {
    userType: "tenant_user",
  });

  const secretaryMembership = await ensureTenantUser({
    tenantId: tenant.id,
    appUserId: secretary.id,
    role: "secretary",
    groupId: null,
  });

  await ensureTenantUser({
    tenantId: tenant.id,
    appUserId: elder.id,
    role: "elder",
    groupId: null,
  });

  await ensureTenantUser({
    tenantId: tenant.id,
    appUserId: overseer.id,
    role: "group_overseer",
    groupId: group1.id,
  });

  await ensureTenantUser({
    tenantId: tenant.id,
    appUserId: assistant.id,
    role: "group_assistant",
    groupId: group1.id,
  });

  const effectiveFrom = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));

  const publisher1 = await ensurePublisher({
    tenantId: tenant.id,
    firstName: "Juan",
    lastName: "Perez",
    publisherCode: "PUB-001",
    groupId: group1.id,
    status: "publisher",
    effectiveFrom,
  });

  const publisher2 = await ensurePublisher({
    tenantId: tenant.id,
    firstName: "Maria",
    lastName: "Gonzalez",
    publisherCode: "PUB-002",
    groupId: group1.id,
    status: "auxiliary_pioneer",
    effectiveFrom,
  });

  const publisher3 = await ensurePublisher({
    tenantId: tenant.id,
    firstName: "Pedro",
    lastName: "Soto",
    publisherCode: "PUB-003",
    groupId: group2.id,
    status: "regular_pioneer",
    effectiveFrom,
  });

  const publisher4 = await ensurePublisher({
    tenantId: tenant.id,
    firstName: "Ana",
    lastName: "Rojas",
    publisherCode: "PUB-004",
    groupId: group2.id,
    status: "special_pioneer",
    effectiveFrom,
  });

  const now = new Date();
  const reportYear = now.getUTCFullYear();
  const reportMonth = now.getUTCMonth() + 1;

  await ensureMonthlyReport({
    tenantId: tenant.id,
    publisherId: publisher1.id,
    groupId: group1.id,
    publisherStatus: "publisher",
    reportYear,
    reportMonth,
    participated: true,
    preachingHours: null,
    bibleStudies: 1,
    submittedByTenantUserId: secretaryMembership.id,
    notes: "Informe demo de publicador.",
  });

  await ensureMonthlyReport({
    tenantId: tenant.id,
    publisherId: publisher2.id,
    groupId: group1.id,
    publisherStatus: "auxiliary_pioneer",
    reportYear,
    reportMonth,
    participated: true,
    preachingHours: "32",
    bibleStudies: 2,
    submittedByTenantUserId: secretaryMembership.id,
    notes: "Informe demo de precursor auxiliar.",
  });

  await ensureMonthlyReport({
    tenantId: tenant.id,
    publisherId: publisher3.id,
    groupId: group2.id,
    publisherStatus: "regular_pioneer",
    reportYear,
    reportMonth,
    participated: true,
    preachingHours: "58",
    bibleStudies: 3,
    submittedByTenantUserId: secretaryMembership.id,
    notes: "Informe demo de precursor regular.",
  });

  await ensureMonthlyReport({
    tenantId: tenant.id,
    publisherId: publisher4.id,
    groupId: group2.id,
    publisherStatus: "special_pioneer",
    reportYear,
    reportMonth,
    participated: true,
    preachingHours: "115",
    bibleStudies: 4,
    submittedByTenantUserId: secretaryMembership.id,
    notes: "Informe demo de precursor especial.",
  });

  console.log("Seed completado.");
  console.log(`Superadmin: ${seedConfig.superadmin.email}`);
  console.log(`Tenant demo: ${tenant.name} (${tenant.slug})`);
  console.log(`Secretario demo: ${seedConfig.users.secretary.email}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
