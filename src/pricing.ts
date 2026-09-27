/** Where the client is booking from. Chosen on the region gate before the site renders. */
export type Region = "nepal" | "international";

export const CURRENCY: Record<Region, string> = {
  nepal: "NPR",
  international: "USD",
};

/** "NPR 1,000" / "USD 15" — the form of the amount used everywhere it is shown. */
export const formatAmount = (amount: number | string, region: Region) =>
  `${CURRENCY[region]} ${Number(amount || 0).toLocaleString()}`;

/** Payments land in a Nepali (NPR) account, so USD prices are settled at the NPR equivalent. */
export const NPR_EQUIVALENT_NOTE = "(Equivalent in NPR)";

/** Amount as the client pays it — USD prices carry the NPR-equivalent note. */
export const formatPayableAmount = (amount: number | string, region: Region) =>
  region === "international"
    ? `${formatAmount(amount, region)} ${NPR_EQUIVALENT_NOTE}`
    : formatAmount(amount, region);

export interface Service {
  /** Card heading. */
  title: string;
  /** Canonical name stored on the booking and sent to the webhook. */
  service: string;
  price: Record<Region, number>;
  duration: string;
  recommended: boolean;
  desc: string;
  points: string[];
}

export const SERVICES: Service[] = [
  {
    title: "General Consultation",
    service: "General Consultation",
    price: { nepal: 1000, international: 15 },
    duration: "30 min",
    recommended: false,
    desc: "Get a clear understanding of your life's major themes through your birth chart. Explore career, relationships, finances, family, and important upcoming phases through your Dasha and Navamsha (D9).",
    points: [
      "Key strengths and challenges in your chart",
      "Important periods and upcoming changes",
      "Guidance across major areas of life",
      "Practical astrological insights based on your chart",
    ],
  },
  {
    title: "In-Depth Consultation",
    service: "In-Depth Consultation",
    price: { nepal: 2000, international: 30 },
    duration: "60 min",
    recommended: true,
    desc: "A deeper analysis for those looking beyond general predictions. We examine your chart from multiple layers to understand why certain patterns occur, when they are likely to unfold, and how to navigate them.",
    points: [
      "Detailed analysis of one chosen life area",
      "Dasha and timing analysis",
      "Strength of planets and houses through Shadbala & Bhavabala",
      "Deeper insights using D1, D9, D10 and relevant divisional charts",
      "Personalized guidance and traditional remedies where appropriate",
    ],
  },
  {
    title: "Matchmaking & Couple",
    service: "Matchmaking & Couple Consultation",
    price: { nepal: 3000, international: 50 },
    duration: "1 hr 15 min",
    recommended: false,
    desc: "Compatibility goes far beyond Guna Milan. Understand how two individuals connect emotionally, mentally, practically, and in the long term — before taking an important step together.",
    points: [
      "Individual analysis of both birth charts",
      "Emotional and relationship compatibility",
      "Communication, family, financial and lifestyle compatibility",
      "Dosha analysis and its practical significance",
      "Strengths, challenges, and areas that may require understanding or adjustment",
    ],
  },
];

export const priceFor = (service: string, region: Region) =>
  SERVICES.find((s) => s.service === service)?.price[region];

/** Offered to clients outside Nepal alongside the QR. */
export type PaymentMethod = "qr" | "bank";

export const BANK_DETAILS: { label: string; value: string }[] = [
  { label: "Bank name", value: "NMB Bank Limited" },
  { label: "Account number", value: "2170260471900016" },
  { label: "Account holder's name", value: "Shirish Karmacharya" },
  { label: "Branch", value: "Gatthaghar, Bhaktapur" },
  { label: "Branch code", value: "217" },
  { label: "Location", value: "Kaulshaltar, Bhaktapur" },
  { label: "Phone number", value: "9766386047" },
  { label: "eSewa", value: "9864333517" },
  { label: "SWIFT code", value: "NMBBNPKA" },
  { label: "Email address", value: "karmacharyashirish7@gmail.com" },
];

export const WHATSAPP_NUMBER = "9779705216077";
