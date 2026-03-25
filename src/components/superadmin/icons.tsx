type IconProps = {
  className?: string;
};

export function ApartmentIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20V6.5C4 5.67 4.67 5 5.5 5H11V20M11 20H20V10.5C20 9.67 19.33 9 18.5 9H11M11 20H8M7 8H8M7 11H8M7 14H8M14 12H15M14 15H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BadgeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 5.5C8 4.67 8.67 4 9.5 4H14.5C15.33 4 16 4.67 16 5.5V7.5C16 8.33 15.33 9 14.5 9H9.5C8.67 9 8 8.33 8 7.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 20V12.5C7 11.67 7.67 11 8.5 11H15.5C16.33 11 17 11.67 17 12.5V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AssignmentIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5.5H15M9.5 4H14.5C15.33 4 16 4.67 16 5.5V6H17.5C18.33 6 19 6.67 19 7.5V18.5C19 19.33 18.33 20 17.5 20H6.5C5.67 20 5 19.33 5 18.5V7.5C5 6.67 5.67 6 6.5 6H8V5.5C8 4.67 8.67 4 9.5 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 11H16M8 14.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.25C13.7959 15.25 15.25 13.7959 15.25 12C15.25 10.2041 13.7959 8.75 12 8.75C10.2041 8.75 8.75 10.2041 8.75 12C8.75 13.7959 10.2041 15.25 12 15.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12C19 11.51 18.95 11.03 18.86 10.57L20.5 9.3L18.7 6.18L16.72 6.86C15.99 6.24 15.11 5.82 14.14 5.63L13.8 3.5H10.2L9.86 5.63C8.89 5.82 8.01 6.24 7.28 6.86L5.3 6.18L3.5 9.3L5.14 10.57C5.05 11.03 5 11.51 5 12C5 12.49 5.05 12.97 5.14 13.43L3.5 14.7L5.3 17.82L7.28 17.14C8.01 17.76 8.89 18.18 9.86 18.37L10.2 20.5H13.8L14.14 18.37C15.11 18.18 15.99 17.76 16.72 17.14L18.7 17.82L20.5 14.7L18.86 13.43C18.95 12.97 19 12.49 19 12Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 12.25C13.5188 12.25 14.75 11.0188 14.75 9.5C14.75 7.98122 13.5188 6.75 12 6.75C10.4812 6.75 9.25 7.98122 9.25 9.5C9.25 11.0188 10.4812 12.25 12 12.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 18C8.45 16.37 10.08 15.25 12 15.25C13.92 15.25 15.55 16.37 16.5 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AddCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 14L14 10M8.5 16.5L6.5 18.5C5.12 19.88 2.88 19.88 1.5 18.5C0.12 17.12 0.12 14.88 1.5 13.5L5 10M15.5 7.5L17.5 5.5C18.88 4.12 21.12 4.12 22.5 5.5C23.88 6.88 23.88 9.12 22.5 10.5L19 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 12.5L10.8 15.3L16.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 8.25V8.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function DeleteIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M9 4.5H15M7 7L7.7 18.2C7.76 19.13 8.53 19.85 9.46 19.85H14.54C15.47 19.85 16.24 19.13 16.3 18.2L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.5V16M14 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 5.75C4.75 5.2 5.2 4.75 5.75 4.75H10.25C10.8 4.75 11.25 5.2 11.25 5.75V10.25C11.25 10.8 10.8 11.25 10.25 11.25H5.75C5.2 11.25 4.75 10.8 4.75 10.25V5.75ZM12.75 5.75C12.75 5.2 13.2 4.75 13.75 4.75H18.25C18.8 4.75 19.25 5.2 19.25 5.75V8.25C19.25 8.8 18.8 9.25 18.25 9.25H13.75C13.2 9.25 12.75 8.8 12.75 8.25V5.75ZM4.75 13.75C4.75 13.2 5.2 12.75 5.75 12.75H10.25C10.8 12.75 11.25 13.2 11.25 13.75V18.25C11.25 18.8 10.8 19.25 10.25 19.25H5.75C5.2 19.25 4.75 18.8 4.75 18.25V13.75ZM12.75 11.75C12.75 11.2 13.2 10.75 13.75 10.75H18.25C18.8 10.75 19.25 11.2 19.25 11.75V18.25C19.25 18.8 18.8 19.25 18.25 19.25H13.75C13.2 19.25 12.75 18.8 12.75 18.25V11.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function GroupUsersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.5 18.5C15.5 16.84 13.93 15.5 12 15.5C10.07 15.5 8.5 16.84 8.5 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 12.25C13.5188 12.25 14.75 11.0188 14.75 9.5C14.75 7.98122 13.5188 6.75 12 6.75C10.4812 6.75 9.25 7.98122 9.25 9.5C9.25 11.0188 10.4812 12.25 12 12.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 17.5C5.5 16.44 4.61 15.58 3.5 15.58M18.5 17.5C18.5 16.44 19.39 15.58 20.5 15.58M4.5 12.25C5.47 12.25 6.25 11.47 6.25 10.5C6.25 9.53 5.47 8.75 4.5 8.75M19.5 12.25C18.53 12.25 17.75 11.47 17.75 10.5C17.75 9.53 18.53 8.75 19.5 8.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HubIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 7.5V16.5M7.5 12H16.5M6 7.5H8M16 7.5H18M6 16.5H8M16 16.5H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="5" cy="7.5" r="1.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="7.5" r="1.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5" cy="16.5" r="1.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="16.5" r="1.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 5.25H16.25C17.91 5.25 19.25 6.59 19.25 8.25V17.75C19.25 18.3 18.8 18.75 18.25 18.75H8.25C7.15 18.75 6.25 17.85 6.25 16.75V6.5C6.25 5.81 5.69 5.25 5 5.25C4.31 5.25 3.75 5.81 3.75 6.5V16.75C3.75 19.23 5.77 21.25 8.25 21.25H18.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 9H16M9.5 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ReportsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 18.5V10.5M12 18.5V6.5M18 18.5V13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.75 19.25H19.25M6 8.5L12 4.75L18 11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 6.75H19.25M7.75 12H16.25M10.75 17.25H13.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 19.25L8.31 18.44C8.76 18.34 9.18 18.11 9.51 17.78L18.28 9.01C19.24 8.05 19.24 6.49 18.28 5.53C17.32 4.57 15.76 4.57 14.8 5.53L6.03 14.3C5.7 14.63 5.47 15.05 5.37 15.5L4.75 19.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.75L17.25 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 5.75H7.5C6.81 5.75 6.25 6.31 6.25 7V17C6.25 17.69 6.81 18.25 7.5 18.25H10M14 8.5L17.5 12M17.5 12L14 15.5M17.5 12H10.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.25C13.5188 12.25 14.75 11.0188 14.75 9.5C14.75 7.98122 13.5188 6.75 12 6.75C10.4812 6.75 9.25 7.98122 9.25 9.5C9.25 11.0188 10.4812 12.25 12 12.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.75 18C7.84 16.14 9.74 14.88 12 14.88C14.26 14.88 16.16 16.14 17.25 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.75 7.25H18.25C18.8 7.25 19.25 7.7 19.25 8.25V15.75C19.25 16.3 18.8 16.75 18.25 16.75H5.75C5.2 16.75 4.75 16.3 4.75 15.75V8.25C4.75 7.7 5.2 7.25 5.75 7.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 8L12 12.75L18.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.25 10V8.5C8.25 6.43 9.93 4.75 12 4.75C14.07 4.75 15.75 6.43 15.75 8.5V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="6.25" y="10" width="11.5" height="9.25" rx="1.75" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13.5V15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.75L17.75 7V11.5C17.75 15.21 15.44 18.53 12 19.75C8.56 18.53 6.25 15.21 6.25 11.5V7L12 4.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 9V14.5M9.75 11.75H14.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.75 12C4.42 8.94 7.92 6.75 12 6.75C16.08 6.75 19.58 8.94 21.25 12C19.58 15.06 16.08 17.25 12 17.25C7.92 17.25 4.42 15.06 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7H19M5 12H19M5 17H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
