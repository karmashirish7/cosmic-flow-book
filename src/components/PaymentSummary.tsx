import { motion } from "framer-motion";
import { CreditCard, Shield } from "lucide-react";

interface PaymentSummaryProps {
  data: Record<string, string>;
  onPay: () => void;
  onBack: () => void;
}

const PaymentSummary = ({ data, onPay, onBack }: PaymentSummaryProps) => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-8 space-y-6"
        >
          <div className="text-center">
            <CreditCard className="h-10 w-10 text-gold mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold">Payment Summary</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Client</span>
              <span className="text-foreground font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Service</span>
              <span className="text-foreground font-medium">{data.service}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-foreground font-medium">{data.date} at {data.time}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Assigned To</span>
              <span className="text-foreground font-medium">{data.assignedTo}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-foreground font-semibold text-base">Total</span>
              <span className="text-gold font-bold text-lg">NPR {Number(data.amount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 text-gold" />
            <span>Secure payment. Your data is encrypted.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 btn-secondary-ghost rounded-xl py-3 text-sm"
            >
              Back
            </button>
            <button
              onClick={onPay}
              className="flex-1 btn-primary-glow rounded-xl py-3 text-sm font-semibold"
            >
              Pay Now
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PaymentSummary;
