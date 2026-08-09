import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-cosmic" style={{ opacity: 0.7 }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-6"
          >
            <span className="glass rounded-full px-5 py-2 text-xs font-medium tracking-widest uppercase text-gold-light">
              ✦ Vedic Astrology Consultations ✦
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-4"
          >
            <span className="text-foreground">Searching for </span>
            <span className="gradient-gold-text">Clarity</span>
            <span className="text-foreground"> in Life?</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6"
          >
            Personalized Vedic astrology consultation based on your exact birth details.
            Unlock the cosmic blueprint of your life.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <button
              onClick={scrollToBooking}
              className="btn-primary-glow rounded-full px-8 py-4 text-base font-semibold tracking-wide"
            >
              Book Your Consultation
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
