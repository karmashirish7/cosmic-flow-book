import { motion } from "framer-motion";
import { Shield, Users, Clock, Award } from "lucide-react";

const badges = [
  { icon: Users, value: "5,000+", label: "Consultations Done" },
  { icon: Clock, value: "12+", label: "Years Experience" },
  { icon: Award, value: "4.9/5", label: "Client Rating" },
  { icon: Shield, value: "100%", label: "Confidential" },
];

const TrustBadges = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <badge.icon className="h-5 w-5 text-gold" />
              </div>
              <div className="text-2xl font-serif font-bold gradient-gold-text">{badge.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{badge.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
