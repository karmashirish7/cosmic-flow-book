import { createContext, useContext } from "react";
import logoWebp from "@/assets/logo.webp";
import logoPng from "@/assets/logo-optimized.png";

export interface Brand {
  name: string;
  logoWebp?: string;
  logoPng: string;
}

export const AKASHVANI: Brand = {
  name: "Akashvani Astrology",
  logoWebp,
  logoPng,
};

// Logo lives in /public — drop the file at public/astrokarmaz-logo.png
export const ASTROKARMAZ: Brand = {
  name: "Astrokarmaz",
  logoPng: "/astrokarmaz-logo.png",
};

export const BrandContext = createContext<Brand>(AKASHVANI);
export const useBrand = () => useContext(BrandContext);
