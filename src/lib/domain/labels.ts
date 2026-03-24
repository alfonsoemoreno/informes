import type { PublisherStatus, TenantRole } from "@/lib/domain/reporting";

const roleLabels: Record<TenantRole, string> = {
  secretary: "Secretario",
  elder: "Anciano",
  group_overseer: "Superintendente de grupo",
  group_assistant: "Auxiliar de grupo",
};

const statusLabels: Record<PublisherStatus, string> = {
  publisher: "Publicador",
  auxiliary_pioneer: "Precursor auxiliar",
  regular_pioneer: "Precursor regular",
  special_pioneer: "Precursor especial",
};

export function getRoleLabel(role: TenantRole) {
  return roleLabels[role];
}

export function getPublisherStatusLabel(status: PublisherStatus) {
  return statusLabels[status];
}
