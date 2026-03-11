import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Kathmandu, Nepal",
    text: "The birth chart analysis was incredibly accurate. The career guidance helped me make a major life decision with confidence.",
    rating: 5,
  },
  {
    name: "Rajesh Thapa",
    location: "Pokhara, Nepal",
    text: "I was skeptical at first, but the predictions about my relationship timing were spot on. Truly gifted astrologer.",
    rating: 5,
  },
  {
    name: "Sunita Devi",
    location: "Biratnagar, Nepal",
    text: "The remedies suggested were practical and effective. I've noticed positive changes within weeks of the consultation.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            What Our <span className="gradient-gold-text">Clients</span> Say
          </h2>
          <div className="constellation-line w-24 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                "{t.text}"
              </p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
