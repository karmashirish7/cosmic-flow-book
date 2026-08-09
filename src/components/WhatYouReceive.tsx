import { motion } from "framer-motion";
import { Video, MessageSquare, BookOpen } from "lucide-react";

const items = [
  { icon: Video, title: "Live Video Session", desc: "One-on-one consultation via Zoom or Google Meet" },
  { icon: BookOpen, title: "Personalized Remedies", desc: "Mantras, gemstones, and rituals tailored to you" },
  { icon: MessageSquare, title: "Recording Access", desc: "Full recording of your session for future reference" },
];

const WhatYouReceive = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
            What's Included
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            What You'll <span className="gradient-gold-text">Receive</span>
          </h2>
          <div className="constellation-line w-24 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 p-4 rounded-xl glass"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatYouReceive;
