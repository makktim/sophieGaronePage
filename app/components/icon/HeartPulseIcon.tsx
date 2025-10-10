type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
  filled?: boolean;
};

export default function HeartPulseIcon({
  size = 36,
  color = "currentColor",
  className,
  title,
  filled = false,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {/* opcionális kitöltés a szív mögé */}
      {filled && (
        <path
          d="M24 41S6 31 6 18c0-5.5 4.5-10 10-10 3.9 0 7.3 2.2 9 5.4C26.7 10.2 30.1 8 34 8c5.5 0 10 4.5 10 10 0 13-18 23-20 23z"
          fill="currentColor"
          opacity=".25"
        />
      )}
      {/* szív körvonal */}
      <path
        d="M24 41S6 31 6 18c0-5.5 4.5-10 10-10 3.9 0 7.3 2.2 9 5.4C26.7 10.2 30.1 8 34 8c5.5 0 10 4.5 10 10 0 13-18 23-20 23z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* pulzus vonal */}
      <path
        d="M12 19h8l2.5-5 4 12 3-7H36"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
