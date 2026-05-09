import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User } from "lucide-react";
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

const fmt12 = (h: number, m: number) => {
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
};

// 7:00 AM → 8:30 PM NPT, every 30 min
const NPT_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  return { h: Math.floor(total / 60), m: total % 60 };
});

const serviceOptions = [
  { value: "General Consultation", price: 1000 },
  { value: "In-Depth Consultation", price: 2000 },
  { value: "Matchmaking & Couple Consultation", price: 3000 },
];

interface BookingFormProps {
  onSubmit: (data: Record<string, string>) => void;
}

const BookingForm = ({ onSubmit }: BookingFormProps) => {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    birthTime: "",
    birthPlace: "",
    accurateTime: "yes",
    location: "nepal",
    notes: "",
    date: "",
    time: "",
    assignedTo: "Akashvani Astrology",
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
      const match = serviceOptions.find((s) => s.value === detail);
      if (match) setForm((prev) => ({ ...prev, service: match.value, amount: String(match.price) }));
    };
    window.addEventListener("prefill-service", handler);
    return () => window.removeEventListener("prefill-service", handler);
  }, []);

  const handleServiceChange = useCallback((value: string) => {
    const match = serviceOptions.find((s) => s.value === value);
    setForm((prev) => ({
      ...prev,
      service: value,
      amount: match ? String(match.price) : prev.amount,
    }));
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.dob || !form.birthTime || !form.birthPlace || !form.date || !form.time || !form.service) return;
    onSubmit(form);
  };

  const inputClass = "bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30";

  return (
    <section id="booking" className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-gold mb-4 block">
            Schedule Now
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            Book Your <span className="gradient-gold-text">Consultation</span>
          </h2>
          <div className="constellation-line w-24 mx-auto mt-6" />
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass-strong rounded-2xl p-6 md:p-10 space-y-8"
        >
          {/* Client Information */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold mb-5 flex items-center gap-2">
              <User className="h-4 w-4" /> Client Information
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
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Current Location *</Label>
                <Select value={form.location} onValueChange={(v) => handleChange("location", v)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nepal">Nepal</SelectItem>
                    <SelectItem value="outside">Outside Nepal</SelectItem>
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
                    {serviceOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.value} — NPR {s.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Amount (NPR)</Label>
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
                All times are in Nepal Time (NPT). Actual consultation time will be confirmed via WhatsApp.
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
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary-glow rounded-xl py-4 text-base font-semibold tracking-wide"
          >
            Schedule Consultation
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default BookingForm;
