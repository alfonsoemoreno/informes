import type { TenantRole } from "@/lib/domain/reporting";

export function canManagePublishers(role: TenantRole) {
  return role === "secretary";
}

export function canManageTenantUsers(role: TenantRole) {
  return role === "secretary";
}

export function canManageGroups(role: TenantRole) {
  return role === "secretary";
}

export function canSubmitReports(role: TenantRole) {
  return role === "secretary" || role === "group_overseer" || role === "group_assistant";
}

export function canViewCongregationReports(role: TenantRole) {
  return role === "secretary" || role === "elder" || role === "group_overseer" || role === "group_assistant";
}
