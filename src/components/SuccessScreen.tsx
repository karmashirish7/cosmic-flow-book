import { motion } from "framer-motion";
import { CheckCircle2, Calendar, MessageCircle } from "lucide-react";

interface SuccessScreenProps {
  data: Record<string, string>;
}

const SuccessScreen = ({ data }: SuccessScreenProps) => {
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.service + " - Akashvani Astrology")}&dates=${data.date?.replace(/-/g, "")}/${data.date?.replace(/-/g, "")}&details=${encodeURIComponent("Consultation with " + data.assignedTo)}`;

  const whatsappUrl = `https://wa.me/9779705216077?text=${encodeURIComponent(`Hi, I just booked a ${data.service} consultation on ${data.date} at ${data.time}. My name is ${data.name}.`)}`;

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="glass-strong rounded-2xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-gold" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground text-sm">
              Your consultation has been scheduled. We look forward to guiding you.
            </p>
          </div>

          <div className="glass rounded-xl p-5 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="text-foreground font-medium">{data.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-foreground font-medium">{data.date} at {data.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Astrologer</span>
              <span className="text-foreground font-medium">{data.assignedTo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-gold font-semibold">NPR {Number(data.amount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-secondary-ghost rounded-xl py-3 text-sm flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-primary-glow rounded-xl py-3 text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessScreen;
