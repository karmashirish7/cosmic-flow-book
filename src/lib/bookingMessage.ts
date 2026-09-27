import { formatPayableAmount, type Region } from "@/pricing";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

interface BookingMessageArgs {
  brandName: string;
  amount: number;
  region: Region;
  bookingData: Record<string, string>;
  /** Closing line describing how the client paid. */
  paymentLine: string;
}

/** The WhatsApp confirmation a client sends after paying, shared by every payment method. */
export const buildBookingMessage = ({
  brandName,
  amount,
  region,
  bookingData,
  paymentLine,
}: BookingMessageArgs) => {
  const birthDetails = [bookingData.dob, bookingData.birthTime, bookingData.birthPlace]
    .filter(Boolean)
    .join(", ");

  const lines: (string | null)[] = [
    `Namaste! I'd like to confirm my consultation booking with *${brandName}*.`,
    ``,
    `*Booking Details:*`,
    `• *Service:* ${bookingData.service}`,
    `• *Amount Paid:* ${formatPayableAmount(amount, region)}`,
    `• *Preferred Date:* ${formatDate(bookingData.date)}`,
    `• *Preferred Time:* ${bookingData.time} NPT`,
    `• *Booking From:* ${region === "nepal" ? "Within Nepal" : "Outside Nepal"}`,
    bookingData.email ? `• *Email:* ${bookingData.email}` : null,
    `• *Phone:* ${bookingData.phone}`,
  ];

  if (birthDetails) {
    lines.push(``, `*Birth Details:*`, `${birthDetails}`);
  }

  if (bookingData.notes) {
    lines.push(``, `*Notes:*`, `${bookingData.notes}`);
  }

  lines.push(``, paymentLine);

  return lines.filter((l) => l !== null).join("\n");
};
