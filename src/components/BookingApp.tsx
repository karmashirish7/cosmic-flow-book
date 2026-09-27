import { useState, useCallback, useEffect } from "react";
import { MapPin, Globe2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import RegionGate from "@/components/RegionGate";
import BookingForm from "@/components/BookingForm";
import Testimonials from "@/components/Testimonials";
import SocialLinks from "@/components/SocialLinks";
import PaymentSummary from "@/components/PaymentSummary";
import SuccessScreen from "@/components/SuccessScreen";
import WhatsAppButton from "@/components/WhatsAppButton";
import QRPaymentModal from "@/components/QRPaymentModal";
import BankTransferModal from "@/components/BankTransferModal";
import { BrandContext, type Brand } from "@/brand";
import { CURRENCY, type PaymentMethod, type Region } from "@/pricing";

const WEBHOOK_URL = "https://n8n.blanxer.tech/webhook/62380a50-80c2-4fd7-b550-a8b5217be694";

/** Remembered for the tab session so a refresh mid-booking doesn't re-ask. */
const REGION_KEY = "booking-region";

const readStoredRegion = (): Region | null => {
  try {
    const stored = sessionStorage.getItem(REGION_KEY);
    return stored === "nepal" || stored === "international" ? stored : null;
  } catch {
    return null;
  }
};

type FlowStep = "landing" | "payment" | "success";

interface BookingAppProps {
  brand: Brand;
  themeClass?: string;
  showStarField?: boolean;
}

const BookingApp = ({ brand, themeClass, showStarField = true }: BookingAppProps) => {
  const [region, setRegion] = useState<Region | null>(readStoredRegion);
  const [step, setStep] = useState<FlowStep>("landing");
  const [bookingData, setBookingData] = useState<Record<string, string>>({});
  const [payModal, setPayModal] = useState<{ method: PaymentMethod | null; amount: number }>({
    method: null,
    amount: 0,
  });

  // Apply the theme at the <html> level so Radix portals (dropdowns, toasts) inherit it too.
  useEffect(() => {
    if (!themeClass) return;
    document.documentElement.classList.add(themeClass);
    return () => document.documentElement.classList.remove(themeClass);
  }, [themeClass]);

  const handleSelectRegion = useCallback((value: Region) => {
    setRegion(value);
    try {
      sessionStorage.setItem(REGION_KEY, value);
    } catch {
      // Storage unavailable (private mode) — the choice still holds for this render.
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  /** Sends the client back to the gate; pricing and payment options re-derive from the new answer. */
  const handleChangeRegion = useCallback(() => {
    setRegion(null);
    setStep("landing");
    try {
      sessionStorage.removeItem(REGION_KEY);
    } catch {
      // Ignore — clearing is best-effort.
    }
  }, []);

  const handleBookingSubmit = useCallback((data: Record<string, string>) => {
    setBookingData(data);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePayNow = useCallback((method: PaymentMethod) => {
    setPayModal({ method, amount: Number(bookingData.amount) || 0 });
  }, [bookingData.amount]);

  const closePayModal = useCallback(() => {
    setPayModal((prev) => ({ ...prev, method: null }));
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    const method = payModal.method;
    setPayModal((prev) => ({ ...prev, method: null }));

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
          currency: region ? CURRENCY[region] : undefined,
          client_region: region === "nepal" ? "Within Nepal" : "Outside Nepal",
          payment_method: method === "bank" ? "Bank Transfer" : "QR (Fonepay)",
          notes: bookingData.notes,
          payment_status: "paid",
          brand: brand.name,
        }),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }

    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [bookingData, brand.name, region, payModal.method]);

  const handleBack = useCallback(() => {
    setStep("landing");
  }, []);

  return (
    <BrandContext.Provider value={brand}>
      <div className="min-h-screen bg-cosmic relative">
        {showStarField && <StarField />}

        <div className="relative z-10">
          {/* The region answer gates the site — nothing else renders until it is given. */}
          {region === null ? (
            <RegionGate onSelect={handleSelectRegion} />
          ) : (
            <>
              {step === "landing" && (
                <>
                  <Navbar />
                  <div className="h-24 md:h-32" />

                  <div className="px-4 mb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleChangeRegion}
                      className="glass inline-flex items-center gap-2 rounded-full border border-border/50 px-4 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
                    >
                      {region === "nepal" ? (
                        <MapPin className="h-3 w-3 text-gold" />
                      ) : (
                        <Globe2 className="h-3 w-3 text-gold" />
                      )}
                      <span>
                        Booking from{" "}
                        <strong className="font-semibold text-foreground">
                          {region === "nepal" ? "within Nepal" : "outside Nepal"}
                        </strong>{" "}
                        · prices in {CURRENCY[region]}
                      </span>
                      <span className="text-gold underline underline-offset-2">Change</span>
                    </button>
                  </div>

                  <BookingForm region={region} onSubmit={handleBookingSubmit} />
                  <Testimonials />
                  <SocialLinks />

                  <footer className="py-12 px-4 text-center border-t border-border/30">
                    <p className="font-serif text-lg gradient-gold-text mb-2">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      © 2026 {brand.name}. All rights reserved.
                    </p>
                  </footer>
                </>
              )}

              {step === "payment" && (
                <PaymentSummary
                  data={bookingData}
                  region={region}
                  onPay={handlePayNow}
                  onBack={handleBack}
                />
              )}

              {step === "success" && <SuccessScreen data={bookingData} region={region} />}
            </>
          )}
        </div>

        <WhatsAppButton />

        {region !== null && (
          <>
            <QRPaymentModal
              open={payModal.method === "qr"}
              amount={payModal.amount}
              region={region}
              bookingData={bookingData}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={closePayModal}
            />

            <BankTransferModal
              open={payModal.method === "bank"}
              amount={payModal.amount}
              region={region}
              bookingData={bookingData}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={closePayModal}
            />
          </>
        )}
      </div>
    </BrandContext.Provider>
  );
};

export default BookingApp;
