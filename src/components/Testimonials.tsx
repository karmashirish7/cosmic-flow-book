import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "P. Shrestha", location: "Kathmandu, Nepal", text: "I had a positive experience overall. I wasn't entirely sure what questions to ask at first, but you guided the conversation well and answered my concerns thoughtfully. The session was helpful, informative, detailed and easy to understand.", rating: 5 },
  { name: "R. Gurung", location: "Pokhara, Nepal", text: "Mero birth chart ekdam sahi thiyo. Career ko baare ma diyeko salah le thulo decision confidently garna sajilo banayo. Dhanyabaad!", rating: 5 },
  { name: "A. Karki", location: "Lalitpur, Nepal", text: "I am very satisfied with the online consultation. It was professional, informative, and easy to understand. I truly appreciate the support and guidance. I highly recommend this service.", rating: 5 },
  { name: "G. Tamang", location: "Dharan, Nepal", text: "Pahila ta malai bishwas thiena, tara relationship ko timing ko prediction ekdam thik nikliyo. Saanchai talented hunuhuncha.", rating: 5 },
  { name: "B. Thapa", location: "Bhaktapur, Nepal", text: "The remedies suggested were practical and effective. I noticed positive changes within a few weeks of the consultation.", rating: 5 },
  { name: "H. Poudel", location: "Butwal, Nepal", text: "Business suru garne timing ko prediction ekdam sateek thiyo. Diyeko paisa ko purai value paye.", rating: 5 },
  { name: "S. Adhikari", location: "Biratnagar, Nepal", text: "My matchmaking session was so thorough — far beyond a simple Guna Milan score. Chart-by-chart analysis was eye-opening.", rating: 5 },
  { name: "M. Rai", location: "Itahari, Nepal", text: "In-depth consultation ma sabai divisional chart herinu bhayo. Aaune barsha ko lagi ekdam clear plan liyera farkiye.", rating: 5 },
  { name: "N. Basnet", location: "Chitwan, Nepal", text: "Genuinely helpful guidance. The gemstone remedy suggested has made a noticeable difference in my daily life.", rating: 5 },
  { name: "D. Bhandari", location: "Nepalgunj, Nepal", text: "Pahilo session ko prediction kehi mahina mai sahi bhayo. Tyasaile turantai follow-up book gare.", rating: 5 },
  { name: "K. Khadka", location: "Janakpur, Nepal", text: "Professional and compassionate. The recording of the session let me revisit the reading whenever I needed it.", rating: 5 },
  { name: "S. Magar", location: "Hetauda, Nepal", text: "Mero career ka prashna haru ko ekdam clear jawaf paye. Kunai vague kura bhaena, sabai practical thiyo.", rating: 4 },
];

const Card = ({ t }: { t: (typeof testimonials)[number] }) => (
  <div className="rounded-2xl border border-border/60 bg-card p-6 w-[300px] shrink-0 flex flex-col shadow-sm">
    <div className="flex gap-1 mb-4">
      {Array.from({ length: t.rating }).map((_, j) => (
        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
    <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic flex-1">
      "{t.text}"
    </p>
    <div>
      <p className="font-semibold text-foreground text-sm">{t.name}</p>
      <p className="text-xs text-muted-foreground">{t.location}</p>
    </div>
  </div>
);

const Testimonials = () => {
  return (
    <section id="testimonials" className="pt-8 pb-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10 px-4"
      >
        <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
          Testimonials
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
          What Our <span className="gradient-gold-text">Clients</span> Say
        </h2>
        <div className="constellation-line w-24 mx-auto mt-6" />
      </motion.div>

      {/* Auto-scrolling, infinitely repeating track (pauses on hover) */}
      <div className="marquee-group relative">
        <div className="flex w-max animate-marquee gap-6">
          {[...testimonials, ...testimonials].map((t, i) => (
            <Card key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
};

export default Testimonials;
