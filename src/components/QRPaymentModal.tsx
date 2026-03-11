import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QRPaymentModalProps {
  open: boolean;
  qrUrl: string;
  socketUrl: string;
  amount: number;
  orderId: string;
  transactionId: string;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

type PaymentStatus = "waiting" | "verified" | "success" | "error" | "expired";

const COUNTDOWN_SECONDS = 5 * 60;
const POLL_INTERVAL = 2000;

const QRPaymentModal = ({
  open,
  qrUrl,
  socketUrl,
  amount,
  orderId,
  transactionId,
  onPaymentSuccess,
  onClose,
}: QRPaymentModalProps) => {
  const [status, setStatus] = useState<PaymentStatus>("waiting");
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successHandledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback(async (transactionData?: any) => {
    if (successHandledRef.current) return;
    successHandledRef.current = true;

    setStatus("success");
    cleanup();

    // Confirm the order with Blanxer using the transaction ID from QR init
    try {
      const confirmPayload = {
        transaction: transactionId || orderId,
        purchaseCode: transactionData?.purchaseCode || transactionData?.prn || "",
      };
      console.log("Confirming order with Blanxer:", confirmPayload);

      const { data, error } = await supabase.functions.invoke("confirm-blanxer-order", {
        body: confirmPayload,
      });

      if (error) {
        console.error("Order confirmation failed:", error);
      } else {
        console.log("Order confirmed:", data);
      }
    } catch (err) {
      console.error("Error confirming order:", err);
    }

    setTimeout(() => onPaymentSuccess(), 1500);
  }, [orderId, transactionId, onPaymentSuccess, cleanup]);

  // Reset on open
  useEffect(() => {
    if (open) {
      successHandledRef.current = false;
      setStatus("waiting");
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;

    setTimeLeft(COUNTDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          cleanup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, cleanup]);

  // WebSocket connection
  useEffect(() => {
    if (!open || !socketUrl) return;

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
            handleSuccess(parsed);
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
      // Don't set error status — polling will continue as fallback
    };

    ws.onclose = () => {
      console.log("Socket closed");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [open, socketUrl, handleSuccess]);

  // Polling every 2 seconds as fallback (detects payment even if user switches windows)
  useEffect(() => {
    if (!open || !socketUrl) return;

    pollRef.current = setInterval(() => {
      if (successHandledRef.current) return;

      // Re-check WebSocket — if it's closed, try reconnecting
      if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED) {
        console.log("WebSocket closed, attempting reconnect...");
        try {
          const ws = new WebSocket(socketUrl);
          wsRef.current = ws;

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              const txStatus = data.transactionStatus;
              if (typeof txStatus === "string") {
                const parsed = JSON.parse(txStatus);
                if (parsed.paymentSuccess === true) {
                  handleSuccess(parsed);
                } else if (parsed.qrVerified === true) {
                  setStatus("verified");
                }
              }
            } catch (err) {
              console.error("Reconnected socket parse error:", err);
            }
          };
        } catch (err) {
          console.error("WebSocket reconnect failed:", err);
        }
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, socketUrl, handleSuccess]);

  if (!open) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isLowTime = timeLeft <= 60;

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

          {(status === "waiting" || status === "verified") && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-xl p-3">
                <img
                  src={qrUrl}
                  alt="Payment QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className={`flex items-center gap-2 text-sm font-mono ${isLowTime ? "text-destructive" : "text-muted-foreground"}`}>
                <Clock className={`h-4 w-4 ${isLowTime ? "animate-pulse" : ""}`} />
                <span>Expires in {formattedTime}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {status === "verified" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    QR Verified — Confirming payment...
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    Waiting for payment...
                  </>
                )}
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

          {status === "expired" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <Clock className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive">QR Expired</p>
              <p className="text-sm text-muted-foreground">The payment window has expired. Please try again.</p>
              <button
                onClick={onClose}
                className="btn-primary-glow rounded-xl px-6 py-2 text-sm"
              >
                Try Again
              </button>
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

          {(status === "waiting" || status === "verified") && (
            <p className="text-xs text-center text-muted-foreground">
              Scan with any Fonepay-supported banking app
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRPaymentModal;
