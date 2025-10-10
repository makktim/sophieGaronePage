const StarIcon = ({ size = 20, color = "#f0ede6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
  >
    <path
      d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.818 
             1.48 8.276L12 18.896l-7.416 4.504 
             1.48-8.276-6.064-5.818 
             8.332-1.151L12 .587z"
    />
  </svg>
);

export default StarIcon;
