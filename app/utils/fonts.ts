import { Dancing_Script, Caveat } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const dancing = Dancing_Script({
  subsets: ["latin-ext"],
  weight: ["400", "700"], 
  display: "swap",
  variable: "--font-caveat", 
});
