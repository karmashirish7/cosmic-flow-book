import { createContext, useContext } from "react";

export interface Brand {
  name: string;
  logoWebp?: string;
  logoPng: string;
}

// Logo lives in /public — drop the file at public/astrokarmaz-logo.png
export const ASTROKARMAZ: Brand = {
  name: "Astrokarmaz",
  logoPng: "/astrokarmaz-logo.png",
};

export const BrandContext = createContext<Brand>(ASTROKARMAZ);
export const useBrand = () => useContext(BrandContext);
