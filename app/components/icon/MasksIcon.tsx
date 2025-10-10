type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

export default function MasksIcon({
  size = 36,
  color = "currentColor",
  className,
  title,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role="img"
    >
      {title && <title>{title}</title>}
      {/* háttér maszk (hátrébb) */}
      <path d="M19 7c0 7-4 11-9 11-1.5 0-3-.3-4.5-1 0 7 3 12 9 15 6-3 9-8 9-15 0-3.6-1.8-7-4.5-10z" />
      {/* fő maszk */}
      <path d="M43 14c0 8-4.5 13-11 15-6.5-2-11-7-11-15 0-6 4.9-10 11-10s11 4 11 10z" />
      {/* szemek és száj a fő maszkhoz */}
      <path d="M26 16c1 .8 2 .8 3 0M37 16c1 .8 2 .8 3 0M28 21c2 1.6 5 1.6 7 0" />
    </svg>
  );
}
