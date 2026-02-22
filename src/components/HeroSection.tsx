import { motion } from "framer-motion";
import { Play, ArrowDown } from "lucide-react";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-cosmic" style={{ opacity: 0.7 }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
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
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
          >
            <span className="text-foreground">Still Searching for </span>
            <span className="gradient-gold-text">Clarity</span>
            <span className="text-foreground"> in Life's Biggest Decisions?</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Personalized Vedic astrology consultation based on your exact birth details.
            Unlock the cosmic blueprint of your life.
          </motion.p>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden glass-strong glow-nebula mb-10"
          >
            {!isPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center bg-cosmic-deep/60">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <button
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-primary/90 glow-gold transition-all duration-300 hover:scale-110"
                  aria-label="Play introduction video"
                >
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                </button>
                <p className="absolute bottom-6 text-sm text-muted-foreground">
                  Watch our introduction video
                </p>
              </div>
            ) : (
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Akashvani Astrology Introduction"
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </motion.div>

          {/* CTAs below video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={scrollToBooking}
              className="btn-primary-glow rounded-full px-8 py-4 text-base font-semibold tracking-wide"
            >
              Book Your Consultation
            </button>
            <button
              onClick={scrollToServices}
              className="btn-secondary-ghost rounded-full px-8 py-4 text-base tracking-wide"
            >
              View Consultation Types
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ArrowDown className="h-5 w-5 text-gold/50 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
