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
const BLANXER_STORE_ID = "652b9138aebd132f108cb75f";
const BLANXER_ORDER_URL = `https://api.blanxer.com/order/${BLANXER_STORE_ID}`;

// Product ID mapping
const getProductId = (service: string, location: string) => {
  if (service === "Love & Relationship") return "699b26e63ccc0711c1f85b0c";
  if (location === "outside") return "699744003ccc0711c1c52260";
  return "692157465d92ef3244969f12";
};

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
      const productId = getProductId(bookingData.service, bookingData.location);

      const res = await fetch(BLANXER_ORDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Referer": "https://cosmic-flow-book.lovable.app/",
        },
        body: JSON.stringify({
          products: [{ product: productId, variant: "", quantity: 1 }],
          customer_email: bookingData.email || "",
          customer_full_name: bookingData.name || "",
          customer_phone_number: bookingData.phone || "",
          customer_address: "",
          customer_address_landmark: "",
          customer_address_city: "",
          order_note: `${bookingData.service} consultation`,
          pan: "",
          company_name: "",
          paymentMethod: "fonepay",
          url: "https://cosmic-flow-book.lovable.app",
          coupon: "",
        }),
      });

      const orderData = await res.json();
      console.log("Blanxer order response:", orderData);

      if (!orderData.success) {
        console.error("Order creation failed:", orderData);
        alert("Failed to create payment order. Please try again.");
        return;
      }

      const qrData = orderData.qr_data;
      const qrMessage = qrData?.extras?.qrMessage || qrData?.qr_payload;
      const socketUrl = qrData?.extras?.merchantWebSocketUrl || qrData?.socket_url;

      setQrModal({
        open: true,
        qrUrl: qrMessage ? `https://api.blanxer.com/public/qr?q=${encodeURIComponent(qrMessage)}` : "",
        socketUrl: socketUrl || "",
        amount: Number(bookingData.amount),
      });
    } catch (err) {
      console.error("Error creating order:", err);
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
