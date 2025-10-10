type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

export default function BoltIcon({
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
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role="img"
    >
      {title && <title>{title}</title>}
      <path d="M28 4 10 28h12l-2 16 18-24H26l2-16z" />
    </svg>
  );
}
