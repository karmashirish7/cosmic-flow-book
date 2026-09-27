import { motion } from "framer-motion";
import { MapPin, Globe2 } from "lucide-react";
import { useBrand } from "@/brand";
import type { Region } from "@/pricing";

interface RegionGateProps {
  onSelect: (region: Region) => void;
}

const options: {
  region: Region;
  label: string;
  hint: string;
  Icon: typeof MapPin;
}[] = [
  {
    region: "nepal",
    label: "Within Nepal",
    hint: "Pay in NPR via Fonepay QR",
    Icon: MapPin,
  },
  {
    region: "international",
    label: "Outside Nepal",
    hint: "Pay in USD via QR or bank transfer",
    Icon: Globe2,
  },
];

const RegionGate = ({ onSelect }: RegionGateProps) => {
  const brand = useBrand();

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong rounded-2xl p-7 md:p-10 w-full max-w-xl text-center"
      >
        <picture>
          {brand.logoWebp && <source srcSet={brand.logoWebp} type="image/webp" />}
          <img
            src={brand.logoPng}
            alt={brand.name}
            width={300}
            height={96}
            className="h-20 md:h-24 w-auto mx-auto mb-5"
            {...{ fetchpriority: "high" }}
            decoding="async"
          />
        </picture>

        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3">
          Are you residing <span className="gradient-gold-text">within Nepal</span> or outside?
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          This sets your consultation pricing and the payment methods available to you.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {options.map(({ region, label, hint, Icon }) => (
            <button
              key={region}
              type="button"
              onClick={() => onSelect(region)}
              className="glass rounded-2xl border border-border/50 p-6 text-center transition-colors hover:border-gold/60 hover:bg-gold/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Icon className="h-7 w-7 text-gold mx-auto mb-3" />
              <span className="block font-serif text-base font-semibold text-foreground mb-1">
                {label}
              </span>
              <span className="block text-[11px] text-muted-foreground leading-relaxed">
                {hint}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-7 leading-relaxed">
          All consultations are held over WhatsApp or video call in Nepal Time (NPT), wherever you are.
        </p>
      </motion.div>
    </section>
  );
};

export default RegionGate;
