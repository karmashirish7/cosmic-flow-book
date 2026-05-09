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

const WEBHOOK_URL = "https://n8n.blanxer.tech/webhook/62380a50-80c2-4fd7-b550-a8b5217be694";

type FlowStep = "landing" | "payment" | "success";

const Index = () => {
  const [step, setStep] = useState<FlowStep>("landing");
  const [bookingData, setBookingData] = useState<Record<string, string>>({});
  const [qrModal, setQrModal] = useState({ open: false, amount: 0 });

  const handleBookingSubmit = useCallback((data: Record<string, string>) => {
    setBookingData(data);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePayNow = useCallback(() => {
    setQrModal({ open: true, amount: Number(bookingData.amount) || 0 });
  }, [bookingData.amount]);

  const handlePaymentSuccess = useCallback(async () => {
    setQrModal((prev) => ({ ...prev, open: false }));

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
          />
        )}

        {step === "success" && <SuccessScreen data={bookingData} />}
      </div>

      <WhatsAppButton />

      <QRPaymentModal
        open={qrModal.open}
        amount={qrModal.amount}
        bookingData={bookingData}
        onPaymentSuccess={handlePaymentSuccess}
        onClose={() => setQrModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default Index;
