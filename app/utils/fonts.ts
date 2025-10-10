// app/fonts.ts
import { Dancing_Script, Caveat, Shadows_Into_Light } from "next/font/google";

export const dancingScript = Dancing_Script({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});
