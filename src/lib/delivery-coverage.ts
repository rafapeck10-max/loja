export interface CepAddress {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export type CepCoverageStatus =
  "eligible" | "excluded_belford_roxo" | "out_of_area" | "not_found" | "invalid";

export interface CepCoverageResult {
  status: CepCoverageStatus;
  cep: string;
  digits: string;
  freeShipping: boolean;
  deadlineLabel?: string;
  regionLabel?: string;
  accessNote?: string;
  address: CepAddress | null;
  addressResolved: boolean;
  lookupWarning?: string;
  message: string;
}

export interface CepPrefixRange {
  start: number;
  end: number;
  regionLabel: string;
}

/** Exact 13 five-digit CEP prefix ranges aligned with Google Merchant Center ("Shipping Policy 8 21"). */
export const FREE_SHIPPING_CEP_RANGES: readonly CepPrefixRange[] = [
  { start: 26000, end: 26099, regionLabel: "Nova Iguaçu" },
  { start: 26200, end: 26299, regionLabel: "Nova Iguaçu" },
  { start: 26300, end: 26399, regionLabel: "Queimados" },
  { start: 26400, end: 26499, regionLabel: "Japeri" },
  { start: 26500, end: 26549, regionLabel: "Nilópolis" },
  { start: 26550, end: 26599, regionLabel: "Mesquita" },
  { start: 26600, end: 26649, regionLabel: "Paracambi" },
  { start: 25000, end: 25499, regionLabel: "Duque de Caxias" },
  { start: 25500, end: 25599, regionLabel: "São João de Meriti" },
  { start: 23890, end: 23899, regionLabel: "Seropédica" },
  {
    start: 20010,
    end: 21949,
    regionLabel: "Rio de Janeiro (Zona Norte / bairros próximos)",
  },
  {
    start: 22710,
    end: 22785,
    regionLabel: "Rio de Janeiro (Jacarepaguá / Zona Oeste próxima)",
  },
  {
    start: 23000,
    end: 23099,
    regionLabel: "Rio de Janeiro (Campo Grande / Zona Oeste próxima)",
  },
] as const;

export const BELFORD_ROXO_RANGE = [26100, 26199] as const;

const FREE_DELIVERY_DEADLINE = "até 7 dias úteis";
const ACCESS_CAVEAT =
  "Entrega sujeita à confirmação de acesso livre na rua (não atendemos áreas com barricadas ou restrição de acesso).";
const SAVED_CEP_STORAGE_KEY = "mobi:last-cep";

export function normalizeCepDigits(value: string): string {
  return String(value ?? "")
    .replace(/\D+/g, "")
    .slice(0, 8);
}

export function formatCep(value: string): string {
  const digits = normalizeCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeCityName(value: string | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function evaluateCepCoverage(
  cep: string,
  address: CepAddress | null = null,
): CepCoverageResult {
  const digits = normalizeCepDigits(cep);
  const formatted = formatCep(digits);

  if (digits.length !== 8 || /^(\d)\1{7}$/.test(digits)) {
    return {
      status: "invalid",
      cep: formatted,
      digits,
      freeShipping: false,
      address: null,
      addressResolved: false,
      message: "Informe um CEP válido com 8 dígitos (ex.: 26015-000).",
    };
  }

  const prefix = Number(digits.slice(0, 5));
  const normalizedAddress = address
    ? {
        logradouro: address.logradouro?.trim() || undefined,
        bairro: address.bairro?.trim() || undefined,
        localidade: address.localidade?.trim() || undefined,
        uf: address.uf?.trim().toUpperCase() || undefined,
      }
    : null;
  const addressResolved = Boolean(normalizedAddress?.localidade);

  if (
    (prefix >= BELFORD_ROXO_RANGE[0] && prefix <= BELFORD_ROXO_RANGE[1]) ||
    normalizeCityName(normalizedAddress?.localidade) === "belford roxo"
  ) {
    return {
      status: "excluded_belford_roxo",
      cep: formatted,
      digits,
      freeShipping: false,
      address: normalizedAddress,
      addressResolved,
      message:
        "Não realizamos entregas em Belford Roxo. Se preferir receber em outro endereço da região atendida, consulte nossa equipe pelo WhatsApp.",
    };
  }

  if (normalizedAddress?.uf && normalizedAddress.uf !== "RJ") {
    return {
      status: "out_of_area",
      cep: formatted,
      digits,
      freeShipping: false,
      address: normalizedAddress,
      addressResolved,
      message:
        "Este CEP fica fora da área padrão de frete grátis (raio de 30 km a partir de Nova Iguaçu - RJ).",
    };
  }

  const matchedRange = FREE_SHIPPING_CEP_RANGES.find(
    (range) => prefix >= range.start && prefix <= range.end,
  );
  if (matchedRange) {
    return {
      status: "eligible",
      cep: formatted,
      digits,
      freeShipping: true,
      deadlineLabel: FREE_DELIVERY_DEADLINE,
      regionLabel: matchedRange.regionLabel,
      accessNote: ACCESS_CAVEAT,
      address: normalizedAddress,
      addressResolved,
      message: `Frete grátis para ${normalizedAddress?.localidade || matchedRange.regionLabel} · entrega em ${FREE_DELIVERY_DEADLINE}.`,
    };
  }

  return {
    status: "out_of_area",
    cep: formatted,
    digits,
    freeShipping: false,
    address: normalizedAddress,
    addressResolved,
    message:
      "Este CEP fica fora da área padrão de frete grátis (raio de 30 km a partir de Nova Iguaçu).",
  };
}

export async function lookupCepWithCoverage(
  cep: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CepCoverageResult> {
  const digits = normalizeCepDigits(cep);
  const localBaseline = evaluateCepCoverage(digits, null);
  if (localBaseline.status === "invalid") return localBaseline;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller !== null ? setTimeout(() => controller.abort(), 4500) : undefined;

  try {
    const response = await fetchImpl(`https://viacep.com.br/ws/${digits}/json/`, {
      headers: { Accept: "application/json" },
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (!response.ok) {
      throw new Error(`ViaCEP HTTP ${response.status}`);
    }
    const payload = (await response.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    } | null;

    if (payload && (payload.erro === true || payload.erro === "true")) {
      return {
        status: "not_found",
        cep: formatCep(digits),
        digits,
        freeShipping: false,
        address: null,
        addressResolved: false,
        message: "CEP não encontrado. Confira os 8 dígitos ou tente outro CEP.",
      };
    }

    return evaluateCepCoverage(digits, {
      logradouro: payload?.logradouro,
      bairro: payload?.bairro,
      localidade: payload?.localidade,
      uf: payload?.uf,
    });
  } catch {
    return {
      ...localBaseline,
      addressResolved: false,
      lookupWarning:
        "Consulta de endereço indisponível no momento; validamos a cobertura pela faixa do CEP.",
    };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function readSavedCep(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(SAVED_CEP_STORAGE_KEY) ?? "";
    const digits = normalizeCepDigits(raw);
    return digits.length === 8 ? formatCep(digits) : "";
  } catch {
    return "";
  }
}

export function saveLastCep(cep: string): void {
  if (typeof window === "undefined") return;
  const digits = normalizeCepDigits(cep);
  if (digits.length !== 8) return;
  try {
    window.localStorage.setItem(SAVED_CEP_STORAGE_KEY, digits);
  } catch {
    // Storage failures must never block CEP consultation.
  }
}
