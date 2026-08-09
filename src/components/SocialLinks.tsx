import { motion } from "framer-motion";
import { Instagram, Facebook } from "lucide-react";

const TikTok = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.01-2.82h-3.3v13.4a2.52 2.52 0 1 1-2.52-2.52c.26 0 .51.04.75.11v-3.36a5.87 5.87 0 0 0-.75-.05 5.88 5.88 0 1 0 5.88 5.88V8.9a7.56 7.56 0 0 0 4.35 1.37V6.96a4.28 4.28 0 0 1-3.4-1.14z" />
  </svg>
);

const socials = [
  { label: "Instagram", handle: "@astrokarmaz", href: "https://www.instagram.com/astrokarmaz/", Icon: Instagram },
  { label: "TikTok", handle: "@astro.karmaz", href: "https://www.tiktok.com/@astro.karmaz", Icon: TikTok },
  { label: "Facebook", handle: "Astrokarmaz", href: "https://www.facebook.com/profile.php?id=61576041172232", Icon: Facebook },
];

const SocialLinks = () => (
  <section id="socials" className="pt-8 pb-20 px-4 border-t border-border/30">
    <div className="container mx-auto max-w-4xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
          Stay Connected
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
          Follow <span className="gradient-gold-text">Us</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Daily astrology insights, reels and updates across our socials.
        </p>
        <div className="constellation-line w-24 mx-auto mt-6" />
      </motion.div>

      <div className="mt-12 flex flex-col sm:flex-row items-stretch justify-center gap-5">
        {socials.map(({ label, handle, href, Icon }, i) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group flex flex-1 items-center gap-4 rounded-2xl glass px-6 py-5 border border-gold/30 transition-all hover:bg-gold/10 hover:-translate-y-1"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover:bg-gold/20">
              <Icon className="h-6 w-6" />
            </span>
            <div className="text-left">
              <div className="font-serif font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{handle}</div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default SocialLinks;
