import type {
  PublisherReportingState,
  PublisherStatus,
  TenantRole,
} from "@/lib/domain/reporting";

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

const reportingStateLabels: Record<PublisherReportingState, string> = {
  up_to_date: "Al día",
  irregular: "Irregular",
  inactive: "Inactivo",
};

export function getRoleLabel(role: TenantRole) {
  return roleLabels[role];
}

export function getPublisherStatusLabel(status: PublisherStatus) {
  return statusLabels[status];
}

export function getPublisherReportingStateLabel(state: PublisherReportingState) {
  return reportingStateLabels[state];
}
