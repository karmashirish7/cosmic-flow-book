import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Copy, Check, Landmark } from "lucide-react";
import { useBrand } from "@/brand";
import { BANK_DETAILS, WHATSAPP_NUMBER, formatPayableAmount, type Region } from "@/pricing";
import { buildBookingMessage } from "@/lib/bookingMessage";

interface BankTransferModalProps {
  open: boolean;
  amount: number;
  region: Region;
  bookingData: Record<string, string>;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const BankTransferModal = ({
  open,
  amount,
  region,
  bookingData,
  onPaymentSuccess,
  onClose,
}: BankTransferModalProps) => {
  const brand = useBrand();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the value stays selectable on screen.
    }
  };

  const handleSendScreenshot = () => {
    const message = buildBookingMessage({
      brandName: brand.name,
      amount,
      region,
      bookingData,
      paymentLine: "Payment has been sent via bank transfer. Kindly find my payment receipt attached.",
    });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    onPaymentSuccess();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden max-h-[90vh] flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="px-6 pt-7 pb-4 text-center space-y-1 flex-shrink-0">
            <Landmark className="h-7 w-7 mx-auto mb-1" style={{ color: "#7B1A1A" }} />
            <h3 className="text-[17px] font-bold leading-snug" style={{ color: "#7B1A1A" }}>
              Payment Details
            </h3>
            <p className="text-sm" style={{ color: "#C05050" }}>
              Transfer {formatPayableAmount(amount, region)} to the account below, then send the receipt on WhatsApp.
            </p>
          </div>

          <div className="px-5 pb-4 overflow-y-auto">
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {BANK_DETAILS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleCopy(label, value)}
                  className="w-full flex items-start justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  aria-label={`Copy ${label}`}
                >
                  <span className="min-w-0 block">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {label}
                    </span>
                    <span className="block text-[13px] font-medium text-gray-800 break-words">
                      {value}
                    </span>
                  </span>
                  <span className="flex-shrink-0 mt-3 text-gray-400">
                    {copied === label ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5 space-y-3 flex-shrink-0 border-t border-gray-100 pt-4">
            <button
              onClick={handleSendScreenshot}
              className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20BC5A] active:bg-[#1AAD50] text-white font-semibold text-[15px] py-3.5 rounded-xl transition-colors shadow-sm"
            >
              <MessageCircle className="h-5 w-5" />
              Send Receipt to WhatsApp
            </button>

            <p className="text-[11px] text-center text-gray-400 leading-relaxed">
              International transfers may take 1–3 business days to arrive.
              <br />
              Your slot is held once we receive your receipt.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BankTransferModal;
