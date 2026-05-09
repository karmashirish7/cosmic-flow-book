import { useState } from "react";
import { Menu, X } from "lucide-react";
import logoWebp from "@/assets/logo.webp";
import logoPng from "@/assets/logo-optimized.png";

const navLinks = [
  { label: "Services", target: "services" },
  { label: "Testimonials", target: "testimonials" },
  { label: "FAQ", target: "faq" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20">
      <div className="container mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <picture
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <source srcSet={logoWebp} type="image/webp" />
          <img
            src={logoPng}
            alt="Akashvani Astrology"
            width={300}
            height={96}
            className="h-10 md:h-12 w-auto"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("booking")}
            className="btn-primary-glow rounded-full px-5 py-2 text-xs font-semibold"
          >
            Book Now
          </button>
        </div>

        {/* Mobile burger */}
        <button
          className="sm:hidden text-muted-foreground hover:text-gold transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden glass border-t border-border/20 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="text-sm text-muted-foreground hover:text-gold transition-colors text-left py-1"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("booking")}
            className="btn-primary-glow rounded-full px-5 py-2.5 text-xs font-semibold mt-1"
          >
            Book Now
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
