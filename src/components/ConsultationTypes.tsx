import { motion } from "framer-motion";
import { Star, Heart, Briefcase, Compass, GraduationCap, Sun } from "lucide-react";

const services = [
  {
    icon: Star,
    title: "In-Depth Birth Chart Analysis",
    description: "Complete Kundli reading with planetary positions, dashas, and life predictions.",
    price: "NPR 4,100",
    duration: "60 min",
  },
  {
    icon: Heart,
    title: "Love & Relationship",
    description: "Compatibility analysis, marriage timing, and relationship guidance.",
    price: "NPR 2,100",
    duration: "45 min",
  },
  {
    icon: Briefcase,
    title: "Career & Finance",
    description: "Professional direction, wealth yogas, and financial timing insights.",
    price: "NPR 2,100",
    duration: "45 min",
  },
  {
    icon: GraduationCap,
    title: "Foreign Education",
    description: "Education abroad prospects, best timing, and country selection guidance.",
    price: "NPR 2,100",
    duration: "45 min",
  },
  {
    icon: Compass,
    title: "Life Direction",
    description: "Purpose discovery, karmic patterns, and spiritual growth guidance.",
    price: "NPR 3,100",
    duration: "75 min",
  },
  {
    icon: Sun,
    title: "Muhurta Selection",
    description: "Auspicious timing for marriage, business, travel, and major life events.",
    price: "NPR 1,500",
    duration: "30 min",
  },
];

const ConsultationTypes = () => {
  const scrollToBooking = (serviceTitle: string) => {
    const bookingSection = document.getElementById("booking");
    bookingSection?.scrollIntoView({ behavior: "smooth" });
    // Dispatch custom event to prefill service
    window.dispatchEvent(new CustomEvent("prefill-service", { detail: serviceTitle }));
  };

  return (
    <section id="services" className="relative py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
            Our Services
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            <span className="gradient-gold-text">Consultation</span> Types
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the reading that resonates with your current life journey.
          </p>
          <div className="constellation-line w-24 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 group cursor-pointer transition-all duration-500 hover:glow-gold hover:border-gold-strong"
              onClick={() => scrollToBooking(service.title)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold text-foreground">{service.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gold font-semibold">{service.price}</span>
                <span className="text-muted-foreground">{service.duration}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConsultationTypes;
