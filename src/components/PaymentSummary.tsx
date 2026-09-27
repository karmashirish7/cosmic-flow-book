import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Shield, QrCode, Landmark } from "lucide-react";
import { NPR_EQUIVALENT_NOTE, formatAmount, type PaymentMethod, type Region } from "@/pricing";

interface PaymentSummaryProps {
  data: Record<string, string>;
  region: Region;
  onPay: (method: PaymentMethod) => void;
  onBack: () => void;
}

const methods: {
  id: PaymentMethod;
  label: string;
  hint: string;
  Icon: typeof QrCode;
}[] = [
  { id: "qr", label: "QR Code", hint: "Scan & pay via Fonepay", Icon: QrCode },
  { id: "bank", label: "Bank Transfer", hint: "Wire to our account (SWIFT)", Icon: Landmark },
];

const PaymentSummary = ({ data, region, onPay, onBack }: PaymentSummaryProps) => {
  const [method, setMethod] = useState<PaymentMethod>("qr");

  // Clients in Nepal pay by QR only; the choice is offered to clients abroad.
  const showMethodChoice = region === "international";

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
              <span className="text-foreground font-medium">{data.date} at {data.time} NPT</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Assigned To</span>
              <span className="text-foreground font-medium">{data.assignedTo}</span>
            </div>
            <div className="flex justify-between items-baseline py-3">
              <span className="text-foreground font-semibold text-base">Total</span>
              <span className="text-right">
                <span className="text-gold font-bold text-lg">{formatAmount(data.amount, region)}</span>
                {region === "international" && (
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    {NPR_EQUIVALENT_NOTE}
                  </span>
                )}
              </span>
            </div>
          </div>

          {showMethodChoice && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-3">
                Choose a payment method
              </p>
              <div className="grid grid-cols-2 gap-3">
                {methods.map(({ id, label, hint, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    aria-pressed={method === id}
                    className={`rounded-xl p-4 text-center transition-colors ${
                      method === id
                        ? "border-2 border-gold bg-gold/10"
                        : "border border-border/50 hover:border-gold/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-gold mx-auto mb-2" />
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
              onClick={() => onPay(showMethodChoice ? method : "qr")}
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
