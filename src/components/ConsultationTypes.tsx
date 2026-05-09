import { motion } from "framer-motion";
import { Star, Heart, Compass } from "lucide-react";

const services = [
  {
    icon: Star,
    title: "General Consultation",
    description: "Answer your 4 most pressing questions about life, relationships, career, or any area you seek guidance on.",
  },
  {
    icon: Compass,
    title: "In-Depth Consultation",
    description: "A comprehensive reading covering your birth chart, current planetary periods, and detailed life guidance.",
  },
  {
    icon: Heart,
    title: "Matchmaking & Couple Consultation",
    description: "Compatibility analysis and relationship guidance for couples or those seeking their perfect match.",
  },
];

const ConsultationTypes = () => {
  const scrollToBooking = (serviceTitle: string) => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
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

        <div className="grid md:grid-cols-3 gap-6">
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
                <h3 className="font-serif font-semibold text-foreground">{service.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConsultationTypes;
