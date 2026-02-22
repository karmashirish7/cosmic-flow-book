import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/9779705216077"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#25D366]/30"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
};

export default WhatsAppButton;
