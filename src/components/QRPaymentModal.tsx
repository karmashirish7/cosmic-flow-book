import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Share2 } from "lucide-react";
import fonepayQr from "@/assets/fonepay-qr.png";

interface QRPaymentModalProps {
  open: boolean;
  amount: number;
  bookingData: Record<string, string>;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const QRPaymentModal = ({
  open,
  amount,
  bookingData,
  onPaymentSuccess,
  onClose,
}: QRPaymentModalProps) => {
  const handleSendScreenshot = () => {
    const birthDetails = [bookingData.dob, bookingData.birthTime, bookingData.birthPlace]
      .filter(Boolean)
      .join(", ");

    const lines = [
      `Namaste! I'd like to confirm my consultation booking with *Akashvani Astrology*.`,
      ``,
      `*Booking Details:*`,
      `• *Service:* ${bookingData.service}`,
      `• *Amount Paid:* NPR ${Number(amount || 0).toLocaleString()}`,
      `• *Preferred Date:* ${formatDate(bookingData.date)}`,
      `• *Preferred Time:* ${bookingData.time}`,
      bookingData.email ? `• *Email:* ${bookingData.email}` : null,
      `• *Phone:* ${bookingData.phone}`,
    ];

    if (birthDetails) {
      lines.push(``, `*Birth Details:*`, `${birthDetails}`);
    }

    if (bookingData.notes) {
      lines.push(``, `*Notes:*`, `${bookingData.notes}`);
    }

    lines.push(
      ``,
      `Payment has been completed. Kindly find my payment screenshot attached.`
    );

    const message = lines.filter((l) => l !== null).join("\n");
    window.open(`https://wa.me/9779705216077?text=${encodeURIComponent(message)}`, "_blank");
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
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-7 pb-4 text-center space-y-1">
            <h3 className="text-[17px] font-bold leading-snug" style={{ color: "#7B1A1A" }}>
              Please pay NPR {Number(amount || 0).toLocaleString()} and<br />
              send the screenshot on WhatsApp
            </h3>
            <p className="text-sm" style={{ color: "#C05050" }}>
              Scan the QR code below to make payment via Fonepay
            </p>
          </div>

          {/* Bank card + QR */}
          <div className="mx-5 mb-4 rounded-xl border border-rose-100 overflow-hidden shadow-sm">
            {/* Account card */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-rose-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-[13px] text-gray-800 leading-tight">
                    AKASHVANI ASTROLOGY PVT. LTD.
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">NABIL BANK LIMITED</p>
                  <p className="text-[12px] text-gray-600 font-mono mt-0.5">17001017502926</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                  <Share2 className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Lubhu, Lalitpur Branch</p>
            </div>

            {/* QR Code */}
            <div className="bg-white px-6 py-4 flex justify-center">
              <div className="border border-gray-200 rounded-lg p-2">
                <img
                  src={fonepayQr}
                  alt="Fonepay QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>
            </div>

            {/* Fonepay footer */}
            <div className="bg-gray-50 border-t border-rose-100 py-2 flex items-center justify-center gap-1.5">
              <span className="text-[11px] font-semibold text-red-600 tracking-wide">fone</span>
              <span className="text-[11px] font-bold text-gray-700">pay</span>
              <span className="text-[10px] text-gray-400 ml-1">· Accepted here</span>
            </div>
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
