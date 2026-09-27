import { useBrand } from "@/brand";

const Navbar = () => {
  const brand = useBrand();

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
      </div>
    </nav>
  );
};

export default Navbar;
