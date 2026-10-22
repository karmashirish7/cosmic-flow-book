import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useBrand } from "@/brand";

const Navbar = () => {
  const brand = useBrand();
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20">
      <div className="container relative mx-auto max-w-6xl flex items-center justify-center px-4 py-1">
        {/* Centered logo */}
        <picture
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {brand.logoWebp && <source srcSet={brand.logoWebp} type="image/webp" />}
          <img
            src={brand.logoPng}
            alt={brand.name}
            width={300}
            height={96}
            className="h-20 md:h-28 w-auto"
            {...{ fetchpriority: "high" }}
            decoding="async"
          />
        </picture>

        {pathname !== "/kundli" && (
          <Link
            to="/kundli"
            className="btn-primary-glow absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
          >
            <Sparkles className="h-4 w-4" /> Generate Kundli
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
