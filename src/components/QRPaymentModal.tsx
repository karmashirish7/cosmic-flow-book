import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import fonepayQr from "@/assets/fonepay-qr.png";
import { useBrand } from "@/brand";
import { NPR_EQUIVALENT_NOTE, WHATSAPP_NUMBER, formatAmount, type Region } from "@/pricing";
import { buildBookingMessage } from "@/lib/bookingMessage";

interface QRPaymentModalProps {
  open: boolean;
  amount: number;
  region: Region;
  bookingData: Record<string, string>;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const QRPaymentModal = ({
  open,
  amount,
  region,
  bookingData,
  onPaymentSuccess,
  onClose,
}: QRPaymentModalProps) => {
  const brand = useBrand();

  const handleSendScreenshot = () => {
    const message = buildBookingMessage({
      brandName: brand.name,
      amount,
      region,
      bookingData,
      paymentLine: "Payment has been completed. Kindly find my payment screenshot attached.",
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
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-7 pb-4 text-center space-y-1">
            <h3 className="text-[17px] font-bold leading-snug" style={{ color: "#7B1A1A" }}>
              Please pay {formatAmount(amount, region)}
              {region === "international" && (
                <span className="font-semibold"> {NPR_EQUIVALENT_NOTE}</span>
              )}{" "}
              and<br />
              send the screenshot on WhatsApp
            </h3>
            <p className="text-sm" style={{ color: "#C05050" }}>
              Scan the QR code below to make payment via Fonepay
            </p>
          </div>

          {/* QR Code */}
          <div className="mx-5 mb-4 flex justify-center">
            <img
              src={fonepayQr}
              alt="Fonepay QR Code"
              className="w-56 h-56 object-contain rounded-xl"
            />
          </div>

          {/* WhatsApp button */}
          <div className="px-5 pb-5 space-y-3">
            <button
              onClick={handleSendScreenshot}
              className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20BC5A] active:bg-[#1AAD50] text-white font-semibold text-[15px] py-3.5 rounded-xl transition-colors shadow-sm"
            >
              <MessageCircle className="h-5 w-5" />
              Send Screenshot to WhatsApp
            </button>

            <p className="text-[11px] text-center text-gray-400 leading-relaxed">
              After paying, tap the button above and attach your<br />payment screenshot to confirm your booking.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRPaymentModal;
