import { redirect } from "next/navigation";
import { getCurrentAppContext } from "@/lib/app-context";
import { canManagePublishers } from "@/lib/domain/permissions";
import {
  getPublisherReportingStates,
  listTenantGroups,
  listTenantPublishers,
  resolvePublisherStateForMonth,
} from "@/lib/reporting/queries";
import { PublisherManagement } from "@/app/dashboard/publishers/publisher-management";

export default async function PublishersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentAppContext();
  const resolvedSearchParams = (await searchParams) ?? {};
  const status =
    typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const message =
    typeof resolvedSearchParams.message === "string" ? resolvedSearchParams.message : null;

  if (!context.authSession?.user) {
    redirect("/auth/sign-in");
  }

  if (context.appUser?.isSuperadmin) {
    redirect("/dashboard/admin/tenants");
  }

  const membership = context.activeMembership;

  if (!membership) {
    return (
      <section className="panel" style={{ padding: "28px" }}>
        <h1>Sin tenant asignado</h1>
        <p className="hint">
          El usuario existe en Neon Auth, pero todavia no tiene una asignacion activa
          dentro de una congregacion.
        </p>
      </section>
    );
  }

  const [groups, tenantPublishers] = await Promise.all([
    listTenantGroups(membership.tenantId),
    listTenantPublishers(membership.tenantId),
  ]);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const reportingStates = await getPublisherReportingStates({
    tenantId: membership.tenantId,
    currentYear: year,
    currentMonth: month,
    publisherIds: tenantPublishers.map((publisher) => publisher.id),
  });

  const publishers = await Promise.all(
    tenantPublishers.map(async (publisher) => {
      const currentState = await resolvePublisherStateForMonth({
        tenantId: membership.tenantId,
        publisherId: publisher.id,
        year,
        month,
      });

      return {
        ...publisher,
        currentGroupName: currentState?.group.name ?? "Sin grupo vigente",
        currentStatus: currentState?.status ?? null,
        reportingState: reportingStates.get(publisher.id) ?? "up_to_date",
      };
    }),
  );

  return (
    <PublisherManagement
      publishers={publishers}
      groups={groups}
      canManage={canManagePublishers(membership.role)}
      status={status}
      message={message}
    />
  );
}
