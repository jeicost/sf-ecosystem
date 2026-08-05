type IconName =
  | "arrow-up-right"
  | "arrow-right"
  | "pin"
  | "compass"
  | "calendar"
  | "buddy"
  | "star"
  | "heart"
  | "search"
  | "app-store"
  | "google-play"
  | "menu"
  | "x";

const paths: Record<IconName, React.ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  "arrow-up-right": <path d="M7 17 17 7M9 7h8v8" />,
  "arrow-right": <path d="M5 12h14m-5-5 5 5-5 5" />,
  pin: (
    <>
      <path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  compass: <path d="M12 3v6m0 6v6M3 12h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  buddy: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M3 19a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6m5 14a6 6 0 0 0-4-5.7" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.8 1-6L3.2 9.5l6.1-.9L12 3Z" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  "app-store": (
    <path d="M16.5 12.6c0-2.7 2.2-4 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.6-.2-3.2.9-4 .9-.8 0-2.1-.9-3.5-.9-1.8 0-3.5 1-4.4 2.7-1.9 3.2-.5 8 1.4 10.6.9 1.3 2 2.7 3.4 2.7 1.4-.1 1.9-.9 3.5-.9 1.7 0 2.1.9 3.6.9 1.5 0 2.4-1.3 3.3-2.6.7-1 1.3-2.1 1.7-3.3-1.5-.5-3.4-2.1-3.4-4ZM14 4.7c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5Z" />
  ),
  "google-play": (
    <>
      <path d="m4 3 12 9-12 9V3Z" />
      <path d="m4 3 16 9-16 9" />
    </>
  ),
};

const filled: IconName[] = ["star", "app-store"];

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const isFilled = filled.includes(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
