import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { blackFridayTimeLeft } from "@/lib/black-friday-countdown";

export function BlackFridayCountdown() {
  // A stable first render avoids a server/client hydration mismatch.
  const [remaining, setRemaining] = useState<ReturnType<typeof blackFridayTimeLeft> | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      const next = blackFridayTimeLeft(Date.now());
      setRemaining(next);
      if (next.expired && interval !== undefined) clearInterval(interval);
      return next.expired;
    };
    if (!update()) interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-label="Prazo da Black Friday Mobi"
      className="mt-3 rounded-xl border border-[#c0a264]/50 bg-[#111111] p-4 text-white"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-[#e2c98f]">
        <Timer size={18} aria-hidden="true" />
        {remaining?.expired ? "Black Friday encerrada" : "A Black Friday termina em"}
      </p>
      {!remaining?.expired && (
        <div role="timer" aria-live="off" className="mt-3 grid grid-cols-4 gap-2 text-center">
          {([
            ["dias", remaining?.days],
            ["horas", remaining?.hours],
            ["min", remaining?.minutes],
            ["seg", remaining?.seconds],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white/10 px-1 py-2">
              <span className="block text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                {value === undefined ? "--" : String(value).padStart(2, "0")}
              </span>
              <span className="mt-1 block text-xs text-white/75">{label}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-white/75">
        {remaining?.expired
          ? "O prazo terminou. Consulte os preços e a disponibilidade atuais com a Mobi."
          : "Até o fim de 27/11/2026 · horário de Brasília."}
      </p>
    </section>
  );
}
