import { useState, useCallback } from "react";
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

type FlowStep = "landing" | "payment" | "success";

const WEBHOOK_URL = ""; // Configure your CRM webhook URL here

const Index = () => {
  const [step, setStep] = useState<FlowStep>("landing");
  const [bookingData, setBookingData] = useState<Record<string, string>>({});

  const handleBookingSubmit = useCallback((data: Record<string, string>) => {
    setBookingData(data);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePayment = useCallback(async () => {
    // Send to CRM webhook
    if (WEBHOOK_URL) {
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
            <HeroSection />
            <TrustBadges />
            <ConsultationTypes />
            <WhatYouReceive />
            <BookingForm onSubmit={handleBookingSubmit} />
            <Testimonials />
            <FAQ />

            {/* Footer */}
            <footer className="py-12 px-4 text-center border-t border-border/30">
              <p className="font-serif text-lg gradient-gold-text mb-2">Akashvani Astrology</p>
              <p className="text-xs text-muted-foreground">
                © 2026 Akashvani Astrology. All rights reserved.
              </p>
            </footer>
          </>
        )}

        {step === "payment" && (
          <PaymentSummary data={bookingData} onPay={handlePayment} onBack={handleBack} />
        )}

        {step === "success" && <SuccessScreen data={bookingData} />}
      </div>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
