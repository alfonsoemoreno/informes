export const tenantRoles = [
  "secretary",
  "elder",
  "group_overseer",
  "group_assistant",
] as const;

export const publisherStatuses = [
  "publisher",
  "auxiliary_pioneer",
  "regular_pioneer",
  "special_pioneer",
] as const;

export type TenantRole = (typeof tenantRoles)[number];
export type PublisherStatus = (typeof publisherStatuses)[number];

export function statusRequiresHours(status: PublisherStatus) {
  return status !== "publisher";
}

export function statusAutoMarksParticipation(status: PublisherStatus) {
  return status !== "publisher";
}
