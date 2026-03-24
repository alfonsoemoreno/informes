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
