import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import ConsultationTypes from "@/components/ConsultationTypes";
import WhatYouReceive from "@/components/WhatYouReceive";
import BookingForm from "@/components/BookingForm";
import PaymentSummary from "@/components/PaymentSummary";
import SuccessScreen from "@/components/SuccessScreen";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import WhatsAppButton from "@/components/WhatsAppButton";
import QRPaymentModal from "@/components/QRPaymentModal";
import { supabase } from "@/integrations/supabase/client";

const WEBHOOK_URL = "https://n8n.blanxer.tech/webhook/62380a50-80c2-4fd7-b550-a8b5217be694";

type FlowStep = "landing" | "payment" | "success";

const Index = () => {
  const [step, setStep] = useState<FlowStep>("landing");
  const [bookingData, setBookingData] = useState<Record<string, string>>({});
  const [qrModal, setQrModal] = useState({
    open: false,
    qrUrl: "",
    socketUrl: "",
    amount: 0,
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handleBookingSubmit = useCallback((data: Record<string, string>) => {
    setBookingData(data);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePayNow = useCallback(async () => {
    setIsCreatingOrder(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-blanxer-order", {
        body: {
          name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email || "",
          address: bookingData.birthPlace || "",
          notes: bookingData.notes || "",
          service: bookingData.service,
        },
      });

      if (error || !data?.success) {
        console.error("Order creation failed:", error || data);
        alert("Failed to create payment order. Please try again.");
        return;
      }

      console.log("Blanxer order + QR response:", data);

      const qrData = data.qr;
      const qrMessage = qrData?.qr_message || qrData?.extras?.qrMessage;
      const socketUrl = qrData?.socket_url || qrData?.extras?.merchantWebSocketUrl;

      setQrModal({
        open: true,
        qrUrl: qrMessage
          ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrMessage)}`
          : "",
        socketUrl: socketUrl || "",
        amount: Number(bookingData.amount) || qrData?.amount || 0,
      });
    } catch (err) {
      console.error("Error initiating payment:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  }, [bookingData]);

  const handlePaymentSuccess = useCallback(async () => {
    setQrModal((prev) => ({ ...prev, open: false }));

    // Send to webhook
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email,
          dob: bookingData.dob,
          birth_time: bookingData.birthTime,
          birth_place: bookingData.birthPlace,
          consultation_type: bookingData.service,
          consultation_datetime: `${bookingData.date}T${bookingData.time}`,
          assigned_to: bookingData.assignedTo,
          amount: bookingData.amount,
          notes: bookingData.notes,
          payment_status: "paid",
        }),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }

    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [bookingData]);

  const handleBack = useCallback(() => {
    setStep("landing");
  }, []);

  return (
    <div className="min-h-screen bg-cosmic relative">
      <StarField />

      <div className="relative z-10">
        {step === "landing" && (
          <>
            <Navbar />
            <HeroSection />
            <TrustBadges />
            <ConsultationTypes />
            <WhatYouReceive />
            <BookingForm onSubmit={handleBookingSubmit} />
            <Testimonials />
            <FAQ />

            <footer className="py-12 px-4 text-center border-t border-border/30">
              <p className="font-serif text-lg gradient-gold-text mb-2">Akashvani Astrology</p>
              <p className="text-xs text-muted-foreground">
                © 2026 Akashvani Astrology. All rights reserved.
              </p>
            </footer>
          </>
        )}

        {step === "payment" && (
          <PaymentSummary
            data={bookingData}
            onPay={handlePayNow}
            onBack={handleBack}
            isLoading={isCreatingOrder}
          />
        )}

        {step === "success" && <SuccessScreen data={bookingData} />}
      </div>

      <WhatsAppButton />

      <QRPaymentModal
        open={qrModal.open}
        qrUrl={qrModal.qrUrl}
        socketUrl={qrModal.socketUrl}
        amount={qrModal.amount}
        onPaymentSuccess={handlePaymentSuccess}
        onClose={() => setQrModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default Index;
