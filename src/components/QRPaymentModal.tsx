import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface QRPaymentModalProps {
  open: boolean;
  qrUrl: string;
  socketUrl: string;
  amount: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

type PaymentStatus = "waiting" | "verified" | "success" | "error";

const QRPaymentModal = ({
  open,
  qrUrl,
  socketUrl,
  amount,
  onPaymentSuccess,
  onClose,
}: QRPaymentModalProps) => {
  const [status, setStatus] = useState<PaymentStatus>("waiting");
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open || !socketUrl) return;

    setStatus("waiting");

    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to payment socket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const txStatus = data.transactionStatus;

        if (typeof txStatus === "string") {
          const parsed = JSON.parse(txStatus);

          if (parsed.paymentSuccess === true) {
            setStatus("success");
            cleanup();
            setTimeout(() => onPaymentSuccess(), 1500);
          } else if (parsed.qrVerified === true) {
            setStatus("verified");
          }
        }
      } catch (err) {
        console.error("Socket message parse error:", err);
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error");
      setStatus("error");
    };

    ws.onclose = () => {
      console.log("Socket closed");
    };

    return cleanup;
  }, [open, socketUrl, onPaymentSuccess, cleanup]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && status === "waiting" && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-strong rounded-2xl p-6 md:p-8 max-w-md w-full space-y-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-xl font-serif font-bold mb-1">Scan to Pay</h3>
            <p className="text-muted-foreground text-sm">
              NPR {amount.toLocaleString()}
            </p>
          </div>

          {status === "waiting" && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-xl p-3">
                <img
                  src={qrUrl}
                  alt="Payment QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                Waiting for payment...
              </div>
            </div>
          )}

          {status === "verified" && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-xl p-3">
                <img
                  src={qrUrl}
                  alt="Payment QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gold">
                <CheckCircle2 className="h-4 w-4" />
                QR Verified — Confirming payment...
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </motion.div>
              <p className="text-lg font-semibold text-green-400">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive">Connection Error</p>
              <p className="text-sm text-muted-foreground">Please try again.</p>
              <button
                onClick={onClose}
                className="btn-primary-glow rounded-xl px-6 py-2 text-sm"
              >
                Retry
              </button>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Scan with any Fonepay-supported banking app
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRPaymentModal;
