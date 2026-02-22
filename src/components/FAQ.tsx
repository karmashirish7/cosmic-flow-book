import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What information do I need for a consultation?",
    a: "You'll need your exact date of birth, time of birth (as accurate as possible), and place of birth. These details are essential for creating your precise birth chart (Kundli).",
  },
  {
    q: "How long does a typical session last?",
    a: "Sessions range from 30 to 75 minutes depending on the consultation type. Birth Chart Analysis is 60 minutes, while Muhurta Selection is 30 minutes.",
  },
  {
    q: "Do you offer online consultations?",
    a: "Yes! All consultations are conducted online via Zoom or Google Meet. You'll receive a link after booking. In-person sessions are available in Kathmandu by special request.",
  },
  {
    q: "What if I don't know my exact birth time?",
    a: "We can work with approximate times, though accuracy improves predictions. We also offer birth time rectification as part of our service to help determine your exact birth time.",
  },
  {
    q: "Is my information kept confidential?",
    a: "Absolutely. All personal data and consultation details are 100% confidential. We never share client information with third parties.",
  },
  {
    q: "Can I reschedule my appointment?",
    a: "Yes, you can reschedule up to 24 hours before your appointment at no extra charge. Contact us via WhatsApp for quick rescheduling.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            Common <span className="gradient-gold-text">Questions</span>
          </h2>
          <div className="constellation-line w-24 mx-auto mt-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-foreground font-medium hover:text-gold transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
