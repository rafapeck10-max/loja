import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Search, XCircle } from "lucide-react";
import { MAX_INSTALLMENTS, WHATSAPP_URL } from "@/lib/constants";
import { trackCheckCep, trackWhatsAppClick } from "@/lib/analytics";
import {
  formatCep,
  lookupCepWithCoverage,
  normalizeCepDigits,
  readSavedCep,
  saveLastCep,
  type CepCoverageResult,
} from "@/lib/delivery-coverage";

interface CepCoverageCheckerProps {
  productName?: string;
  initialCep?: string;
  onResolved?: (result: CepCoverageResult) => void;
}

function formatAddressLine(result: CepCoverageResult): string {
  if (!result.address) return "";
  const cityUf = [result.address.localidade, result.address.uf].filter(Boolean).join(" - ");
  return [result.address.logradouro, result.address.bairro, cityUf].filter(Boolean).join(" · ");
}

function buildConsultWhatsappUrl(cep: string, productName?: string): string {
  const productClause = productName ? ` sobre "${productName}"` : "";
  const text = `Olá, Mobi! Consultei meu CEP ${cep}${productClause} e gostaria de confirmar a disponibilidade de entrega.`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

export function CepCoverageChecker({
  productName,
  initialCep,
  onResolved,
}: CepCoverageCheckerProps) {
  const inputId = useId();
  const [cepInput, setCepInput] = useState(() => (initialCep ? formatCep(initialCep) : ""));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CepCoverageResult | null>(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const runLookup = async (rawCep: string) => {
    const digits = normalizeCepDigits(rawCep);
    setLoading(true);
    try {
      const next = await lookupCepWithCoverage(rawCep);
      setResult(next);
      if (digits.length === 8 && next.status !== "invalid" && next.status !== "not_found") {
        saveLastCep(digits);
      }
      trackCheckCep({
        status: next.status,
        cep: next.cep,
        city: next.address?.localidade,
        uf: next.address?.uf,
      });
      onResolvedRef.current?.(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const candidate = initialCep ? formatCep(initialCep) : readSavedCep();
    if (!candidate) return;
    setCepInput(candidate);
    const digits = normalizeCepDigits(candidate);
    if (digits.length !== 8) return;
    let active = true;
    setLoading(true);
    void lookupCepWithCoverage(digits)
      .then((resolved) => {
        if (!active) return;
        setResult(resolved);
        onResolvedRef.current?.(resolved);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialCep]);

  const addressLine = result ? formatAddressLine(result) : "";

  return (
    <div className="mobi-cep-checker" role="search" aria-label="Consultar cobertura por CEP">
      <div className="mobi-cep-checker-head">
        <label htmlFor={inputId} className="mobi-cep-checker-label">
          <MapPin size={15} aria-hidden="true" />
          <span>Consultar frete grátis e prazo pelo CEP</span>
        </label>
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="mobi-cep-checker-help"
        >
          Não sei meu CEP
        </a>
      </div>

      <div className="mobi-cep-checker-row">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          maxLength={9}
          value={cepInput}
          onChange={(event) => {
            const nextFormatted = formatCep(event.target.value);
            setCepInput(nextFormatted);
            if (!nextFormatted) setResult(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runLookup(cepInput);
            }
          }}
          aria-label="Digite seu CEP para consultar entrega"
          className="mobi-cep-checker-input"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void runLookup(cepInput)}
          className="mobi-cep-checker-button"
        >
          <Search size={15} aria-hidden="true" />
          <span>{loading ? "Consultando..." : "Consultar"}</span>
        </button>
      </div>

      <div aria-live="polite" className="mobi-cep-checker-live">
        {result && result.status === "eligible" && (
          <div className="mobi-cep-result is-eligible">
            <CheckCircle2 size={18} aria-hidden="true" className="mobi-cep-result-icon" />
            <div className="min-w-0">
              {addressLine ? <p className="mobi-cep-result-address">{addressLine}</p> : null}
              <p className="mobi-cep-result-title">
                Frete grátis · entrega em {result.deadlineLabel ?? "até 7 dias úteis"}
              </p>
              <p className="mobi-cep-result-sub">
                Pagamento somente na entrega (Pix com desconto, dinheiro ou cartão em até{" "}
                {MAX_INSTALLMENTS}x).
              </p>
              {result.accessNote ? (
                <p className="mobi-cep-result-note">{result.accessNote}</p>
              ) : null}
              {result.lookupWarning ? (
                <p className="mobi-cep-result-note">{result.lookupWarning}</p>
              ) : null}
            </div>
          </div>
        )}

        {result && result.status === "excluded_belford_roxo" && (
          <div className="mobi-cep-result is-excluded" role="status">
            <XCircle size={18} aria-hidden="true" className="mobi-cep-result-icon" />
            <div className="min-w-0">
              {addressLine ? <p className="mobi-cep-result-address">{addressLine}</p> : null}
              <p className="mobi-cep-result-title">Não realizamos entregas em Belford Roxo.</p>
              <p className="mobi-cep-result-sub">
                Caso tenha outro endereço dentro da área atendida (raio de 30 km a partir de Nova
                Iguaçu), consulte pelo WhatsApp.
              </p>
              <a
                href={buildConsultWhatsappUrl(result.cep, productName)}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackWhatsAppClick({ source: "cep_checker", productName })}
                className="mobi-cep-result-link"
              >
                Consultar outro endereço no WhatsApp
              </a>
            </div>
          </div>
        )}

        {result && result.status === "out_of_area" && (
          <div className="mobi-cep-result is-out" role="status">
            <AlertTriangle size={18} aria-hidden="true" className="mobi-cep-result-icon" />
            <div className="min-w-0">
              {addressLine ? <p className="mobi-cep-result-address">{addressLine}</p> : null}
              <p className="mobi-cep-result-title">
                Este CEP fica fora da área padrão de frete grátis (raio de 30 km a partir de Nova
                Iguaçu).
              </p>
              <p className="mobi-cep-result-sub">
                Fale com nossa equipe pelo WhatsApp para verificar alternativas para sua região.
              </p>
              <a
                href={buildConsultWhatsappUrl(result.cep, productName)}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackWhatsAppClick({ source: "cep_checker", productName })}
                className="mobi-cep-result-link"
              >
                Confirmar atendimento no WhatsApp
              </a>
            </div>
          </div>
        )}

        {result && (result.status === "not_found" || result.status === "invalid") && (
          <div className="mobi-cep-result is-error" role="alert">
            <AlertTriangle size={17} aria-hidden="true" className="mobi-cep-result-icon" />
            <p className="mobi-cep-result-title">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
