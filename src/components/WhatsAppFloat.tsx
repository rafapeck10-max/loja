import { WHATSAPP_URL } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-24 right-4 z-[1001] flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition-transform duration-300 hover:scale-110 md:bottom-6 md:right-6 md:z-[1000]"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
