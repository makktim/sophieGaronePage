const HeartIcon = ({ size = 20, color = "#f0ede6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill={color}
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2l-2.6-2.6c-1.7-1.7-4.5-1.7-6.2 0s-1.7 4.5 0 6.2l2.6 2.6L12 21l6.2-6.2 2.6-2.6c1.7-1.7 1.7-4.5 0-6.2z" />
  </svg>
);

export default HeartIcon;
