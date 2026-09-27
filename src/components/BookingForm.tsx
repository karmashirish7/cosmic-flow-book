import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, MessageCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrand } from "@/brand";
import { CURRENCY, NPR_EQUIVALENT_NOTE, SERVICES, formatAmount, priceFor, type Region } from "@/pricing";

const fmt12 = (h: number, m: number) => {
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
};

// 7:00 AM → 8:30 PM NPT, every 30 min
const NPT_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  return { h: Math.floor(total / 60), m: total % 60 };
});

/** Fields the booking cannot be submitted without, labelled as they read on screen. */
const REQUIRED_FIELDS = [
  { field: "name", label: "Name" },
  { field: "phone", label: "Phone Number" },
  { field: "dob", label: "Date of Birth" },
  { field: "birthTime", label: "Birth Time" },
  { field: "birthPlace", label: "Birth Place" },
  { field: "service", label: "Service Type" },
  { field: "date", label: "Date" },
  { field: "time", label: "Preferred Time Slot" },
];

/** "Name, Phone Number and Birth Time" */
const listFields = (fields: string[]) => {
  const labels = REQUIRED_FIELDS.filter(({ field }) => fields.includes(field)).map((f) => f.label);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
};

interface BookingFormProps {
  region: Region;
  onSubmit: (data: Record<string, string>) => void;
}

const BookingForm = ({ region, onSubmit }: BookingFormProps) => {
  const brand = useBrand();
  const [searchParams] = useSearchParams();
  const [missing, setMissing] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    birthTime: "",
    birthPlace: "",
    accurateTime: "yes",
    notes: "",
    date: "",
    time: "",
    assignedTo: brand.name,
    service: "",
    amount: "",
    consultationNotes: "",
  });

  // Prefill from URL params
  useEffect(() => {
    const prefill: Record<string, string> = {};
    const mapping: Record<string, string> = {
      name: "name",
      phone: "phone",
      email: "email",
      dob: "dob",
      birthTime: "birthTime",
      birthPlace: "birthPlace",
      service: "service",
      amount: "amount",
    };
    Object.entries(mapping).forEach(([key, param]) => {
      const val = searchParams.get(param);
      if (val) prefill[key] = val;
    });
    if (Object.keys(prefill).length > 0) {
      setForm((prev) => ({ ...prev, ...prefill }));
    }
  }, [searchParams]);

  // Listen for service prefill from consultation types
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const match = SERVICES.find((s) => s.service === detail);
      if (match) setForm((prev) => ({ ...prev, service: match.service, amount: String(match.price[region]) }));
    };
    window.addEventListener("prefill-service", handler);
    return () => window.removeEventListener("prefill-service", handler);
  }, [region]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.service) return prev;
      const price = priceFor(prev.service, region);
      if (price === undefined || String(price) === prev.amount) return prev;
      return { ...prev, amount: String(price) };
    });
  }, [region]);

  const handleServiceChange = useCallback((value: string) => {
    if (value) setMissing((prev) => prev.filter((f) => f !== "service"));
    const price = priceFor(value, region);
    setForm((prev) => ({
      ...prev,
      service: value,
      amount: price !== undefined ? String(price) : prev.amount,
    }));
  }, [region]);

  const handleSelectPackage = useCallback((service: string) => {
    handleServiceChange(service);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [handleServiceChange]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Drop the field from the outstanding list as soon as it is filled in.
    if (value) setMissing((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const empty = REQUIRED_FIELDS.filter(({ field }) => !form[field as keyof typeof form]);
    setMissing(empty.map(({ field }) => field));
    if (empty.length > 0) return;
    onSubmit({ ...form, location: region === "nepal" ? "nepal" : "outside" });
  };

  const inputClass = "bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30";

  return (
    <section id="booking" className="pt-8 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-3">
            Book Your <span className="gradient-gold-text">Consultation</span>
          </h2>
          <div className="constellation-line w-24 mx-auto mt-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5 mb-10 items-stretch"
        >
          {SERVICES.map((pkg) => (
            <div
              key={pkg.title}
              className={`relative flex flex-col glass rounded-2xl p-6 md:p-7 ${
                pkg.recommended ? "border-2 border-gold/60 shadow-lg shadow-gold/10" : "border border-border/50"
              }`}
            >
              {pkg.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-background">
                  Recommended
                </span>
              )}
              <h3 className="font-serif text-lg font-semibold text-gold mb-3">{pkg.title}</h3>

              <div className="mb-4 border-b border-border/40 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{CURRENCY[region]}</span>
                    <span className="text-xl font-serif font-semibold text-foreground leading-none">{pkg.price[region].toLocaleString()}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" /> {pkg.duration}
                  </span>
                </div>
                {region === "international" && (
                  <p className="mt-1 text-[10px] text-muted-foreground">{NPR_EQUIVALENT_NOTE}</p>
                )}
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-4">{pkg.desc}</p>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-2">What you can expect</p>
              <ul className="space-y-1.5 mb-4">
                {pkg.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSelectPackage(pkg.service)}
                className={`mt-auto w-full rounded-xl py-2.5 text-sm font-semibold tracking-wide transition-colors ${
                  pkg.recommended
                    ? "btn-primary-glow"
                    : "border border-gold/50 text-gold hover:bg-gold/10"
                }`}
              >
                Book Now
              </button>
            </div>
          ))}
        </motion.div>

        <motion.form
          id="booking-form"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          noValidate
          className="glass-strong rounded-2xl p-6 md:p-10 space-y-8 scroll-mt-20 max-w-3xl mx-auto"
        >
          {/* Client Information */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold mb-5 flex items-center gap-2">
              <User className="h-4 w-4" /> Your Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Full name"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Phone Number *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Date of Birth *</Label>
                <div className="relative">
                  <Input
                    value={form.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                    type="date"
                    required
                    className={`${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Birth Time *</Label>
                <div className="relative">
                  <Input
                    value={form.birthTime}
                    onChange={(e) => handleChange("birthTime", e.target.value)}
                    type="time"
                    required
                    className={`${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Birth Place *</Label>
                <Input
                  value={form.birthPlace}
                  onChange={(e) => handleChange("birthPlace", e.target.value)}
                  placeholder="City, Country"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Accurate Birth Time?</Label>
                <Select value={form.accurateTime} onValueChange={(v) => handleChange("accurateTime", v)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No (approximate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-muted-foreground text-xs mb-1.5 block">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any specific questions or areas of life you'd like to focus on..."
                className={`${inputClass} min-h-[80px]`}
              />
            </div>
          </div>

          {/* Consultation Details */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold mb-5 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Consultation Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Date *</Label>
                <Input
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  type="date"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Service Type *</Label>
                <Select value={form.service} onValueChange={handleServiceChange}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s.service} value={s.service}>
                        {s.service} — {formatAmount(s.price[region], region)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">
                  Amount ({CURRENCY[region]})
                  {region === "international" && (
                    <span className="normal-case"> {NPR_EQUIVALENT_NOTE}</span>
                  )}
                </Label>
                <Input
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  placeholder="Auto-filled"
                  className={inputClass}
                  readOnly
                />
              </div>
            </div>

            {/* Time slot picker — NPT only */}
            <div className="mt-4">
              <h4 className="font-medium text-sm text-foreground mb-1">Preferred Time Slots *</h4>
              <p className="text-muted-foreground text-[11px] mb-3 leading-relaxed">
                All times are in Nepal Time (NPT). This is your <em>preferred</em> slot only.
              </p>
              <Select value={form.time} onValueChange={(v) => handleChange("time", v)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {NPT_SLOTS.map(({ h, m }) => {
                    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                    return (
                      <SelectItem key={value} value={value}>
                        {fmt12(h, m)} NPT
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/5 p-3">
                <MessageCircle className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/90 leading-relaxed">
                  Your final consultation time will be <strong className="text-gold">reconfirmed by our team via WhatsApp</strong> after booking. The slot you pick here is just your preference.
                </p>
              </div>
            </div>
          </div>

          {/* Button and message share one block so the form's row spacing does not
              leave a gap under the button while the message is empty. */}
          <div>
            <button
              type="submit"
              className="w-full btn-primary-glow rounded-xl py-4 text-base font-semibold tracking-wide"
            >
              Schedule Consultation
            </button>

            <p aria-live="polite" className="text-center text-sm font-medium text-destructive empty:hidden mt-3">
              {missing.length > 0 && `Please fill in ${listFields(missing)} before scheduling.`}
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default BookingForm;
